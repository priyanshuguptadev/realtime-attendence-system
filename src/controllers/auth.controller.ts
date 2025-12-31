import type { Request, Response } from "express";
import { loginSchema, signupSchema } from "../schemas/zod/index.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
export const signup = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const { success, data, error } = signupSchema.safeParse(payload);
    if (!success) {
      return res.json({
        success: false,
        error: error.message,
      });
    }
    const userExists = await User.findOne({ email: data.email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: "User already exits! Please Login.",
      });
    }
    const password = await bcrypt.hash(data.password, 10);
    const updatedData = { ...data, password };
    const newUser = new User(updatedData);
    const savedUser = await newUser.save();
    const token = jwt.sign(
      {
        id: savedUser._id,
        role: savedUser.role,
      },
      process.env.JWT_SECRET_KEY!
    );
    res.status(201).json({
      success: true,
      data: {
        token: token,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      status: false,
      error: "Something went wrong! Please try again.",
    });
  }
};
export const login = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const { success, data, error } = loginSchema.safeParse(payload);
    if (!success) {
      return res.json({
        success: false,
        error: error.message,
      });
    }
    const userExists = await User.findOne({ email: data.email });
    if (!userExists) {
      return res.status(400).json({
        success: false,
        error: "User does not exist! Please register.",
      });
    }
    const isPasswordCorrect = await bcrypt.compare(
      data.password,
      userExists.password
    );
    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        error: "Password Incorrect!",
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
    console.error(error);
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
        error: "Please send token in this format.`Bearer {token}`",
      });
    }

    const jwtPayload: any = jwt.verify(
      bearerToken,
      process.env.JWT_SECRET_KEY!
    );
    const user = await User.findById(jwtPayload.id);
    res.status(200).json({
      success: true,
      data: {
        name: user?.name,
        email: user?.email,
        role: user?.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      status: false,
      error: "Something went wrong! Please try again.",
    });
  }
};
