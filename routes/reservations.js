import express from "express";
import connect from "../db.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      user_id,
      check_in,
      check_out,
      adults,
      kids,
      room_number,
      type_of_payment,
    } = req.body;

    const db = await connect("HRM");
    const reservationCollection = db.collection("Reservations");

    const newReservation = {
      user_id,
      check_in,
      check_out,
      adults,
      kids,
      room_number,
      type_of_payment,
    };

    await reservationCollection.insertOne(newReservation);

    res.status(201).json({ message: "Reservation added successfully" });
  } catch (error) {
    console.error("Reservation error:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

export default router;
