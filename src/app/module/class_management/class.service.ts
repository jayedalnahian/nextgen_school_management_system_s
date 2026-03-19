import status from "http-status";
import AppError from "../../errorHealpers/AppError.js";
import { prisma } from "../../lib/prisma.js";
import { IClass } from "./class.interface.js";

const createClassInDB = async (payload: IClass) => {
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

export const ClassService = {
  createClassInDB,
};
