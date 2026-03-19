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

export const ClassService = {
  createClassInDB,
  getAllClassesFromDB,
  updateClassInDB,
};
