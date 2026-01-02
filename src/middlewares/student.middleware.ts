import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { NewRequest } from "../utils/types.js";

export const isStudent = async (
  req: NewRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authToken = req.headers.authorization;
    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized, token missing or invalid",
      });
    }
    const bearerToken = authToken.split(" ")[1];
    if (!bearerToken) {
      return res.status(401).json({
        success: false,
        error: "Please send token in this format.`Bearer {token}`",
      });
    }

    const jwtPayload: any = jwt.verify(
      bearerToken,
      process.env.JWT_SECRET_KEY!
    );
    if (jwtPayload.role === "student") {
      req.userId = jwtPayload.id;
      return next();
    }
    res.status(403).json({
      success: false,
      error: "Forbidden, student access required",
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      error: "Something went wrong! Please try again.",
    });
  }
};
