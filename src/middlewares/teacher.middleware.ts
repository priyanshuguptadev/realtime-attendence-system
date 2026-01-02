import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { NewRequest } from "../utils/types.js";

export const isTeacher = async (
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
        error: "Unauthorized, token missing or invalid",
      });
    }

    const jwtPayload: any = jwt.verify(
      bearerToken,
      process.env.JWT_SECRET_KEY!
    );
    if (jwtPayload.role === "teacher") {
      req.userId = jwtPayload.id;
      return next();
    }
    res.status(403).json({
      success: false,
      error: "Forbidden, teacher access required",
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      error: "Something went wrong! Please try again.",
    });
  }
};

export const verifyToken = async (
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
        error: "Unauthorized, token missing or invalid",
      });
    }

    const jwtPayload: any = jwt.verify(
      bearerToken,
      process.env.JWT_SECRET_KEY!
    );
    req.userId = jwtPayload.id;
    req.role = jwtPayload.role;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: "Unauthorized, token missing or invalid",
    });
  }
};
