import mongoose from "mongoose";
const studentSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
  },
  name: String,
  phone: String,
  stdClass: String,
  imgUrl: String,
});
const Student = mongoose.model("student", studentSchema);
export default Student;
