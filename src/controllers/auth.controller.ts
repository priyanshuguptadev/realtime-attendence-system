import type { Request, Response } from "express";
import { loginSchema, signupSchema } from "../schemas/zod/index.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
export const signup = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const { success, data } = signupSchema.safeParse(payload);
    if (!success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request schema",
      });
    }
    const userExists = await User.findOne({ email: data.email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: "Email already exists",
      });
    }
    const password = await bcrypt.hash(data.password, 10);
    const updatedData = { ...data, password };
    const newUser = new User(updatedData);
    const savedUser = await newUser.save();
    const { password: _, ...user } = savedUser.toJSON();
    res.status(201).json({
      success: true,
      data: {
        ...user,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      error: "Something went wrong! Please try again.",
    });
  }
};
export const login = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const { success, data } = loginSchema.safeParse(payload);
    if (!success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request schema",
      });
    }
    const userExists = await User.findOne({ email: data.email });
    if (!userExists) {
      return res.status(400).json({
        success: false,
        error: "Invalid email or password",
      });
    }
    const isPasswordCorrect = await bcrypt.compare(
      data.password,
      userExists.password
    );
    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: userExists._id,
        role: userExists.role,
      },
      process.env.JWT_SECRET_KEY!
    );
    res.status(200).json({
      success: true,
      data: {
        token: token,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      error: "Something went wrong! Please try again.",
    });
  }
};
export const checkMe = async (req: Request, res: Response) => {
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
    if (!jwtPayload) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized, token missing or invalid",
      });
    }
    const user = await User.findById(jwtPayload.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found.",
      });
    }
    const { password: _, ...pubUser } = user.toJSON();
    res.status(200).json({
      success: true,
      data: {
        ...pubUser,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      error: "Something went wrong! Please try again.",
    });
  }
};
