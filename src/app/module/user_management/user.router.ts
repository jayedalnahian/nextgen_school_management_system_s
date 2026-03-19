import { Router } from "express";
import { UserController } from "./user.controller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import prismaPkg from "../../../generated/prisma/index.js";
// import { UserValidation } from "./user.validation.js";
// import { validateRequest } from "../../middleware/validateRequest.js";
const { Role } = prismaPkg;

const router = Router();

router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
//   validateRequest(UserValidation.getAllUsersQuerySchema),
  UserController.getAllUsers,
);

router.get(
    "/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    UserController.getSingleUser,
)

export const UserRoutes = router;