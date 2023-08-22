import express from "express";
import mongoose from "mongoose";
import connect from "../db.js";

const router = express.Router();

router.get("/:room_number", async (req, res) => {
  try {
    const room_number = Number(req.params.room_number);
    console.log(room_number);

    const db = await connect("HRM");
    const RoomsCollection = db.collection("Rooms");

    const room = await RoomsCollection.findOne({ room_number });
    console.log(room);

    if (room) {
      res.status(200).json({ message: room });
    } else {
      res.status(404).json({ message: "Room not found" });
    }
  } catch (error) {
    console.error("Error:", error);
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
          from: "Room-type", // the collection to join with
          localField: "room_type.$id", // the field from the input documents
          foreignField: "_id", // the field from the documents of the "from" collection
          as: "type_details", // the name of the new array field to add to the input documents
        },
      },
      {
        $unwind: "$type_details", // deconstruct the type_details array field
      },
      {
        $project: {
          _id: 1, // include the _id field
          room_number: 1, // include the room_number field
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
