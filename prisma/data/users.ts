import { Role, UserStatus } from "../../src/generated/prisma/index.js";

// A pre-hashed password for the string "password123" (using bcrypt as a placeholder)
export const defaultPassword = "$2b$10$wYOMUGEg2U.pWw5vP1w0Vu1mY/hO7qB1xNnO9X9/DOWsZkZ2m.0.G";

export const dummyAdmins = [
  {
    user: {
      email: "admin@example.com",
      name: "Super Admin User",
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
    profile: {
      name: "Super Admin User",
      email: "admin@example.com",
      designation: "Principal",
      phone: "+1234567890",
      joiningDate: new Date("2020-01-01"),
    },
  },
];

export const dummyTeachers = Array.from({ length: 20 }).map((_, i) => ({
  user: {
    email: `teacher${i + 1}@example.com`,
    name: `Teacher ${i + 1}`,
    role: Role.TEACHER,
    status: UserStatus.ACTIVE,
    emailVerified: true,
  },
  profile: {
    phone: `+10000000${i.toString().padStart(2, "0")}`,
    specialization: i % 2 === 0 ? "Mathematics" : "Science",
    qualification: "MSc",
    joiningDate: new Date("2021-01-01"),
  },
}));

export const dummyParents = Array.from({ length: 20 }).map((_, i) => ({
  user: {
    email: `parent${i + 1}@example.com`,
    name: `Parent ${i + 1}`,
    role: Role.PARENT,
    status: UserStatus.ACTIVE,
    emailVerified: true,
  },
  profile: {
    phone: `+20000000${i.toString().padStart(2, "0")}`,
    address: `${i + 1} Main St, City`,
    occupation: i % 2 === 0 ? "Engineer" : "Doctor",
  },
}));

const classNames = [
  "Nursery",
  "Kindergarten",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11 (Science)",
  "Class 11 (Commerce)",
  "Class 12 (Science)",
  "Class 12 (Commerce)",
];

// Generate 40 students, assigning 2 to each parent and cycling through classes
export const dummyStudents = Array.from({ length: 40 }).map((_, i) => ({
  studentID: `STU-${(i + 1).toString().padStart(3, "0")}`,
  name: `Student ${i + 1}`,
  roll: (i % 30) + 1,
  dob: new Date(`201${(i % 5) + 2}-05-15`),
  gender: i % 2 === 0 ? "Male" : "Female",
  admissionDate: new Date("2022-01-01"),
  parentEmail: `parent${(i % 20) + 1}@example.com`,
  className: classNames[i % classNames.length],
}));
