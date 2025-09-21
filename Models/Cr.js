import mongoose from "mongoose";
const crSchema = new mongoose.Schema({
  //   name: {
  //     type: String,
  //     required: true,
  //   },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
export const Cr = mongoose.model("Cr", crSchema);
