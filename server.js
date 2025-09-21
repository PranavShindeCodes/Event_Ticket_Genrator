import express from "express";
import { Cr } from "./Models/Cr.js";
import bcrypt from "bcrypt";
import cors from "cors";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import auth from "./Models/auth.js";
import Student from "./Models/Student.js";
import Counter from "./Models/Counter.js";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "dew2xoivx",
  api_key: "859399762437558",
  api_secret: "2SqV3j4SQbVv3tOdb1N74mYhv0Q",
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = 1000;

mongoose
  .connect(
    "mongodb+srv://pranavshinde1509:YCqEypZ8ECjPyUPK@imrda.yswkvyo.mongodb.net/",
    { dbName: "IMRDA" }
  )
  .then(() => {
    console.log("Connected");
  })
  .catch((err) => {
    console.log(err);
  });

// CR register route
app.post("/cr/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.json({ message: "all fields are required", success: false });
  }
  const exist = await Cr.findOne({ email });
  if (exist) {
    return res.json({ message: "user already exist", success: false });
  }
  const hashPassword = await bcrypt.hash(password, 10);
  const user = await Cr.create({
    name,
    email,
    password: hashPassword,
  });
  res.json({ message: "user created successfully", success: true, user });
});

// CR login route
app.post("/cr/login", async (req, res) => {
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
  const token = await jwt.sign({ exist }, "!@#$", { expiresIn: "6h" });
  res.json({ message: "login successfull", success: true, token });
});

// Counter function
async function getNextUserId() {
  const counter = await Counter.findOneAndUpdate(
    { id: "userID" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq.toString().padStart(3, "0");
}

// 🔹 Updated student register route WITHOUT multer/Cloudinary
app.post("/student/register", async (req, res) => {
  try {
    const { name, phone, stdClass, imgUrl } = req.body;

    if (!name || !phone || !stdClass || !imgUrl) {
      return res.json({ message: "all fields are required", success: false });
    }

    const exist = await Student.findOne({ phone });
    if (exist) {
      return res.json({ message: "user already exist", success: false });
    }

    const nextId = await getNextUserId();
    const newUser = new Student({
      userId: nextId,
      name,
      phone,
      stdClass,
      imgUrl,
    });

    await newUser.save();
    res.json({ success: true, userId: newUser.userId, user: newUser });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "registration failed" });
  }
});

// Get student by ID
app.get("/student/:id", async (req, res) => {
  const id = req.params.id;
  const user = await Student.findOne({ userId: id });
  if (!user) {
    return res.json({ message: "user not found", success: false });
  }
  res.json({ message: "user found", success: true, user });
});

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
