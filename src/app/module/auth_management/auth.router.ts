import { Router } from "express";

import { validateRequest } from "../../middleware/validateRequest.js";
import { AuthValidation } from "./auth.constant.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import prismaPkg from "../../../generated/prisma/index.js";
const { Role } = prismaPkg;
import { multerUpload } from "../../config/multer.config.js";
import { AuthController } from "./auth.controller.js";

const router = Router();

router.post(
  "/register",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  multerUpload.single("file"),
  validateRequest(AuthValidation.RegistrationValidationSchema),
  AuthController.registerUser,
);

router.post(
  "/login",
  validateRequest(AuthValidation.LoginValidationSchema),
  AuthController.loginUser,
);

router.get(
  "/me",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER, Role.PARENT),
  AuthController.getMe,
);

router.post("/refresh-token", AuthController.getNewToken);

router.post(
  "/change-password",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER, Role.PARENT),
  validateRequest(AuthValidation.ChangePasswordValidationSchema),
  AuthController.changePassword,
);

router.post(
  "/verify-email",
  validateRequest(AuthValidation.VerifyEmailValidationSchema),
  AuthController.verifyEmail,
);

router.post(
  "/resend-verification-email",
  validateRequest(AuthValidation.ForgetPasswordValidationSchema),
  AuthController.resendVerificationEmail,
);

router.post(
  "/forgot-password",
  validateRequest(AuthValidation.ForgetPasswordValidationSchema),
  AuthController.forgetPassword,
);

router.post(
  "/reset-password",
  validateRequest(AuthValidation.ResetPasswordValidationSchema),
  AuthController.resetPassword,
);

router.post(
  "/logout",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER, Role.PARENT),
  AuthController.logoutUser,
);

router.get("/login/google", AuthController.googleLogin);
router.get("/google/success", AuthController.googleLoginSuccess);
router.get("/oauth/error", AuthController.handleOAuthError);

export const AuthRoutes: Router = router;
