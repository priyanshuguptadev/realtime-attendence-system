import mongoose from "mongoose";

import { attendenceSchema } from "../schemas/mongodb/attendence.schema.js";

export const Attendence = mongoose.model("Attendence", attendenceSchema);
