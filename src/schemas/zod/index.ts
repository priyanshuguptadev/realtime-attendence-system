import z from "zod";

export const signupSchema = z.object({
  name: z.string(),
  email: z.email(),
  password: z.string(),
  role: z.enum(["teacher", "student"]),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export const createClassSchema = z.object({
  classname: z.string().min(0, "classname is required!"),
});

export const addstudentSchema = z.object({
  studentId: z.string().min(0, "student id is required!"),
});

export const startAttendenceSchema = z.object({
  classId: z.string().min(0, "class id is required!"),
});
