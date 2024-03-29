import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import connect from "../db.js";
import crypto from "crypto";
import cors from "cors";
import mongoose from "mongoose";

const router = express.Router();

// Generiranje tajnog ključa
const secretKey = crypto.randomBytes(64).toString("hex");
router.use(cors());

// Middleware for authentication
function authMiddleware(req, res, next) {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1]; // Get the token part after "Bearer "

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token is not valid" });
  }
}

router.get("/secure-resource", authMiddleware, (req, res) => {
  // This route is protected and can only be accessed with a valid token
  res.json({ message: "Authenticated route", user: req.user });
});

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

    // Generiranje JWT token za novoregistriranog korisnika
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

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id }, secretKey, {
      expiresIn: "12h",
    });

    console.log("Generated token:", token); // Log the generated token

    res.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// Create a route to fetch user by token
router.get("/user", authMiddleware, async (req, res) => {
  try {
    const userId = req.user; // The user ID is extracted from the token by the authMiddleware

    const db = await connect("HRM");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      _id: new mongoose.Types.ObjectId(userId),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user by token:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

export default router;
