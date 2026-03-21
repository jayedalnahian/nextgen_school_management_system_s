import { prisma } from "../../lib/prisma.js";
import AppError from "../../errorHealpers/AppError.js";
import status from "http-status";
import { ICreateAttendancePayload } from "./attendance.interface.js";
import { AttendanceStatus } from "../../../generated/prisma/index.js";



const createAttendanceInDB = async (userId: string, payload : ICreateAttendancePayload) => {
  const { classId, date, attendanceData } = payload;

  // 1. Get Teacher ID from User ID
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
  });

  if (!teacher) {
    throw new AppError(status.NOT_FOUND, "Teacher record not found for the user.");
  }

  // 2. Verify Teacher is assigned to the class
  const isAssigned = await prisma.classTeacher.findUnique({
    where: {
      teacherId_classId: {
        teacherId: teacher.id,
        classId,
      },
    },
  });

  if (!isAssigned) {
    throw new AppError(
      status.FORBIDDEN,
      "You are not assigned to this class."
    );
  }

  // 3. Date Handling: Default to current date (midnight UTC)
  const attendanceDate = date ? new Date(date) : new Date();
  attendanceDate.setHours(0, 0, 0, 0);

  // 4. Student Verification: all studentIds belong to classId
  const studentIds = attendanceData.map((a: any) => a.studentId);
  const studentsInClass = await prisma.student.findMany({
    where: {
      id: { in: studentIds },
      classId,
      isDeleted: false,
    },
    select: { id: true },
  });

  if (studentsInClass.length !== studentIds.length) {
    const foundIds = studentsInClass.map((s) => s.id);
    const missingIds = studentIds.filter((id: string) => !foundIds.includes(id));
    throw new AppError(
      status.BAD_REQUEST,
      `The following students do not belong to the specified class or are deleted: ${missingIds.join(", ")}`
    );
  }

  // 5. Prevent Duplicate Attendance for the same date
  const existingRecords = await prisma.attendance.findMany({
    where: {
      classId,
      date: attendanceDate,
      studentId: { in: studentIds },
    },
    select: { studentId: true },
  });

  if (existingRecords.length > 0) {
    const duplicateIds = existingRecords.map((r) => r.studentId);
    throw new AppError(
      status.CONFLICT,
      `Attendance already recorded for the following students on this date: ${duplicateIds.join(", ")}`
    );
  }

  // 6. Bulk Insert
  const result = await prisma.$transaction(async (tx) => {
    const createdAttendance = await tx.attendance.createMany({
      data: attendanceData.map((a: any) => ({
        ...a,
        classId,
        date: attendanceDate,
        takenById: teacher.id,
      })),
    });

    // Calculate Summary
    const summary = {
      PRESENT: attendanceData.filter((a: any) => a.status === AttendanceStatus.PRESENT).length,
      ABSENT: attendanceData.filter((a: any) => a.status === AttendanceStatus.ABSENT).length,
      LATE: attendanceData.filter((a: any) => a.status === AttendanceStatus.LATE).length,
    };

    return {
      count: createdAttendance.count,
      summary,
    };
  });

  return result;
};

const getAttendanceReportFromDB = async (
  user: { userId: string; role: string },
  query: any
) => {
  const { classId, studentId, date, month, year } = query;

  // 1. Access Control
  if (user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.userId },
    });

    if (!teacher) {
      throw new AppError(status.NOT_FOUND, "Teacher record not found.");
    }

    const isAssigned = await prisma.classTeacher.findUnique({
      where: {
        teacherId_classId: {
          teacherId: teacher.id,
          classId,
        },
      },
    });

    if (!isAssigned) {
      throw new AppError(status.FORBIDDEN, "You are not assigned to this class.");
    }
  }

  // 2. Build Prisma Filter
  const where: any = { classId };

  if (studentId) {
    where.studentId = studentId;
  }

  if (date) {
    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);
    where.date = searchDate;
  } else if (month && year) {
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
    where.date = {
      gte: startDate,
      lte: endDate,
    };
  }

  // 3. Fetch Data
  const [attendances, studentCount] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentID: true,
            roll: true,
          },
        },
      },
      orderBy: { date: "asc" },
    }),
    prisma.student.count({
      where: { classId, isDeleted: false },
    }),
  ]);

  // 4. Aggregate Stats
  const summary = {
    totalStudents: studentCount,
    present: attendances.filter((a) => a.status === AttendanceStatus.PRESENT).length,
    absent: attendances.filter((a) => a.status === AttendanceStatus.ABSENT).length,
    late: attendances.filter((a) => a.status === AttendanceStatus.LATE).length,
  };

  // 5. Monthly Specific Logic (Percentage per student)
  let studentSummaries = undefined;
  if (month && year) {
    const studentRecords: Record<string, { total: number; present: number; student: any }> = {};

    attendances.forEach((a) => {
      if (!studentRecords[a.studentId]) {
        studentRecords[a.studentId] = {
          total: 0,
          present: 0,
          student: a.student,
        };
      }
      studentRecords[a.studentId].total++;
      if (a.status === AttendanceStatus.PRESENT) {
        studentRecords[a.studentId].present++;
      }
    });

    studentSummaries = Object.values(studentRecords).map((record) => ({
      student: record.student,
      totalDays: record.total,
      presentDays: record.present,
      percentage: ((record.present / record.total) * 100).toFixed(2) + "%",
    }));
  }

  return {
    summary,
    studentSummaries,
    data: attendances,
  };
};

export const AttendanceService = {
  createAttendanceInDB,
  getAttendanceReportFromDB,
};
