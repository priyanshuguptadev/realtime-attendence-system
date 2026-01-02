import type { Response } from "express";
import type { NewRequest } from "../utils/types.js";
import { addstudentSchema, createClassSchema } from "../schemas/zod/index.js";
import { Class } from "../models/class.model.js";
import { Types } from "mongoose";
import { User } from "../models/user.model.js";

export const createClass = async (req: NewRequest, res: Response) => {
  try {
    const payload = req.body;
    const { success, data } = createClassSchema.safeParse(payload);
    if (!success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request schema",
      });
    }
    const newClass = new Class({
      className: data.className,
      teacherId: req.userId,
    });
    const savedClass = await newClass.save();
    res.status(201).json({
      success: true,
      data: {
        ...savedClass.toJSON(),
      },
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      error: "Something went wrong! Please try again.",
    });
  }
};

export const addStudent = async (req: NewRequest, res: Response) => {
  try {
    const payload = req.body;
    const classId = req.params.id;
    const { data, success } = addstudentSchema.safeParse(payload);
    if (!success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request schema",
      });
    }
    const dbClass = await Class.findById(classId);
    if (!dbClass) {
      return res.status(404).json({
        success: false,
        error: "Class not found",
      });
    }
    const dbStudent = await User.findOne({
      _id: data.studentId,
      role: "student",
    });
    if (!dbStudent) {
      return res.status(404).json({
        success: false,
        error: "Student not found",
      });
    }
    if (dbClass.teacherId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: "Forbidden, not class teacher",
      });
    }
    const added = await Class.findByIdAndUpdate(
      classId,
      {
        $addToSet: { studentIds: data.studentId },
      },
      { new: true }
    );
    if (!added) {
      return res.status(400).json({
        status: false,
        error: "Something went wrong! Please try again.",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...added.toJSON(),
      },
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      error: "Something went wrong! Please try again.",
    });
  }
};

export const getClassDetails = async (req: NewRequest, res: Response) => {
  try {
    const classId = req.params.id;

    const classDetail = await Class.findById(classId).populate(
      "studentIds",
      "name email _id"
    );

    if (!classDetail) {
      return res.status(404).json({
        success: false,
        error: "Class not found",
      });
    }
    if (req.role === "student") {
      const stds = classDetail.studentIds;
      const stdIds = stds.map((s) => s._id.toString());
      const found = stdIds.find((val) => val === req.userId);
      if (!found) {
        return res.status(403).json({
          success: false,
          error: "Forbidden, non-enrolled student",
        });
      }
    } else {
      if (req.userId !== classDetail.teacherId.toString()) {
        return res.status(403).json({
          success: false,
          error: "Forbidden, not class teacher",
        });
      }
    }

    const jsonClass = classDetail.toJSON();

    res.status(200).json({
      success: true,
      data: {
        _id: jsonClass._id,
        className: jsonClass.className,
        students: jsonClass.studentIds,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      error: "Something went wrong! Please try again.",
    });
  }
};
