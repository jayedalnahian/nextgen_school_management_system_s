import status from "http-status";
import { Role, UserStatus } from "../../../generated/prisma/index.js";
import AppError from "../../errorHealpers/AppError.js";
import { IRequestUser } from "../../interface/requestUser.interface.js";
import { prisma } from "../../lib/prisma.js";
import { QueryBuilder } from "../../utils/QueryBuilder.js";
import { userFilterableFields, userSearchableFields } from "./user.constant.js";
import { IUserQueryParams } from "./user.interface.js";

const getAllUsersFromDB = async (query: IUserQueryParams) => {
  if (query.isDeleted === undefined) {
    query.isDeleted = "false";
  }

  if (!query.fields) {
    query.fields =
      "id,email,name,emailVerified,image,createdAt,updatedAt,role,status,needPasswordChange,isDeleted,loginAttempts,lockUntil";
  }

  const userQuery = new QueryBuilder(prisma.user, query, {
    searchableFields: userSearchableFields,
    filterableFields: userFilterableFields,
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await userQuery.execute();
  return result;
};

const getSingleUser = async (id: string) => {
  const result = await prisma.user.findUniqueOrThrow({
    where: {
      id,
      isDeleted: false,
    },
    include: {
      parent: true,
      teacher: true,
      admin: true,
    },
  });

  return result;
};

export const UserService = {
  getAllUsersFromDB,
  getSingleUser,
};
