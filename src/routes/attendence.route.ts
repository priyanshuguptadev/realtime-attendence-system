import { Router } from "express";

import * as attendeceController from "../controllers/attendence.controller.js";
import { isTeacher } from "../middlewares/teacher.middleware.js";

const attendenceRouter = Router();

attendenceRouter
  .use(isTeacher)
  .post("/start", attendeceController.startAttendence);

export default attendenceRouter;
