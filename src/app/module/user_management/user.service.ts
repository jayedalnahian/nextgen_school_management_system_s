import status from "http-status";
import { Prisma, Role, UserStatus } from "../../../generated/prisma/index.js";
import AppError from "../../errorHealpers/AppError.js";
import { IRequestUser } from "../../interface/requestUser.interface.js";
import { prisma } from "../../lib/prisma.js";
import { QueryBuilder } from "../../utils/QueryBuilder.js";
import { userFilterableFields, userSearchableFields } from "./user.constant.js";
import { IUserQueryParams } from "./user.interface.js";
import { z } from "zod";
import { UserValidation } from "./user.validation.js";

type IUpdateUserPayload = z.infer<typeof UserValidation.updateUserSchema>;

const getAllUsersFromDB = async (query: IUserQueryParams) => {
  if (query.isDeleted === undefined) {
    query.isDeleted = "false";
  }

  if (!query.fields && !query.include) {
    query.fields =
      "id,email,name,emailVerified,image,createdAt,updatedAt,role,status,needPasswordChange,isDeleted,loginAttempts,lockUntil";
  }

  const userQuery = new QueryBuilder(prisma.user, query, {
    searchableFields: userSearchableFields,
    filterableFields: userFilterableFields,
  })
    .search()
    .filter()
    .dynamicInclude({ teacher: true, admin: true, parent: true })
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

const updateUserInDB = async (
  id: string,
  payload: IUpdateUserPayload,
  reqUser: IRequestUser,
) => {
  const targetUser = await prisma.user.findUniqueOrThrow({
    where: { id, isDeleted: false },
    include: { admin: true, teacher: true, parent: true },
  });

  // 1. Authorization Rules (Strict Enforcement)
  if (reqUser.role === Role.TEACHER || reqUser.role === Role.PARENT) {
    if (reqUser.userId !== id) {
      throw new AppError(status.FORBIDDEN, "You can only update your own profile.");
    }
    // CANNOT change own role or status
    delete payload.role;
    delete payload.status;
  }

  if (reqUser.role === Role.ADMIN) {
    if (targetUser.role === Role.SUPER_ADMIN) {
      throw new AppError(status.FORBIDDEN, "Admin cannot update SUPER_ADMIN data.");
    }
    if (reqUser.userId === id) {
      delete payload.role;
      delete payload.status;
    }
  }

  // 2. Separate User data from Profile data
  const { name, image, role, status: userStatus, ...profileData } = payload;

  const userData: Prisma.UserUpdateInput = {};
  if (name !== undefined) userData.name = name;
  if (image !== undefined) userData.image = image;
  if (role !== undefined) userData.role = role;
  if (userStatus !== undefined) userData.status = userStatus;

  // 3. Transaction Logic
  const result = await prisma.$transaction(async (tx) => {
    // Update User
    let updatedUser = targetUser;
    if (Object.keys(userData).length > 0) {
      updatedUser = await tx.user.update({
        where: { id },
        data: userData,
        include: { admin: true, teacher: true, parent: true },
      });
    }

    // Update Profile conditionally
    if (Object.keys(profileData).length > 0 || image !== undefined || name !== undefined) {
      const targetRole = updatedUser.role;

      if (targetRole === Role.ADMIN && targetUser.admin) {
        const adminData: Prisma.AdminUpdateInput = {};
        if (profileData.designation !== undefined) adminData.designation = profileData.designation;
        if (profileData.phone !== undefined) adminData.phone = profileData.phone;
        if (profileData.joiningDate !== undefined) adminData.joiningDate = new Date(profileData.joiningDate);
        if (name !== undefined) adminData.name = name;
        if (image !== undefined) adminData.image = image;

        if (Object.keys(adminData).length > 0) {
          await tx.admin.update({
            where: { userId: id },
            data: adminData,
          });
        }
      } else if (targetRole === Role.TEACHER && targetUser.teacher) {
        const teacherData: Prisma.TeacherUpdateInput = {};
        if (profileData.phone !== undefined) teacherData.phone = profileData.phone;
        if (profileData.specialization !== undefined) teacherData.specialization = profileData.specialization;
        if (profileData.qualification !== undefined) teacherData.qualification = profileData.qualification;
        if (profileData.bio !== undefined) teacherData.bio = profileData.bio;
        if (profileData.joiningDate !== undefined) teacherData.joiningDate = new Date(profileData.joiningDate);
        if (image !== undefined) teacherData.image = image;

        if (Object.keys(teacherData).length > 0) {
          await tx.teacher.update({
            where: { userId: id },
            data: teacherData,
          });
        }
      } else if (targetRole === Role.PARENT && targetUser.parent) {
        const parentData: Prisma.ParentUpdateInput = {};
        if (profileData.phone !== undefined) parentData.phone = profileData.phone;
        if (profileData.address !== undefined) parentData.address = profileData.address;
        if (profileData.occupation !== undefined) parentData.occupation = profileData.occupation;
        if (image !== undefined) parentData.image = image;

        if (Object.keys(parentData).length > 0) {
          await tx.parent.update({
            where: { userId: id },
            data: parentData,
          });
        }
      }
    }

    return await tx.user.findUnique({
      where: { id },
      include: {
        admin: true,
        teacher: true,
        parent: true,
      },
    });
  });

  return result;
};

const softDeleteUserFromDB = async (targetId: string, reqUser: IRequestUser) => {
  const targetUser = await prisma.user.findUniqueOrThrow({
    where: { id: targetId, isDeleted: false },
  });

  // 1. Self-deletion check
  if (reqUser.userId === targetId) {
    throw new AppError(status.FORBIDDEN, "You cannot delete your own account.");
  }

  // 2. Authorization Rules
  if (reqUser.role === Role.ADMIN) {
    if (targetUser.role === Role.ADMIN || targetUser.role === Role.SUPER_ADMIN) {
      throw new AppError(status.FORBIDDEN, "Admin cannot delete other Admin or Super Admin.");
    }
  }

  // 3. Transaction for soft delete and session cleanup
  const result = await prisma.$transaction(async (tx) => {
    // Soft delete user
    const deletedUser = await tx.user.update({
      where: { id: targetId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: UserStatus.INACTIVE,
      },
    });

    // Revoke sessions
    await tx.session.deleteMany({
      where: { userId: targetId },
    });

    return deletedUser;
  });

  return result;
};

export const UserService = {
  getAllUsersFromDB,
  getSingleUser,
  updateUserInDB,
  softDeleteUserFromDB,
};
