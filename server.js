import express from "express";
import { Cr } from "./Models/Cr.js";
import bcrypt from "bcrypt";
import cors from "cors";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import auth from "./Models/auth.js";
import Student from "./Models/Student.js";
import Counter from "./Models/Counter.js";
const app = express();
app.use(cors());
app.use(express.json());
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

//students register route /student/register
async function getNextUserId() {
  const counter = await Counter.findOneAndUpdate(
    { id: "userID" }, // <-- query object
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq.toString().padStart(3, "0");
}

app.post("/student/register", auth, async (req, res) => {
  try {
    const { name, phone, stdClass, imgUrl } = req.body; // <-- use stdClass
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
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "registration failed" });
  }
});

//get student by id
app.get("/student/:id", auth, async (req, res) => {
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
