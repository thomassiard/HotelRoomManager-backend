import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import connect from "../db.js"; // Ovdje importate ispravnu putanju do vašeg db.js

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const db = await connect("HRM");
    const usersCollection = db.collection("users");

    const newUser = {
      username,
      password: hashedPassword,
    };

    await usersCollection.insertOne(newUser);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const db = await connect("your-database-name");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, "your-secret-key", {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

export default router;
