import express from "express";
import connect from "../db.js";
import moment from "moment";

const router = express.Router();

// Define a route to get a room by room number
router.get("/:roomNumber", async (req, res) => {
  try {
    const roomNumber = parseInt(req.params.roomNumber); // Parse roomNumber as an integer

    // Fetch the room by room number from the database
    const db = await connect("HRM");
    const roomsCollection = db.collection("Rooms");
    const room = await roomsCollection.findOne({ room_number: roomNumber });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const currentDate = moment().format("YYYY-MM-DD");

    const pipeline = [
      {
        $match: {
          check_in: { $lte: currentDate },
          check_out: { $gte: currentDate },
          "room_id.$id": room._id,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id.$id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          roomNumber: roomNumber,
          fullName: "$user.fullName",
          phoneNumber: "$user.phoneNumber",
          email: "$user.email",
          adults: 1,
          kids: 1,
          checkInDate: "$check_in",
          checkOutDate: "$check_out",
          typeOfPayment: "$method_of_payment_id",
        },
      },
    ];

    // Fetch user information from the reservation
    const reservationsCollection = db.collection("Reservations");
    let reservation = await reservationsCollection
      .aggregate(pipeline)
      .toArray();

    reservation = reservation[0];

    if (!reservation) {
      return res
        .status(404)
        .json({ message: "Reservation not found for this room" });
    }

    // Fetch method of payment information
    const methodOfPaymentCollection = db.collection("Method-of-payment");
    const methodOfPayment = await methodOfPaymentCollection.findOne({
      _id: reservation.typeOfPayment.oid,
    });

    // Fetch room type information
    const roomTypeCollection = db.collection("Room-type");
    const roomType = await roomTypeCollection.findOne({
      _id: room.room_type.oid,
    });

    // Return the combined room information
    res.json({
      roomNumber: roomNumber,
      fullName: reservation.fullName,
      phoneNumber: reservation.phoneNumber,
      email: reservation.email,
      roomType: roomType.name,
      adults: reservation.adults,
      kids: reservation.kids,
      checkInDate: reservation.checkInDate,
      checkOutDate: reservation.checkOutDate,
      typeOfPayment: methodOfPayment.type_of_payment,
    });
  } catch (error) {
    console.error("Error fetching room by number:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

router.get("/", async (req, res) => {
  try {
    const db = await connect("HRM");
    const RoomsCollection = db.collection("Rooms");

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

    const rooms = await RoomsCollection.aggregate(pipeline).toArray();

    if (rooms.length > 0) {
      res.status(200).json({ message: rooms });
    } else {
      res.status(404).json({ message: "No rooms" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

export default router;
