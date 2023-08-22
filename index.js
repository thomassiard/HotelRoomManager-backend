import express from "express";
import authRoutes from "./routes/auth.js";
import roomsRoutes from "./routes/rooms.js";
import reservationsRoutes from "./routes/reservations.js";

const app = express();
const port = 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/room", roomsRoutes);
app.use("/api/reservation", reservationsRoutes);

app.get("/", async (req, res) => {
  res.json({ test: "radi" });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
