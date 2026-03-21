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

export const checkPromotionClearance = async (studentId: string, currentClassId: string) => {
  // 1. Fetch mandatory subjects for current class
  const classSubjects = await prisma.classSubject.findMany({
    where: {
      classId: currentClassId,
      isOptional: false,
    },
  });

  // 2. Fetch student results for current class
  const results = await prisma.result.findMany({
    where: {
      studentId,
      classId: currentClassId,
    },
  });

  const resultBySubject = new Map(results.map((r) => [r.subjectId, r.marksObtained]));

  // 3. Validate each mandatory subject
  const failures: string[] = [];
  
  for (const subject of classSubjects) {
    const marks = resultBySubject.get(subject.subjectId);
    if (marks === undefined) {
      failures.push(`Missing result for subjectId: ${subject.subjectId}`);
    } else if (marks < subject.passMarks) {
      failures.push(`Failed in subjectId: ${subject.subjectId} (Marks: ${marks}, Pass: ${subject.passMarks})`);
    }
  }

  return {
    isPassed: failures.length === 0,
    failures,
  };
};
