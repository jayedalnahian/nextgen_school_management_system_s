import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";
import { envVars } from "../config/env.js";
import { Role, UserStatus } from "../../generated/prisma/index.js";
import AppError from "../errorHealpers/AppError.js";
import status from "http-status";
import { googleLoginHealpers } from "../healpers/googleLoginHealper.js";

export const auth = betterAuth({
  baseURL: envVars.BETTER_AUTH_URL,
  secret: envVars.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },

  socialProviders: {
    google: {
      clientId: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,
      // callbackUrl: envVars.GOOGLE_CALLBACK_URL,
      mapProfileToUser: async (profile: any) => {
        const existingUser = await googleLoginHealpers(profile);

        return {
          id: existingUser.id,
          email: existingUser.email,
          role: existingUser.role,
          status: existingUser.status,
          emailVerified: true,
        };
      },

      emailVerification: {
        sendOnSignUp: true,
        sendOnSignIn: true,
        autoSignInAfterVerification: true,
      },
      user: {
        additionalFields: {
          role: {
            type: "string",
            required: true,
            defaultValue: Role.PARENT,
          },

          status: {
            type: "string",
            required: true,
            defaultValue: UserStatus.ACTIVE,
          },

          needPasswordChange: {
            type: "boolean",
            required: true,
            defaultValue: false,
          },

          isDeleted: {
            type: "boolean",
            required: true,
            defaultValue: false,
          },

          deletedAt: {
            type: "date",
            required: false,
            defaultValue: null,
          },
        },
      },
    },
  },
});
