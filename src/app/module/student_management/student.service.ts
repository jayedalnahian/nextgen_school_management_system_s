import { prisma } from "../../lib/prisma.js";
import AppError from "../../errorHealpers/AppError.js";
import status from "http-status";
import { generateRoll, generateStudentId } from "../../utils/student.utils.js";

const createStudentInDB = async (payload: any) => {
  const { name, dob, gender, classId, parentId } = payload;

  // 1. Verify Parent existence
  const parent = await prisma.parent.findUnique({
    where: { id: parentId },
  });
  if (!parent) {
    throw new AppError(status.NOT_FOUND, "Parent not found");
  }

  // 2. Verify Class existence
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

  // 3. Check Capacity
  if (classObj.capacity && classObj._count.students >= classObj.capacity) {
    throw new AppError(status.BAD_REQUEST, "Class capacity reached");
  }

  // 4. Prisma Transaction for atomic admission
  const result = await prisma.$transaction(async (tx) => {
    // Generate IDs inside transaction for safety
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

export const StudentService = {
  createStudentInDB,
};
