import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.router.js";

const router = Router();

router.use("/auth", AuthRoutes);



export const IndexRoutes : Router = router;