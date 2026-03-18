import prismaPkg from "../../generated/prisma/index.js";
const { Role } = prismaPkg;
export type Role = (typeof Role)[keyof typeof Role];


export interface IRequestUser {
    userId: string;
    role: Role;
    email: string;
}