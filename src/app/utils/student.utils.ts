import { prisma } from "../lib/prisma.js";

export const generateStudentId = async () => {
  const currentYear = new Date().getFullYear();
  const currentYearStr = currentYear.toString();

  const lastStudent = await prisma.student.findFirst({
    where: {
      studentID: {
        startsWith: `STU-${currentYearStr}-`,
      },
    },
    orderBy: {
      studentID: "desc",
    },
  });

  let currentId = "0";
  if (lastStudent) {
    currentId = lastStudent.studentID.split("-")[2];
  }

  const incrementId = (parseInt(currentId) + 1).toString().padStart(3, "0");
  return `STU-${currentYearStr}-${incrementId}`;
};

export const generateRoll = async (classId: string) => {
  const lastStudent = await prisma.student.findFirst({
    where: {
      classId,
    },
    orderBy: {
      roll: "desc",
    },
  });

  return lastStudent ? lastStudent.roll + 1 : 1;
};
