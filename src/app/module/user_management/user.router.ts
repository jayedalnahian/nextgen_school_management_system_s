import { Router } from "express";
import { UserController } from "./user.controller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { UserValidation } from "./user.validation.js";
import { Role } from "../../../generated/prisma/index.js";

const router = Router();

router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserController.getAllUsers,
);

router.get(
    "/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    UserController.getSingleUser,
)

router.patch(
  "/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.PARENT),
  validateRequest(UserValidation.updateUserSchema),
  UserController.updateUser
);

router.delete(
  "/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
  UserController.deleteUser
);

export const UserRoutes = router;