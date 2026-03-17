import type { Router } from "express";
import { Router as ExpressRouter } from "express";

const router: Router = ExpressRouter();

const moduleRoutes = [
    {
        path: "/",
        route: ExpressRouter().get("/", (req, res) => {
            res.status(200).json({
                success: true,
                message: "Welcome to NextGen School Management System API",
            });
        }),
    },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
