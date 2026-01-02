import type { Response } from "express";
import { startAttendenceSchema } from "../schemas/zod/index.js";
import { activeSession } from "./ws.controller.js";
import type { NewRequest } from "../utils/types.js";
import { Types } from "mongoose";
import { Class } from "../models/class.model.js";

export const startAttendence = async (req: NewRequest, res: Response) => {
  try {
    const payload = req.body;
    const { data, success } = startAttendenceSchema.safeParse(payload);
    if (!success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request schema",
      });
    }
    const dbClass = await Class.findById(data.classId);
    if (!dbClass) {
      return res.status(404).json({
        success: false,
        error: "Class not found",
      });
    }

    if (req.userId !== dbClass.teacherId.toString()) {
      return res.status(403).json({
        success: false,
        error: "Forbidden, not class teacher",
      });
    }
    activeSession.classId = data.classId;
    activeSession.teacherId = req.userId;
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
    res.status(400).json({
      status: false,
      error: "Something went wrong! Please try again.",
    });
  }
};
