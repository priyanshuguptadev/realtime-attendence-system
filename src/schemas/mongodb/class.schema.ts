import { Types } from "mongoose";
import mongoose from "mongoose";
import { User } from "../../models/user.model.js";

export const classSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true,
  },
  teacherId: {
    type: Types.ObjectId,
    ref: "User",
    required: true,
  },
  studentIds: [
    {
      type: Types.ObjectId,
      ref: "User",
    },
  ],
});
