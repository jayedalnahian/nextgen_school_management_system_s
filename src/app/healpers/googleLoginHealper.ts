import { prisma } from "../lib/prisma.js";
import prismaPkg from "../../generated/prisma/index.js";

const { UserStatus } = prismaPkg;

export const googleLoginHealpers = async (profile: any) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: profile.email,
    },
  });

  if (!existingUser) {
    throw new Error("User is not registered by admin");
  }

  if (existingUser.status !== UserStatus.ACTIVE) {
    throw new Error("User is not active");
  }

  if (existingUser.isDeleted) {
    throw new Error("User is deleted");
  }

  return {
    id: existingUser.id,
    email: existingUser.email,
    role: existingUser.role,
    status: existingUser.status,
    emailVerified: true,
  };
};
