import mongo from "mongodb";
import express from "express";
import connect from "./db.js";

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
