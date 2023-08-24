import express from "express";
import connect from "../db.js";
import { DBRef } from "mongodb";
import mongoose from "mongoose";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      email, // Dodajte polje za email ili phoneNumber
      check_in,
      check_out,
      adults,
      kids,
      room_number,
      type_of_payment,
    } = req.body;

    const db = await connect("HRM");
    const reservationCollection = db.collection("Reservations");
    const usersCollection = db.collection("users"); // Dodana referenca na kolekciju "Users"
    const roomsCollection = db.collection("Rooms");
    const method_of_paymentCollection = db.collection("Method-of-payment");

    const method_of_payment = await method_of_paymentCollection.findOne({
      type_of_payment,
    });

    if (!method_of_payment) {
      return res.status(404).json({ message: "Method of payment not found" });
    }

    const room = await roomsCollection.findOne({ room_number });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const user = await usersCollection.findOne({ email }); // Pronalaženje korisnika prema email adresi

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
    const { check_in, check_out, adults, kids, room_number, type_of_payment } =
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

    const room = await roomsCollection.findOne({ room_number });

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

export default router;
