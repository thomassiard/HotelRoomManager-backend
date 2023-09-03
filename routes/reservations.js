import express from "express";
import connect from "../db.js";
import { DBRef } from "mongodb";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import moment from "moment";

const router = express.Router();

router.get("/all-rooms", async (req, res) => {
  try {
    // Query the database to get all rooms
    const db = await connect("HRM");
    const roomsCollection = db.collection("Rooms");

    const pipeline = [
      {
        $lookup: {
          from: "Room-type",
          localField: "room_type.$id",
          foreignField: "_id",
          as: "type_details",
        },
      },
      {
        $unwind: "$type_details",
      },
      {
        $project: {
          _id: 1,
          room_number: 1,
          room_type: "$type_details.name",
          room_price: "$type_details.price_euro",
        },
      },
    ];

    const allRooms = await roomsCollection.aggregate(pipeline).toArray();

    // Query the reservations collection to get reservations that overlap with the current date
    const reservationsCollection = db.collection("Reservations");
    const currentDate = moment().format("YYYY-MM-DD");

    const activeReservations = await reservationsCollection
      .find({
        check_in: { $lte: currentDate },
        check_out: { $gte: currentDate },
      })
      .toArray();

    // Create a map to track occupied room IDs
    const occupiedRoomMap = {};
    activeReservations.forEach((reservation) => {
      const room_id = reservation.room_id.oid.toString();
      occupiedRoomMap[room_id] = true;
    });

    // Add the `isOccupied` attribute to each room based on occupancy status
    const roomsWithOccupancy = allRooms.map((room) => ({
      ...room,
      isOccupied: occupiedRoomMap[room._id.toString()] ? true : false,
    }));

    const sortedRooms = roomsWithOccupancy.sort(
      (a, b) => a.room_number - b.room_number
    );

    res.json({ roomsWithOccupancy: sortedRooms });
  } catch (error) {
    console.error("Error fetching rooms with occupancy status:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// Define a route to get available rooms
router.get("/available-rooms", async (req, res) => {
  try {
    const { checkin, checkout } = req.query;

    // Parse checkin and checkout dates using Moment.js
    const checkinDate = moment(checkin, "YYYY-MM-DD");
    const checkoutDate = moment(checkout, "YYYY-MM-DD");

    // Query the database to find available rooms during the specified dates
    const db = await connect("HRM");
    const reservationsCollection = db.collection("Reservations");

    const availableRooms = await reservationsCollection
      .aggregate([
        // {
        //   $match: {
        //     $nor: [
        //       {
        //         $and: [
        //           { check_in: { $lte: checkoutDate.toDate() } },
        //           { check_out: { $gte: checkinDate.toDate() } },
        //         ],
        //       },
        //     ],
        //   },
        // },
        {
          $lookup: {
            from: "Rooms",
            localField: "room_id.$id",
            foreignField: "_id",
            as: "room",
          },
        },
        {
          $unwind: "$room",
        },
        {
          $project: {
            _id: "$room._id",
            room_number: "$room.room_number",
            room_type: "$room.room_type",
          },
        },
      ])
      .toArray();

    res.json({ availableRooms });
  } catch (error) {
    console.error("Error fetching available rooms:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// // Nova ruta za provjeru dostupnosti soba
// router.get("/available-rooms", async (req, res) => {
//   try {
//     const { checkin, checkout, room_type } = req.query;

//     const isAvailable = await checkRoomAvailability(
//       checkin,
//       checkout,
//       room_type
//     );

//     const db = await connect("HRM");
//     const roomsCollection = db.collection("Rooms");

//     const rooms = await roomsCollection.find().toArray();

//     const roomStatus = {};

//     // Iterirajte kroz sve sobe i postavite status za svaku sobu
//     rooms.forEach((room) => {
//       const roomId = room._id.toString();
//       roomStatus[roomId] = true ? "Available" : "Reserved";
//     });

//     res.json({
//       message: true ? "Success" : "Sorry, we are full",
//       roomStatus,
//     });
//   } catch (error) {
//     console.error("Error while fetching available rooms:", error);
//     res.status(500).json({ message: "An error occurred" });
//   }
// });

router.post("/", async (req, res) => {
  try {
    const {
      email,
      check_in,
      check_out,
      adults,
      kids,
      room_type,
      type_of_payment,
    } = req.body;

    const db = await connect("HRM");
    const reservationCollection = db.collection("Reservations");
    const usersCollection = db.collection("users");
    const roomsCollection = db.collection("Rooms");
    const room_typeCollection = db.collection("Room-type");
    const method_of_paymentCollection = db.collection("Method-of-payment");

    const method_of_payment = await method_of_paymentCollection.findOne({
      type_of_payment,
    });

    if (!method_of_payment) {
      return res.status(404).json({ message: "Method of payment not found" });
    }

    const roomtype = await room_typeCollection.findOne({ name: room_type });

    if (!roomtype) {
      return res.status(404).json({ message: "Room type not found" });
    }

    const room = await roomsCollection.findOne({
      "room_type.$id": roomtype._id,
    });

    if (!room) {
      return res.status(400).json({ message: "Room not available" });
    }

    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newReservation = {
      user_id: new DBRef("users", user._id),
      check_in,
      check_out,
      adults,
      kids,
      room_id: new DBRef("Rooms", room._id),
      method_of_payment_id: new DBRef(
        "Method-of-payment",
        method_of_payment._id
      ),
    };

    await reservationCollection.insertOne(newReservation);

    res.status(201).json({ message: "Reservation added successfully" });
  } catch (error) {
    console.error("Reservation error:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// PATCH route for updating reservations
router.put("/:reservationId", async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { check_in, check_out, adults, kids, room_type, type_of_payment } =
      req.body;

    const db = await connect("HRM");
    const reservationCollection = db.collection("Reservations");
    const roomsCollection = db.collection("Rooms");
    const method_of_paymentCollection = db.collection("Method-of-payment");

    const method_of_payment = await method_of_paymentCollection.findOne({
      type_of_payment,
    });

    if (!method_of_payment) {
      return res.status(404).json({ message: "Method of payment not found" });
    }

    const room = await roomsCollection.findOne({ room_type });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const updatedReservation = {
      check_in,
      check_out,
      adults,
      kids,
      room_id: new DBRef("Rooms", room._id),
      method_of_payment_id: new DBRef(
        "Method-of-payment",
        method_of_payment._id
      ),
    };

    const updateResult = await reservationCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(reservationId) },
      { $set: updatedReservation }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    res.json({ message: "Reservation updated successfully" });
  } catch (error) {
    console.error("Update reservation error:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// GET route for retrieving a single reservation by its ObjectId
router.get("/:reservationId", async (req, res) => {
  try {
    const { reservationId } = req.params;
    console.log(reservationId);
    const db = await connect("HRM");
    const reservationCollection = db.collection("Reservations");

    const reservation = await reservationCollection.findOne({
      _id: ObjectId(reservationId),
    });

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    res.json(reservation);
  } catch (error) {
    console.error("Get reservation error:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// GET ruta za dohvaćanje svih rezervacija
router.get("/", async (req, res) => {
  try {
    const db = await connect("HRM");
    const reservationCollection = db.collection("Reservations");

    const reservations = await reservationCollection.find({}).toArray();

    res.json(reservations);
  } catch (error) {
    console.error("Greška prilikom dohvaćanja rezervacija:", error);
    res.status(500).json({ message: "Došlo je do pogreške" });
  }
});

// DELETE ruta za brisanje jedne rezervacije putem ObjectId-a
router.delete("/:reservationId", async (req, res) => {
  try {
    const { reservationId } = req.params;

    const db = await connect("HRM");
    const reservationCollection = db.collection("Reservations");

    const deleteResult = await reservationCollection.deleteOne({
      _id: new ObjectId(reservationId),
    });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ message: "Rezervacija nije pronađena" });
    }

    res.json({ message: "Rezervacija je uspješno izbrisana" });
  } catch (error) {
    console.error("Greška prilikom brisanja rezervacije:", error);
    res.status(500).json({ message: "Došlo je do pogreške" });
  }
});

// Funkcija za provjeru dostupnosti soba
async function checkRoomAvailability(checkin, checkout, roomType) {
  const db = await connect("HRM");
  const reservationCollection = db.collection("Reservations");
  //const roomsCollection = db.collection("Rooms");
  console.log("feiasfeiufhiauehf");

  const checkinDate = moment(checkin);
  const checkoutDate = moment(checkout);
  const reservations = await reservationCollection
    .find({
      // $or: [
      //   {
      //     $and: [
      //       { check_in: { $lt: checkinDate.toDate() } },
      //       { check_out: { $gt: checkinDate.toDate() } },
      //     ],
      //   },
      //   {
      //     $and: [
      //       { check_in: { $lt: checkoutDate.toDate() } },
      //       { check_out: { $gt: checkoutDate.toDate() } },
      //     ],
      //   },
      // ],
      $nor: [
        {
          $and: [
            { checkin: { $lte: checkoutDate.toDate() } },
            { checkout: { $gte: checkinDate.toDate() } },
          ],
        },
      ],
      //...(roomType ? { "room_id.$id": new ObjectId(roomType) } : {}),
    })
    .toArray();

  const reservedRoomIds = reservations.map(
    (reservation) => reservation.room_id._id
  );

  console.log(reservedRoomIds);
  return reservedRoomIds;

  // const availableRooms = await roomsCollection
  //   .find({
  //     ...(roomType ? { _id: new ObjectId(roomType) } : {}),
  //     _id: { $nin: reservedRoomIds },
  //   })
  //   .toArray();

  //return availableRooms.length > 0;
}

export default router;
