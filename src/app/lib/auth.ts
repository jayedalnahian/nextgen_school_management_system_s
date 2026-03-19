import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer, emailOTP } from "better-auth/plugins";
import { prisma } from "./prisma.js";
import { envVars } from "../config/env.js";
import prismaPkg from "../../generated/prisma/index.js";
const { Role, UserStatus } = prismaPkg;
import { sendEmail } from "../utils/email.js";
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
    },
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

  plugins: [
    bearer(),
    emailOTP({
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        console.log(`[auth.ts] Starting ${type} for email: ${email}`);

        // Retry logic to handle race conditions where the user might not be immediately visible
        let user = null;
        for (let i = 0; i < 3; i++) {
          user = await prisma.user.findUnique({
            where: { email },
          });
          if (user) break;
          console.log(`[auth.ts] User not found, retrying lookup (${i + 1}/3)...`);
          await new Promise((resolve) => setTimeout(resolve, 500)); // wait 500ms
        }

        if (type === "email-verification") {
          if (!user) {
            console.error(
              `[auth.ts] User with email ${email} not found after retries. Cannot send verification OTP.`,
            );
            return;
          }

          if (user.role === Role.SUPER_ADMIN) {
            console.log(
              `[auth.ts] User ${email} is a super admin. Skipping sending verification OTP.`,
            );
            return;
          }

          if (!user.emailVerified) {
            console.log(`[auth.ts] Sending verification email to ${email}...`);
            try {
              await sendEmail({
                to: email,
                subject: "Verify your email",
                templateName: "otp",
                templateData: {
                  name: user.name,
                  otp,
                },
              });
              console.log(`[auth.ts] Verification email sent to ${email}`);
            } catch (error: any) {
              console.error(
                `[auth.ts] Failed to send verification email to ${email}:`,
                error.message,
              );
            }
          } else {
            console.log(`[auth.ts] User ${email} already verified. Skipping email.`);
          }
        } else if (type === "forget-password") {
          if (user) {
            console.log(`[auth.ts] Sending forget-password email to ${email}...`);
            try {
              await sendEmail({
                to: email,
                subject: "Password Reset OTP",
                templateName: "otp",
                templateData: {
                  name: user.name,
                  otp,
                },
              });
              console.log(`[auth.ts] Forget-password email sent to ${email}`);
            } catch (error: any) {
              console.error(
                `[auth.ts] Failed to send forget-password email to ${email}:`,
                error.message,
              );
            }
          } else {
            console.error(
              `[auth.ts] User with email ${email} not found for forget-password.`,
            );
          }
        }
      },
      expiresIn: 2 * 60, // 2 minutes in seconds
      otpLength: 6,
    }),
  ],

  session: {
    expiresIn: 60 * 60 * 60 * 24, // 1 day in seconds
    updateAge: 60 * 60 * 60 * 24, // 1 day in seconds
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 60 * 24, // 1 day in seconds
    },
  },

  redirectURLs: {
    signIn: `${envVars.BETTER_AUTH_URL}/api/v1/auth/google/success`,
  },

  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:5000",
    envVars.FRONTEND_URL,
  ],

  advanced: {
    // disableCSRFCheck: true,
    useSecureCookies: false,
    cookies: {
      state: {
        attributes: {
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          httpOnly: true,
          path: "/",
        },
      },
      sessionToken: {
        attributes: {
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          httpOnly: true,
          path: "/",
        },
      },
    },
  },
});
