import mongoose from "mongoose";

export const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["teacher", "student"],
    default: "student",
    required: true,
  },
});
