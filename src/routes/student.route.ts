import { Router } from "express";

import { isTeacher } from "../middlewares/teacher.middleware.js";
import * as studentController from "../controllers/student.controller.js";

const studentRouter = Router();

studentRouter.use(isTeacher).get("/", studentController.getAllStudents);

export default studentRouter;
