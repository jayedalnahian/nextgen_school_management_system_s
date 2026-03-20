import { Router } from "express";
import { ClassController } from "./class.controller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { ClassValidation } from "./class.validation.js";
import { Role } from "../../../generated/prisma/index.js";

const router = Router();

router.post(
  "/",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
  validateRequest(ClassValidation.createClassSchema),
  ClassController.createClass,
);

router.post(
  "/assign-teacher",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
  validateRequest(ClassValidation.assignTeacherSchema),
  ClassController.assignTeacher,
);

router.get(
  "/",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER),
  ClassController.getAllClasses,
);

router.patch(
  "/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
  validateRequest(ClassValidation.updateClassSchema),
  ClassController.updateClass,
);

router.delete("/:id", checkAuth(Role.ADMIN), ClassController.deleteClass);

export const ClassRoutes = router;
