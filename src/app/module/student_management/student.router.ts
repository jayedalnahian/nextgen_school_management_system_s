import express from "express";
import { validateRequest } from "../../middleware/validateRequest.js";
import { StudentValidation } from "./student.validation.js";
import { StudentController } from "./student.controller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { Role } from "../../../generated/prisma/index.js";

const router = express.Router();

router.post(
  "/",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
  validateRequest(StudentValidation.createStudentSchema),
  StudentController.createStudent,
);

router.get(
  "/",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER),
  StudentController.getAllStudents,
);

router.patch(
  "/:id/promote",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
  validateRequest(StudentValidation.promoteStudentSchema),
  StudentController.promoteStudent,
);

export const StudentRoutes = router;
