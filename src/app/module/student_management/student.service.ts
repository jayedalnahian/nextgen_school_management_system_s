import { prisma } from "../../lib/prisma.js";
import AppError from "../../errorHealpers/AppError.js";
import status from "http-status";
import {
  checkPromotionClearance,
  generateRoll,
  generateStudentId,
} from "../../utils/student.utils.js";
import { QueryBuilder } from "../../utils/QueryBuilder.js";
import {
  studentFilterableFields,
  studentSearchableFields,
} from "./student.constant.js";
import { IQueryParams } from "../../interface/query.interface.js";

const createStudentInDB = async (payload: any) => {
  // ... (existing code)
  const { name, dob, gender, classId, parentId } = payload;
  
  // (Note: Keep the existing implementation of createStudentInDB exactly as it is)
  // I'm omitting the full body here for brevity in the tool call if possible, 
  // but I must ensure the replacement is complete and correct.
  // Actually, I'll provide the exact lines for createStudentInDB to be safe.

  const parent = await prisma.parent.findUnique({
    where: { id: parentId },
  });
  if (!parent) {
    throw new AppError(status.NOT_FOUND, "Parent not found");
  }

  const classObj = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      _count: {
        select: { students: true },
      },
    },
  });
  if (!classObj) {
    throw new AppError(status.NOT_FOUND, "Class not found");
  }

  if (classObj.capacity && classObj._count.students >= classObj.capacity) {
    throw new AppError(status.BAD_REQUEST, "Class capacity reached");
  }

  const result = await prisma.$transaction(async (tx) => {
    const studentID = await generateStudentId();
    const roll = await generateRoll(classId);

    const student = await tx.student.create({
      data: {
        studentID,
        name,
        roll,
        dob: new Date(dob),
        gender,
        classId,
        parentId,
      },
    });

    return student;
  });

  return result;
};

const getAllStudentsFromDB = async (query: IQueryParams) => {
  const studentQuery = new QueryBuilder(prisma.student, query, {
    searchableFields: studentSearchableFields,
    filterableFields: studentFilterableFields,
  })
    .search()
    .filter()
    .paginate()
    .sort()
    .where({ isDeleted: false })
    .include({
      class: true,
      parent: true,
    });

  const result = await studentQuery.execute();
  return result;
};

const promoteStudentInDB = async (id: string, payload: { nextClassId: string }) => {
  const { nextClassId } = payload;

  const student = await prisma.student.findUnique({
    where: { id, isDeleted: false },
    include: { class: true },
  });

  if (!student) {
    throw new AppError(status.NOT_FOUND, "Student not found");
  }

  const pendingPayments = await prisma.payment.findFirst({
    where: {
      studentId: id,
      status: "PENDING",
    },
  });

  if (pendingPayments) {
    throw new AppError(
      status.BAD_REQUEST,
      "Promotion blocked due to unpaid tuition fees or pending dues.",
    );
  }

  const clearance = await checkPromotionClearance(id, student.classId);
  if (!clearance.isPassed) {
    throw new AppError(
      status.BAD_REQUEST,
      `Academic clearance failed: ${clearance.failures.join(", ")}`,
    );
  }

  const nextClass = await prisma.class.findUnique({
    where: { id: nextClassId },
    include: {
      _count: {
        select: { students: true },
      },
    },
  });

  if (!nextClass) {
    throw new AppError(status.NOT_FOUND, "Next class not found");
  }

  if (nextClass.capacity && nextClass._count.students >= nextClass.capacity) {
    throw new AppError(status.BAD_REQUEST, "The next class has reached its full capacity.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const nextRoll = await generateRoll(nextClassId);

    const updatedStudent = await tx.student.update({
      where: { id },
      data: {
        classId: nextClassId,
        roll: nextRoll,
      },
    });

    return updatedStudent;
  });

  return result;
};

export const StudentService = {
  createStudentInDB,
  getAllStudentsFromDB,
  promoteStudentInDB,
};
