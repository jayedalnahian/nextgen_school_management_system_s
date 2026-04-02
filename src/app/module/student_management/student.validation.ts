import { z } from "zod";

const createStudentSchema = z.object({
  name: z.string(),
  dob: z.string(),
  gender: z.string(),
  classId: z.string(),
  parentId: z.string(),
});

const promoteStudentSchema = z.object({
  nextClassId: z.string(),
});

const updateStudentSchema = z.object({
  name: z.string().optional(),
  dob: z.string().optional(),
  gender: z.string().optional(),
  classId: z.string().optional(),
  roll: z.number().optional(),
});

export const StudentValidation = {
  createStudentSchema,
  promoteStudentSchema,
  updateStudentSchema,
};
