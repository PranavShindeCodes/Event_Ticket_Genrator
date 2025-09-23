import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true, // ✅ User ID unique
  },
  name: String,
  phone: {
    type: String,
    unique: true, // ✅ Prevent duplicate phone numbers
  },
  stdClass: String,
  imgUrl: String,
});

const Student = mongoose.model("student", studentSchema);
export default Student;
