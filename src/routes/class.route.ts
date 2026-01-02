import { Router } from "express";

import { isTeacher, verifyToken } from "../middlewares/teacher.middleware.js";
import * as classController from "../controllers/class.controller.js";
import * as studentController from "../controllers/student.controller.js";

import { isStudent } from "../middlewares/student.middleware.js";

const classRouter = Router();

classRouter
  .get("/:id", verifyToken, classController.getClassDetails)
  .post("/", isTeacher, classController.createClass)
  .post("/:id/add-student", isTeacher, classController.addStudent);

classRouter.get(
  "/:id/my-attendance",
  isStudent,
  studentController.getMyAttendence
);

export default classRouter;
