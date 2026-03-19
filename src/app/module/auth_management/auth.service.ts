import status from "http-status";
import type { JwtPayload } from "jsonwebtoken";
import AppError from "../../errorHealpers/AppError.js";
import { auth } from "../../lib/auth.js";
import { prisma } from "../../lib/prisma.js";
import prismaPkg from "../../../generated/prisma/index.js";
const { Role, UserStatus } = prismaPkg;
export type Role = (typeof Role)[keyof typeof Role];
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

import type {
  IChangePasswordPayload,
  IForgetPasswordPayload,
  IResetPasswordPayload,
  IVerifyEmailPayload,
  LoginPayload,
  UserPayload,
} from "./auth.interface.js";
import { tokenUtils } from "../../utils/token.js";
import { IRequestUser } from "../../interface/requestUser.interface.js";
import { envVars } from "../../config/env.js";
import { jwtUtils } from "../../utils/jwt.js";
import crypto from "node:crypto";

const buildJwtPayload = (user: {
  id: string;
  role: Role | string;
  name: string | null;
  email: string;
  status: UserStatus | string;
  isDeleted: boolean;
  emailVerified: boolean;
}): JwtPayload => ({
  userId: user.id,
  role: user.role as Role,
  name: user.name,
  email: user.email,
  status: user.status as UserStatus,
  isDeleted: user.isDeleted,
  emailVerified: user.emailVerified,
});

const registerUser = async (payload: UserPayload, executorRole: Role) => {
  // 1. Role-based Creation Restriction
  if (payload.role === Role.ADMIN && executorRole !== Role.SUPER_ADMIN) {
    throw new AppError(
      status.FORBIDDEN,
      "Only a SUPER_ADMIN can create an ADMIN.",
    );
  }

  if (
    (payload.role === Role.TEACHER || payload.role === Role.PARENT) &&
    executorRole !== Role.ADMIN &&
    executorRole !== Role.SUPER_ADMIN
  ) {
    throw new AppError(
      status.FORBIDDEN,
      "Only an ADMIN or SUPER_ADMIN can create Teachers and Parents.",
    );
  }

  // 1. Check if user already exists in DB
  const isUserExist = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (isUserExist) {
    throw new AppError(status.CONFLICT, "User already exists");
  }

  // 2. Create user in Auth Provider
  const authResponse = await auth.api.signUpEmail({
    body: {
      email: payload.email,
      password: payload.password,
      name: payload.name,
    },
  });

  if (!authResponse || !authResponse.user) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Authentication service failed",
    );
  }

  const userId = authResponse.user.id;

  try {
    // 3. Database Transaction for Role-Specific Profiles
    const result = await prisma.$transaction(
      async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: {
            role: payload.role,
            needPasswordChange: true,
          },
        });

        let profile;

        if (payload.role === Role.PARENT) {
          profile = await tx.parent.create({
            data: {
              userId: userId,
              phone: payload.phone,
              address: payload.address,
              occupation: payload.occupation,
              image: payload.image,
            },
          });
        } else if (payload.role === Role.TEACHER) {
          profile = await tx.teacher.create({
            data: {
              userId: userId,
              phone: payload.phone,
              image: payload.image,
              specialization: payload.specialization,
              qualification: payload.qualification,
              joiningDate: new Date(payload.joiningDate),
            },
          });
        } else if (payload.role === Role.ADMIN) {
          profile = await tx.admin.create({
            data: {
              userId: userId,
              name: payload.name,
              email: payload.email,
              phone: payload.phone,
              designation: payload.designation,
              image: payload.image,
              joiningDate: new Date(payload.joiningDate),
            },
          });
        }

        return { user: authResponse.user, profile };
      },
      {
        isolationLevel: "Serializable", // Enhancing transaction isolation
      },
    );

    return result;
  } catch (error: any) {
    // 4. Rollback: Delete the Auth User if DB profile creation fails
    console.error("Transaction failed, rolling back auth user:", error);

    // Better-Auth uses the User table, so deleting from User should clean up sessions/accounts if Cascade is set
    await prisma.user
      .delete({
        where: { id: userId },
      })
      .catch(() => console.error("Critical: Failed to rollback auth user"));

    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      error.message || "Failed to complete registration profile",
    );
  }
};

const loginUser = async (payload: LoginPayload) => {
  const { email, password } = payload;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // 1. Check Account Locking
  if (user.lockUntil && user.lockUntil > new Date()) {
    const remainingMinutes = Math.ceil(
      (user.lockUntil.getTime() - Date.now()) / (1000 * 60),
    );
    throw new AppError(
      status.FORBIDDEN,
      `Account is locked. Please try again in ${remainingMinutes} minutes.`,
    );
  }

  try {
    const data = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    if (data.user.status === UserStatus.INACTIVE) {
      throw new AppError(status.FORBIDDEN, "User is inactive");
    }
    if (data.user.status === UserStatus.SUSPENDED) {
      throw new AppError(status.FORBIDDEN, "User is suspended");
    }

    if (data.user.isDeleted) {
      throw new AppError(status.NOT_FOUND, "User is deleted");
    }

    // Reset login attempts on success
    await prisma.user.update({
      where: { id: data.user.id },
      data: { loginAttempts: 0, lockUntil: null },
    });

    const jwtPayload = buildJwtPayload(data.user);
    const accessToken = tokenUtils.getAccessToken(jwtPayload);
    const refreshToken = tokenUtils.getRefreshToken(jwtPayload);

    return {
      ...data,
      accessToken,
      refreshToken,
    };
  } catch (error: any) {
    // Handle login failure
    const updatedAttempts = user.loginAttempts + 1;
    const updateData: any = { loginAttempts: updatedAttempts };

    if (updatedAttempts >= 5) {
      updateData.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
      updateData.loginAttempts = 0; // Reset attempts once locked
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    throw error;
  }
};

const getMe = async (user: IRequestUser) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      id: user.userId,
    },
    include: {
      parent: true,
      teacher: true,
      admin: true,
    },
  });

  if (!isUserExists) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // Unified Profile Response: Flattened
  const { parent, teacher, admin, ...userData } = isUserExists;
  const profile = parent || teacher || admin || null;

  return {
    ...userData,
    profile,
  };
};

const getNewToken = async (refreshToken: string, sessionToken: string) => {
  const isSessionTokenExists = await prisma.session.findUnique({
    where: {
      token: sessionToken,
    },
    include: {
      user: true,
    },
  });

  if (!isSessionTokenExists) {
    throw new AppError(status.UNAUTHORIZED, "Invalid session token");
  }

  const verifiedRefreshToken = jwtUtils.verifyToken(
    refreshToken,
    envVars.REFRESH_TOKEN_SECRET,
  );

  if (!verifiedRefreshToken.success && verifiedRefreshToken.error) {
    // If the refresh token is invalid/expired, we might want to revoke the session
    await prisma.session.delete({ where: { token: sessionToken } }).catch(() => {});
    throw new AppError(status.UNAUTHORIZED, "Invalid refresh token");
  }

  const data = verifiedRefreshToken.data as JwtPayload;

  // Token rotation: update the session token in the database
  // Since better-auth handles sessions, we should generate a new random string or let better-auth handle rotation.
  // Here we'll generate a new one using a crypto-safe method or similar length string.
  const crypto = await import("node:crypto");
  const newSessionToken = crypto.randomBytes(32).toString("hex");

  const { token } = await prisma.session.update({
    where: {
      token: sessionToken,
    },
    data: {
      token: newSessionToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 24 * 1000), // 1 day
      updatedAt: new Date(),
    },
  });

  const newAccessToken = tokenUtils.getAccessToken(data);
  const newRefreshToken = tokenUtils.getRefreshToken(data);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    sessionToken: token,
  };
};

const changePassword = async (
  payload: IChangePasswordPayload,
  sessionToken: string,
) => {
  const session = await auth.api.getSession({
    headers: new Headers({
      Authorization: `Bearer ${sessionToken}`,
    }),
  });

  if (!session) {
    throw new AppError(status.UNAUTHORIZED, "Invalid session token");
  }

  const { currentPassword, newPassword } = payload;

  const result = await auth.api.changePassword({
    body: {
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    },
    headers: new Headers({
      Authorization: `Bearer ${sessionToken}`,
    }),
  });

  if (session.user.needPasswordChange) {
    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        needPasswordChange: false,
      },
    });
  }

  const jwtPayload = buildJwtPayload(session.user);
  const accessToken = tokenUtils.getAccessToken(jwtPayload);
  const refreshToken = tokenUtils.getRefreshToken(jwtPayload);

  return {
    ...result,
    accessToken,
    refreshToken,
  };
};

const logoutUser = async (sessionToken: string) => {
  const result = await auth.api.signOut({
    headers: new Headers({
      Authorization: `Bearer ${sessionToken}`,
    }),
  });

  return result;
};

const verifyEmail = async (payload: IVerifyEmailPayload) => {
  const { email, otp } = payload;
  try {
    const result = await auth.api.verifyEmailOTP({
      body: {
        email,
        otp,
      },
    });

    if (result.status) {
      await prisma.user.update({
        where: {
          email,
        },
        data: {
          emailVerified: true,
        },
      });
    }

    return result;
  } catch (error: any) {
    if (error.status === 400 || error.message?.includes("expired")) {
      throw new AppError(status.BAD_REQUEST, "OTP has expired or is invalid. Please request a new one.");
    }
    throw error;
  }
};

const forgetPassword = async (payload: IForgetPasswordPayload) => {
  const { email } = payload;
  const isUserExist = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!isUserExist) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  if (!isUserExist.emailVerified) {
    throw new AppError(status.BAD_REQUEST, "Email not verified");
  }

  if (isUserExist.isDeleted || isUserExist.status === UserStatus.SUSPENDED) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  await auth.api.requestPasswordResetEmailOTP({
    body: {
      email,
    },
  });
};

const resetPassword = async (payload: IResetPasswordPayload) => {
  const { email, otp, newPassword } = payload;
  const isUserExist = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!isUserExist) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  if (!isUserExist.emailVerified) {
    throw new AppError(status.BAD_REQUEST, "Email not verified");
  }

  if (isUserExist.isDeleted || isUserExist.status === UserStatus.SUSPENDED) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  try {
    await auth.api.resetPasswordEmailOTP({
      body: {
        email,
        otp,
        password: newPassword,
      },
    });

    if (isUserExist.needPasswordChange) {
      await prisma.user.update({
        where: {
          id: isUserExist.id,
        },
        data: {
          needPasswordChange: false,
        },
      });
    }

    await prisma.session.deleteMany({
      where: {
        userId: isUserExist.id,
      },
    });
  } catch (error: any) {
    if (error.status === 400 || error.message?.includes("expired")) {
      throw new AppError(status.BAD_REQUEST, "OTP has expired or is invalid. Please request a new one.");
    }
    throw error;
  }
};

const googleLoginSuccess = async (session: any) => {
  // Strictly block Google registration. mapProfileToUser should have already handled this.
  // This is a safety check.
  const isUserExists = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!isUserExists) {
    throw new AppError(status.FORBIDDEN, "Only pre-registered users can log in with Google.");
  }

  const jwtPayload = buildJwtPayload(session.user);
  const accessToken = tokenUtils.getAccessToken(jwtPayload);
  const refreshToken = tokenUtils.getRefreshToken(jwtPayload);

  return {
    accessToken,
    refreshToken,
  };
};

export const AuthService = {
  registerUser,
  loginUser,
  getMe,
  getNewToken,
  changePassword,
  logoutUser,
  verifyEmail,
  forgetPassword,
  resetPassword,
  googleLoginSuccess,
};
