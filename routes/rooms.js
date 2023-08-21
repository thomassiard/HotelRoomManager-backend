import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// Definiranje Mongoose modela za sobu
const roomSchema = new mongoose.Schema({
  room_number: Number,
  // Ostala svojstva sobe...
});

const Room = mongoose.model("Room", roomSchema);

router.get("/:room_number", async (req, res) => {
  try {
    const room_number = req.params.room_number;
    console.log(room_number);

    // Traženje sobe prema broju sobe pomoću Mongoose modela
    const room = await Room.find({ room_number });
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

export default router;
