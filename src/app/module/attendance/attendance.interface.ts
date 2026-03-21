import { AttendanceStatus } from "../../../generated/prisma";

export interface ICreateAttendancePayload {
  classId: string;
  date?: string;
  attendanceData: {
    studentId: string;
    status: AttendanceStatus;
    remarks?: string;
  }[];
}