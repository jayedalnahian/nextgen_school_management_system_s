import { prisma } from "../src/app/lib/prisma.js";
import { dummyClasses } from "./data/classes.js";
import { dummySubjects } from "./data/subjects.js";
import {
  dummyAdmins,
  dummyTeachers,
  dummyParents,
  dummyStudents,
  defaultPassword,
} from "./data/users.js";
import {
  dummyClassSubjects,
  dummyClassTeachers,
} from "./data/academicRelations.js";

async function main() {
  console.log("Starting DB Seed...");

  // 1. Clean up database (reverse order)
  console.log("Cleaning up database...");
  await prisma.classTeacher.deleteMany();
  await prisma.classSubject.deleteMany();
  await prisma.student.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.result.deleteMany();
  await prisma.payment.deleteMany();

  await prisma.admin.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.parent.deleteMany();

  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  await prisma.class.deleteMany();
  await prisma.subject.deleteMany();
  console.log("Database cleared.");

  // 2. Maps to resolve relations
  const subjectMap = new Map<string, string>(); // subjectName -> subjectId
  const classMap = new Map<string, string>(); // className -> classId
  const teacherMap = new Map<string, string>(); // email -> teacherId
  const parentMap = new Map<string, string>(); // email -> parentId

  // 3. Seed Subjects and Classes
  console.log("Seeding Subjects...");
  for (const s of dummySubjects) {
    const created = await prisma.subject.create({ data: s });
    subjectMap.set(created.name, created.id);
  }
  console.log(`✔ Seeded ${dummySubjects.length} Subjects.`);

  console.log("Seeding Classes...");
  for (const c of dummyClasses) {
    const created = await prisma.class.create({ data: c });
    classMap.set(created.name, created.id);
  }
  console.log(`✔ Seeded ${dummyClasses.length} Classes.`);

  // 4. Seed Users (Admins, Teachers, Parents)
  console.log("Seeding Admins...");
  for (const data of dummyAdmins) {
    await prisma.user.create({
      data: {
        ...data.user,
        admin: { create: data.profile },
        accounts: {
          create: {
            accountId: data.user.email,
            providerId: "credentials",
            password: defaultPassword,
          },
        },
      },
    });
  }
  console.log(`✔ Seeded ${dummyAdmins.length} Admins.`);

  console.log("Seeding Teachers...");
  for (const data of dummyTeachers) {
    const createdUser = await prisma.user.create({
      data: {
        ...data.user,
        teacher: { create: data.profile },
        accounts: {
          create: {
            accountId: data.user.email,
            providerId: "credentials",
            password: defaultPassword,
          },
        },
      },
      include: { teacher: true },
    });
    if (createdUser.teacher) {
      teacherMap.set(data.user.email, createdUser.teacher.id);
    }
  }
  console.log(`✔ Seeded ${dummyTeachers.length} Teachers.`);

  console.log("Seeding Parents...");
  for (const data of dummyParents) {
    const createdUser = await prisma.user.create({
      data: {
        ...data.user,
        parent: { create: data.profile },
        accounts: {
          create: {
            accountId: data.user.email,
            providerId: "credentials",
            password: defaultPassword,
          },
        },
      },
      include: { parent: true },
    });
    if (createdUser.parent) {
      parentMap.set(data.user.email, createdUser.parent.id);
    }
  }
  console.log(`✔ Seeded ${dummyParents.length} Parents.`);

  // 5. Seed Students
  console.log("Seeding Students...");
  for (const std of dummyStudents) {
    const { parentEmail, className, ...rest } = std;
    const parentId = parentMap.get(parentEmail);
    const classId = classMap.get(className);

    if (!parentId || !classId) {
      console.error(`Cannot find parent or class for student ${rest.name}`);
      continue;
    }

    await prisma.student.create({
      data: { ...rest, parentId, classId },
    });
  }
  console.log(`✔ Seeded ${dummyStudents.length} Students.`);

  // 6. Seed Academic Relations
  console.log("Seeding Class Subjects...");
  for (const rel of dummyClassSubjects) {
    const { className, subjectName, ...rest } = rel;
    const classId = classMap.get(className);
    const subjectId = subjectMap.get(subjectName);

    if (!classId || !subjectId) continue;

    await prisma.classSubject.create({
      data: { ...rest, classId, subjectId },
    });
  }
  console.log(`✔ Seeded ${dummyClassSubjects.length} ClassSubjects.`);

  console.log("Seeding Class Teachers...");
  for (const rel of dummyClassTeachers) {
    const { className, teacherEmail, isClassTeacher } = rel;
    const classId = classMap.get(className);
    const teacherId = teacherMap.get(teacherEmail);

    if (!classId || !teacherId) continue;

    await prisma.classTeacher.create({
      data: { isClassTeacher, classId, teacherId },
    });
  }
  console.log(`✔ Seeded ${dummyClassTeachers.length} ClassTeachers.`);

  console.log("✔ DB Seeded Successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
