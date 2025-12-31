import mongoose, { Types } from "mongoose";

export const attendenceSchema = new mongoose.Schema({
  classId: {
    type: Types.ObjectId,
    ref: "Class",
  },
  studentId: {
    type: Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: ["Present", "Absent"],
    default: "Absent",
  },
});
