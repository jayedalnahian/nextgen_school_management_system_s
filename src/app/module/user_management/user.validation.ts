import { z } from "zod";
import prismaPkg from "../../../generated/prisma/index.js";
const { Role, UserStatus } = prismaPkg;

export const getAllUsersQuerySchema = z.object({
  searchTerm: z.string().optional(),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  isDeleted: z.enum(["true", "false"]).optional(),
});

export const UserValidation = {
  getAllUsersQuerySchema,
};
