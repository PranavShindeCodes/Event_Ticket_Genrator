import express from "express";
import { Cr } from "./Models/Cr.js";
import bcrypt from "bcrypt";
import cors from "cors";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import Student from "./Models/Student.js";
import Counter from "./Models/Counter.js";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: "dew2xoivx",
  api_key: "859399762437558",
  api_secret: "2SqV3j4SQbVv3tOdb1N74mYhv0Q",
});

const app = express();
const port = 1000;

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ MongoDB connection
mongoose
  .connect(
    "mongodb+srv://pranavshinde1509:YCqEypZ8ECjPyUPK@event.9tk34wg.mongodb.net/",
    { dbName: "IMRDA" }
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

// -------------------- Routes --------------------

// Test
app.get("/", (req, res) => {
  res.json({ message: "ok" });
});

// -------------------- CR Register --------------------
app.post("/cr/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({ message: "all fields are required", success: false });
    }

    const exist = await Cr.findOne({ email });
    if (exist) {
      return res.json({ message: "user already exist", success: false });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const user = await Cr.create({ name, email, password: hashPassword });

    res.json({ message: "user created successfully", success: true, user });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "registration failed" });
  }
});

// -------------------- CR Login --------------------
app.post("/cr/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ message: "all fields are required", success: false });
    }

    const exist = await Cr.findOne({ email });
    if (!exist) {
      return res.json({ message: "user not exist", success: false });
    }

    const isMatch = await bcrypt.compare(password, exist.password);
    if (!isMatch) {
      return res.json({ message: "login failed", success: false });
    }

    const token = jwt.sign({ id: exist._id }, "!@#$", { expiresIn: "6h" });
    res.json({ message: "login successful", success: true, token });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "login failed" });
  }
});

// -------------------- Counter for Student ID --------------------
async function getNextUserId() {
  const counter = await Counter.findOneAndUpdate(
    { id: "userID" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq.toString().padStart(3, "0");
}

// -------------------- Student Register with Image --------------------
app.post("/student/register", upload.single("image"), async (req, res) => {
  try {
    const { name, phone, stdClass } = req.body;

    if (!name || !phone || !stdClass || !req.file) {
      return res.json({ message: "all fields are required", success: false });
    }

    // ✅ Check if phone already exists
    const exist = await Student.findOne({ phone });
    if (exist) {
      return res.json({
        message: "Phone number already registered",
        success: false,
      });
    }

    // Upload image to Cloudinary
    const stream = cloudinary.uploader.upload_stream(
      { folder: "students" },
      async (error, result) => {
        if (error) {
          console.log(error);
          return res.json({ success: false, message: "Image upload failed" });
        }

        try {
          const nextId = await getNextUserId();
          const newUser = new Student({
            userId: nextId,
            name,
            phone,
            stdClass,
            imgUrl: result.secure_url,
          });

          await newUser.save();
          res.json({ success: true, userId: newUser.userId, user: newUser });
        } catch (dbErr) {
          // ✅ Catch duplicate key error (unique constraint)
          if (dbErr.code === 11000) {
            return res.json({
              success: false,
              message: "Phone number already registered",
            });
          }
          console.log(dbErr);
          res.json({ success: false, message: "registration failed" });
        }
      }
    );

    stream.end(req.file.buffer);
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "registration failed" });
  }
});

// -------------------- Get Student by ID --------------------
app.get("/student/:id", async (req, res) => {
  const id = req.params.id;
  const user = await Student.findOne({ userId: id });
  if (!user) {
    return res.json({ message: "user not found", success: false });
  }
  res.json({ message: "user found", success: true, user });
});

// -------------------- Start Server --------------------
app.listen(port, () => console.log(`Server running on port ${port}`));
