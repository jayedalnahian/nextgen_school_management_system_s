import status from "http-status";
import AppError from "../../errorHealpers/AppError.js";
import { prisma } from "../../lib/prisma.js";
import { QueryBuilder } from "../../utils/QueryBuilder.js";
import { classFilterableFields, classSearchableFields } from "./class.constant.js";
import { IClass, IClassQueryParams } from "./class.interface.js";

const createClassInDB = async (payload: IClass) => {
  // ... (existing code remains)
  const isClassExists = await prisma.class.findFirst({
    where: {
      name: payload.name,
      section: payload.section || null,
      isDeleted: false,
    },
  });

  if (isClassExists) {
    throw new AppError(status.BAD_REQUEST, "Class with this section already exists.");
  }

  const result = await prisma.class.create({
    data: payload,
  });

  return result;
};

const getAllClassesFromDB = async (query: IClassQueryParams) => {
  if (query.isDeleted === undefined) {
    query.isDeleted = "false";
  }

  const classQuery = new QueryBuilder(prisma.class, query, {
    searchableFields: classSearchableFields,
    filterableFields: classFilterableFields,
  })
    .search()
    .filter()
    .sort()
    .paginate();

  if (query.include === "students") {
    classQuery.include({
      _count: {
        select: { students: true },
      },
    });
  }

  const result = await classQuery.execute();
  return result;
};

const updateClassInDB = async (id: string, payload: Partial<IClass>) => {
  const isClassExists = await prisma.class.findUnique({
    where: { id, isDeleted: false },
  });

  if (!isClassExists) {
    throw new AppError(status.NOT_FOUND, "Class not found.");
  }

  // Handle unique constraint check (name + section conflict)
  if (payload.name || payload.section) {
    const conflictClass = await prisma.class.findFirst({
      where: {
        name: payload.name || isClassExists.name,
        section: payload.section !== undefined ? payload.section : isClassExists.section,
        isDeleted: false,
        NOT: { id },
      },
    });

    if (conflictClass) {
      throw new AppError(status.CONFLICT, "Class with this name and section already exists.");
    }
  }

  const result = await prisma.class.update({
    where: { id },
    data: payload,
  });

  return result;
};

const softDeleteClassFromDB = async (id: string) => {
  const isClassExists = await prisma.class.findUnique({
    where: { id },
  });

  if (!isClassExists) {
    throw new AppError(status.NOT_FOUND, "Class not found.");
  }

  if (isClassExists.isDeleted) {
    return { message: "Class is already deleted." };
  }

  // Dependency check: Count non-deleted students
  const activeStudentCount = await prisma.student.count({
    where: { classId: id, isDeleted: false },
  });

  if (activeStudentCount > 0) {
    throw new AppError(
      status.BAD_REQUEST,
      "Cannot delete class with active students. Transfer students before deleting.",
    );
  }

  const result = await prisma.class.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  return result;
};

const assignTeacherToClassInDB = async (payload: {
  classId: string;
  teacherId: string;
  isClassTeacher: boolean;
}) => {
  const { classId, teacherId, isClassTeacher } = payload;

  // 1. Verify class existence
  const isClassExists = await prisma.class.findUnique({
    where: { id: classId, isDeleted: false },
  });

  if (!isClassExists) {
    throw new AppError(status.NOT_FOUND, "Class not found.");
  }

  // 2. Verify teacher existence and role
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: { user: true },
  });

  if (!teacher) {
    throw new AppError(status.NOT_FOUND, "Teacher not found.");
  }

  if (teacher.user.role !== "TEACHER") {
    throw new AppError(
      status.BAD_REQUEST,
      "The provided teacherId does not belong to a user with TEACHER role.",
    );
  }

  // 3. Check for duplicate assignment
  const isAlreadyAssigned = await prisma.classTeacher.findUnique({
    where: {
      teacherId_classId: {
        teacherId,
        classId,
      },
    },
  });

  if (isAlreadyAssigned) {
    throw new AppError(status.CONFLICT, "This teacher is already assigned to this class.");
  }

  // 4. Prisma Transaction for Class Teacher swap logic
  const result = await prisma.$transaction(async (tx) => {
    if (isClassTeacher) {
      // Find existing class teacher for this class
      const existingClassTeacher = await tx.classTeacher.findFirst({
        where: { classId, isClassTeacher: true },
      });

      if (existingClassTeacher) {
        // Set their isClassTeacher to false
        await tx.classTeacher.update({
          where: {
            teacherId_classId: {
              teacherId: existingClassTeacher.teacherId,
              classId: existingClassTeacher.classId,
            },
          },
          data: { isClassTeacher: false },
        });
      }
    }

    // Create the new assignment
    const assignment = await tx.classTeacher.create({
      data: {
        teacherId,
        classId,
        isClassTeacher,
      },
    });

    return assignment;
  });

  return result;
};

const assignSubjectToClassInDB = async (payload: {
  classId: string;
  subjects: {
    subjectId: string;
    totalMarks?: number;
    passMarks?: number;
    isOptional?: boolean;
  }[];
}) => {
  const { classId, subjects } = payload;

  // 1. Verify class existence
  const isClassExists = await prisma.class.findUnique({
    where: { id: classId, isDeleted: false },
  });

  if (!isClassExists) {
    throw new AppError(status.NOT_FOUND, "Class not found.");
  }

  // 2. Bulk Validation: Ensure all subjectIds exist
  const subjectIds = subjects.map((s) => s.subjectId);
  const existingSubjects = await prisma.subject.findMany({
    where: { id: { in: subjectIds } },
    select: { id: true },
  });

  if (existingSubjects.length !== subjectIds.length) {
    const existingIds = existingSubjects.map((s) => s.id);
    const missingIds = subjectIds.filter((id) => !existingIds.includes(id));
    throw new AppError(status.NOT_FOUND, `Subjects not found: ${missingIds.join(", ")}`);
  }

  // 3. Check for already assigned subjects
  const alreadyAssigned = await prisma.classSubject.findMany({
    where: {
      classId,
      subjectId: { in: subjectIds },
    },
  });

  if (alreadyAssigned.length > 0) {
    const assignedIds = alreadyAssigned.map((a) => a.subjectId);
    throw new AppError(
      status.CONFLICT,
      `Subjects already assigned to this class: ${assignedIds.join(", ")}`,
    );
  }

  // 4. Mark logic validation
  subjects.forEach((s) => {
    const total = s.totalMarks ?? 100;
    const pass = s.passMarks ?? 33;
    if (pass >= total) {
      throw new AppError(
        status.BAD_REQUEST,
        `Pass marks (${pass}) must be less than total marks (${total}) for subject ${s.subjectId}`,
      );
    }
  });

  // 5. Prisma Transaction for bulk assignment
  const result = await prisma.$transaction(async (tx) => {
    const assignments = await Promise.all(
      subjects.map((s) =>
        tx.classSubject.create({
          data: {
            classId,
            subjectId: s.subjectId,
            totalMarks: s.totalMarks ?? 100,
            passMarks: s.passMarks ?? 33,
            isOptional: s.isOptional ?? false,
          },
        }),
      ),
    );
    return assignments;
  });

  return result;
};

export const ClassService = {
  createClassInDB,
  getAllClassesFromDB,
  updateClassInDB,
  softDeleteClassFromDB,
  assignTeacherToClassInDB,
  assignSubjectToClassInDB,
};
