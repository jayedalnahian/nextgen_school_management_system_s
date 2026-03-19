import { Router } from "express";
import { AuthRoutes } from "../module/auth_management/auth.router.js";
import { UserRoutes } from "../module/user_management/user.router.js";
import { ClassRoutes } from "../module/class_management/class.router.js";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/users", UserRoutes);
router.use("/classes", ClassRoutes);



export const IndexRoutes : Router = router;