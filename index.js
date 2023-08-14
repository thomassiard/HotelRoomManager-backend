import mongo from "mongodb";
import express from "express";
import connect from "./db.js";
import authRoutes from "./routes/auth.js";

const app = express();
const port = 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);

app.get("/", async (req, res) => {
  res.json({ test: "radi" });
});

app.post("/asd", async (req, res) => {
  let db = await connect("Test");
  let inserted = await db.collection("Kolekcija").insertOne({
    diga: "entao",
  });
  let item_id = inserted.insertedId;
  let doc = await db.collection("Kolekcija").findOne({
    _id: mongo.ObjectId(item_id),
  });
  res.json(doc);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
