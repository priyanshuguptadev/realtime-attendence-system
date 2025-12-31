import mongoose from "mongoose";
export const connectToDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Mongodb connected!");
  } catch (e) {
    console.error(e);
  }
};
