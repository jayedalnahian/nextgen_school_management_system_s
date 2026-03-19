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

export const ClassService = {
  createClassInDB,
  getAllClassesFromDB,
};
