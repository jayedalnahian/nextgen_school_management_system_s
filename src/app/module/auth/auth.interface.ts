import type { Role } from "../../../generated/prisma/index.js";

interface BasePayload {
  email: string;
  password: string;
  name: string;
  phone: string;
  image?: string;
}

interface ParentPayload extends BasePayload {
  role: typeof Role.PARENT; // Use literal type for narrowing
  address: string;
  occupation: string;
}

interface TeacherPayload extends BasePayload {
  role: typeof Role.TEACHER;
  specialization: string;
  department: string;
  joiningDate: Date;
  qualification: string;
}

interface AdminPayload extends BasePayload {
  role: typeof Role.ADMIN;
  designation: string;
  joiningDate: Date;
}

export type UserPayload = ParentPayload | TeacherPayload | AdminPayload;