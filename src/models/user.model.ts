import mongoose from "mongoose";

import { userSchema } from "../schemas/mongodb/user.schema.js";

export const User = mongoose.model("User", userSchema);
