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
  ClassController.createClass
);

export const ClassRoutes = router;
