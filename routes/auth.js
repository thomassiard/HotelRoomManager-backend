import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import connect from "../db.js"; // Ovdje importate ispravnu putanju do vašeg db.js
import crypto from "crypto"; // Dodano za generiranje tajnog ključa

const router = express.Router();

// Generirajte tajni ključ
const secretKey = crypto.randomBytes(64).toString("hex");

router.post("/register", async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, confirmPassword } =
      req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    if (password != confirmPassword) {
      return res.status(400).json({ message: "Passwords must match!" });
    }

    const db = await connect("HRM");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ email });
    if (user) {
      return res.status(404).json({ message: "User already exists!" });
    }

    const newUser = {
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
    };

    await usersCollection.insertOne(newUser);

    // Generirajte JWT token za novoregistriranog korisnika
    const token = jwt.sign({ userId: newUser._id }, secretKey, {
      expiresIn: "12h",
    });

    res.status(201).json({ message: "User registered successfully", token });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const db = await connect("HRM");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Upotrijebite generirani tajni ključ za potpisivanje JWT tokena
    const token = jwt.sign({ userId: user._id }, secretKey, {
      expiresIn: "12h",
    });

    res.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

export default router;
