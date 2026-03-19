import prismaPkg from "../../../generated/prisma/index.js";
const { Role } = prismaPkg;
export type Role = (typeof Role)[keyof typeof Role];

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
  joiningDate: string;
  qualification: string;
}

interface AdminPayload extends BasePayload {
  role: typeof Role.ADMIN;
  designation: string;
  joiningDate: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export type UserPayload = ParentPayload | TeacherPayload | AdminPayload;

export interface IChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface IVerifyEmailPayload {
  email: string;
  otp: string;
}

export interface IForgetPasswordPayload {
  email: string;
}

export interface IResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}