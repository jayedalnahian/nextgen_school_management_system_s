import type { Role } from "../../generated/prisma/index.js";


export interface IRequestUser {
    userId: string;
    role: Role;
    email: string;
}