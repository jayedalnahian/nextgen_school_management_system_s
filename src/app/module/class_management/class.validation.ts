import { z } from "zod";

const createClassSchema = z.object({
  body: z.object({
    name: z.string(),
    section: z.string().optional(),
    monthlyFee: z
      .number()
      .min(0, "Monthly fee cannot be negative"),
    capacity: z
      .number()
      .int()
      .min(0, "Capacity cannot be negative")
      .optional(),
  }),
});

const updateClassSchema = z.object({
  body: createClassSchema.shape.body.partial(),
});

const assignTeacherSchema = z.object({
  body: z.object({
    classId: z.string({ message: "Class ID must be a string" }).uuid("Invalid Class ID"),
    teacherId: z.string({ message: "Teacher ID must be a string" }).uuid("Invalid Teacher ID"),
    isClassTeacher: z.boolean({ message: "isClassTeacher must be a boolean" }),
  }),
});

export const ClassValidation = {
  createClassSchema,
  updateClassSchema,
  assignTeacherSchema,
};
