import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { envVars } from "../config/env.js";
import prismaPkg from "../../generated/prisma/index.js";
const { PrismaClient } = prismaPkg;

const connectionString = envVars.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });

type PrismaClientType = InstanceType<typeof PrismaClient>;
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { prisma };
