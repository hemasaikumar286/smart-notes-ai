const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const noteRoutes = require("./routes/noteRoutes");
const aiRoutes = require("./routes/aiRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json());


// ==========================================
// PORT
// ==========================================

const PORT = process.env.PORT || 5000;


// ==========================================
// ROUTES
// ==========================================

app.get("/", (req, res) => {
  res.json({
    message: "Smart Notes API is running",
  });
});

app.use("/api/notes", noteRoutes);

app.use("/api/ai", aiRoutes);

app.use("/api/auth", authRoutes);


// ==========================================
// MONGODB CONNECTION
// ==========================================

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "MongoDB connection failed:",
      error.message
    );
  });