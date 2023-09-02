import express from "express";
const router = express.Router();
import connect from "../db.js"; // Uvoz funkcije za povezivanje s bazom

// Nova ruta za dohvaćanje korisničkih podataka na temelju email adrese
router.get("/:email", async (req, res) => {
  try {
    const db = await connect("HRM"); // Povežite se s bazom
    const usersCollection = db.collection("users"); // Odaberite kolekciju "users"

    const user = await usersCollection.findOne({
      email: req.params.email, // Dohvatite korisnika na temelju email adrese
    });

    if (!user) {
      return res.status(404).json({ message: "Korisnik nije pronađen." });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Došlo je do pogreške na serveru." });
  }
});

export default router;
