import type { Response } from "express";
import type { NewRequest } from "../utils/types.js";
import { addstudentSchema, createClassSchema } from "../schemas/zod/index.js";
import { Class } from "../models/class.model.js";

export const createClass = async (req: NewRequest, res: Response) => {
  try {
    const payload = req.body;
    const { success, data, error } = createClassSchema.safeParse(payload);
    if (!success) {
      return res.json({
        success: false,
        error: error.message,
      });
    }
    const newClass = new Class({
      classname: data.classname,
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
    console.error(error);
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
    const { data, success, error } = addstudentSchema.safeParse(payload);
    if (!success) {
      return res.json({
        success: false,
        error: error.message,
      });
    }
    const added = await Class.findByIdAndUpdate(classId, {
      $push: { studentIds: data.studentId },
    });
    if (!added) {
      return res.status(400).json({
        status: false,
        error: "Something went wrong! Please try again.",
      });
    }

    res.status(201).json({
      success: true,
      data: {
        ...added.toJSON(),
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

export const getClassDetails = async (req: NewRequest, res: Response) => {
  try {
    const classId = req.params.id;

    const classDetail = await Class.findById(classId).populate(
      "studentIds",
      "name email"
    );
    if (!classDetail) {
      return res.status(400).json({
        status: false,
        error: "Something went wrong! Please try again.",
      });
    }

    res.status(201).json({
      success: true,
      data: {
        ...classDetail.toJSON(),
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
