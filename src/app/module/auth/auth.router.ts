import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { AuthValidation } from "./auth.constant.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { Role } from "../../../generated/prisma/index.js";
import { multerUpload } from "../../config/multer.config.js";

const router = Router();

router.post(
  "/register",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  multerUpload.single("file"),
  validateRequest(AuthValidation.RegistrationValidationSchema),
  AuthController.registerUser,
);

export const AuthRoutes: Router = router;
