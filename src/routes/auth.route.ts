import { Router } from "express";

import * as authController from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter
  .get("/me", authController.checkMe)
  .post("/signup", authController.signup)
  .post("/login", authController.login);

export default authRouter;
