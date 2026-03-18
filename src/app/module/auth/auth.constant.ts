import { z } from "zod";
import { Role } from "../../../generated/prisma/index.js";

const RegistrationValidationSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal(Role.PARENT),
    email: z.email(),
    password: z.string().min(6),
    name: z.string(),
    phone: z.string(),
    image: z.string().optional(),
    address: z.string(),
    occupation: z.string(),
  }),
  z.object({
    role: z.literal(Role.TEACHER),
    email: z.email(),
    password: z.string().min(6),
    name: z.string(),
    phone: z.string(),
    image: z.string().optional(),
    specialization: z.string(),
    qualification: z.string(),
    joiningDate: z.string().transform((str) => new Date(str)),
  }),
  z.object({
    role: z.literal(Role.ADMIN),
    email: z.email(),
    password: z.string().min(6),
    name: z.string(),
    phone: z.string(),
    image: z.string().optional(),
    designation: z.string(),
    joiningDate: z.string().transform((str) => new Date(str)),
  }),
]);

export const AuthValidation = {
  RegistrationValidationSchema,
};
