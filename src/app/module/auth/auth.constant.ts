import { z } from "zod";
import pkg from "../../../generated/prisma/index.js";
const { Role } = pkg;

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must not exceed 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character",
  );

const RegistrationValidationSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal(Role.PARENT),
    email: z.email("Invalid email address"),
    password: passwordSchema,
    name: z.string(),
    phone: z.string(),
    image: z.string().optional(),
    address: z.string(),
    occupation: z.string(),
  }),
  z.object({
    role: z.literal(Role.TEACHER),
    email: z.email("Invalid email address"),
    password: passwordSchema,
    name: z.string(),
    phone: z.string(),
    image: z.string().optional(),
    specialization: z.string(),
    qualification: z.string(),
    joiningDate: z.string(),
  }),
  z.object({
    role: z.literal(Role.ADMIN),
    email: z.email("Invalid email address"),
    password: passwordSchema,
    name: z.string(),
    phone: z.string(),
    image: z.string().optional(),
    designation: z.string(),
    joiningDate: z.string(),
  }),
]);

const LoginValidationSchema = z.object({
  email: z.email(),
  password: z.string().min(6), // Minimum password requirement for login
});

const ChangePasswordValidationSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: passwordSchema,
});

const VerifyEmailValidationSchema = z.object({
  email: z.email(),
  otp: z.string().length(6),
});

const ForgetPasswordValidationSchema = z.object({
  email: z.email(),
});

const ResetPasswordValidationSchema = z.object({
  email: z.email(),
  otp: z.string().length(6),
  newPassword: passwordSchema,
});

export const AuthValidation = {
  RegistrationValidationSchema,
  LoginValidationSchema,
  ChangePasswordValidationSchema,
  VerifyEmailValidationSchema,
  ForgetPasswordValidationSchema,
  ResetPasswordValidationSchema,
};
