import express, { type Application, type Request, type Response } from "express";
import cors from "cors";

import notFound from "./app/middleware/notFound.js";
import { IndexRoutes } from "./app/routes/index.js";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler.js";
import cookieParser from "cookie-parser";
import { envVars } from "./app/config/env.js";
import { auth } from "./app/lib/auth.js";
import { toNodeHandler } from "better-auth/node";

const app: Application = express();

app.set("view engine", "ejs");
app.set("views", "./src/views");

// Parsers

app.use(express.json());
app.use(cookieParser());
// app.post("/webhook", express.raw({ type: "application/json" }), PaymentController.handleStripeWebhookEvent)
app.use(
  cors({
    origin: [
      envVars.FRONTEND_URL,
      envVars.BETTER_AUTH_URL,
      "http://localhost:3000",
      "http://localhost:5000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Application routes
app.use("/api/auth", toNodeHandler(auth));
app.use("/api/v1", IndexRoutes);

app.get("/", (req: Request, res: Response) => {
    res.send("NextGen School Management System Server is running!");
});

// Error handlers
app.use(globalErrorHandler);
app.use(notFound);

export default app;
