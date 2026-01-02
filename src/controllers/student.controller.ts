import type { Response, Request } from "express";
import { User } from "../models/user.model.js";
import type { NewRequest } from "../utils/types.js";
import { Attendence } from "../models/attendence.model.js";
import { Types } from "mongoose";

export const getAllStudents = async (req: Request, res: Response) => {
  try {
    const students = await User.find({ role: "student" });
    if (!students) {
      return res.status(404).json({
        status: false,
        error: "No students found!",
      });
    }

    res.status(200).json({
      success: true,
      data: students.map((s) => ({ _id: s._id, name: s.name, email: s.email })),
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      error: "Something went wrong! Please try again.",
    });
  }
};

export const getMyAttendence = async (req: NewRequest, res: Response) => {
  try {
    const classId = new Types.ObjectId(req.params.id);
    const studentId = new Types.ObjectId(req.userId);
    if (!classId || !studentId) {
      return res.status(400).json({
        status: false,
        error: "Class ID and Student Id are both required.",
      });
    }
    const attendence = await Attendence.findOne({ studentId, classId });
    if (!attendence) {
      return res.status(200).json({
        status: true,
        data: {
          classId: classId,
          status: null,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        classId: attendence.classId,
        status: "present",
      },
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      error: "Something went wrong! Please try again.",
    });
  }
};
