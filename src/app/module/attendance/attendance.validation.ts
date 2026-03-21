import { z } from "zod";
import { AttendanceStatus } from "../../../generated/prisma/index.js";

const createAttendanceSchema = z.object({
  body: z.object({
    classId: z.string(),
    date: z.string().optional(),
    attendanceData: z.array(
      z.object({
        studentId: z.string(),
        status: z.nativeEnum(AttendanceStatus),
        remarks: z.string().optional(),
      })
    ),
  }),
});

const getAttendanceReportSchema = z.object({
  query: z.object({
    classId: z.string(),
    studentId: z.string().optional(),
    date: z.string().optional(),
    month: z.string().optional(),
    year: z.string().optional(),
  }),
});


export const AttendanceValidation = {
  createAttendanceSchema,
  getAttendanceReportSchema,
};
