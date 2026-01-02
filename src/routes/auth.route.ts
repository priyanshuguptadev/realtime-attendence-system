import { Router } from "express";

import * as authController from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/teacher.middleware.js";

const authRouter = Router();

authRouter
  .get("/me", verifyToken, authController.checkMe)
  .post("/signup", authController.signup)
  .post("/login", authController.login);

export default authRouter;
