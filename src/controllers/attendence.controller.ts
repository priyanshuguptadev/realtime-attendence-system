import type { Request, Response } from "express";
import { startAttendenceSchema } from "../schemas/zod/index.js";
import { activeSession } from "./ws.controller.js";

export const startAttendence = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const { data, success, error } = startAttendenceSchema.safeParse(payload);
    if (!success) {
      return res.json({
        success: false,
        error: error.message,
      });
    }
    activeSession.classId = data.classId;
    activeSession.startedAt = new Date().toISOString();
    activeSession.attendence = {};

    res.status(200).json({
      success: true,
      data: {
        classId: activeSession.classId,
        startedAt: activeSession.startedAt,
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
