import mongoose from "mongoose";

import { classSchema } from "../schemas/mongodb/class.schema.js";

export const Class = mongoose.model("Class", classSchema);
