import { z } from "zod";

const createClassSchema = z.object({

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
  });

const updateClassSchema = z.object({
  body: createClassSchema.partial(),
});

const assignTeacherSchema = z.object({
  body: z.object({
    classId: z.string({ message: "Class ID must be a string" }).uuid("Invalid Class ID"),
    teacherId: z.string({ message: "Teacher ID must be a string" }).uuid("Invalid Teacher ID"),
    isClassTeacher: z.boolean({ message: "isClassTeacher must be a boolean" }),
  }),
});

const assignSubjectSchema = z.object({
  body: z.object({
    classId: z.string({ message: "Class ID is required" }).uuid("Invalid Class ID"),
    subjects: z
      .array(
        z
          .object({
            subjectId: z.string({ message: "Subject ID is required" }).uuid("Invalid Subject ID"),
            totalMarks: z.number().int().min(1).default(100).optional(),
            passMarks: z.number().int().min(1).default(33).optional(),
            isOptional: z.boolean().default(false).optional(),
          })
          .refine((data) => (data.passMarks ?? 33) < (data.totalMarks ?? 100), {
            message: "Pass marks must be less than total marks",
            path: ["passMarks"],
          }),
      )
      .min(1, "At least one subject must be assigned"),
  }),
});

export const ClassValidation = {
  createClassSchema,
  updateClassSchema,
  assignTeacherSchema,
  assignSubjectSchema,
};
