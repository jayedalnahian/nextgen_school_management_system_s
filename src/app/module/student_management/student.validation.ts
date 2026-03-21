import { z } from "zod";

const createStudentSchema = z.object({
  body: z.object({
    name: z.string(),
    dob: z.string(),
    gender: z.string(),
    classId: z.string(),
    parentId: z.string(),
  }),
});

const promoteStudentSchema = z.object({
  body: z.object({
    nextClassId: z.string(),
  }),
});

export const StudentValidation = {
  createStudentSchema,
  promoteStudentSchema,
};
