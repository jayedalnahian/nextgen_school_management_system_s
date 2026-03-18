import express, { type Application, type Request, type Response } from "express";
import cors from "cors";

import notFound from "./app/middleware/notFound.js";
import { IndexRoutes } from "./app/routes/index.js";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler.js";

const app: Application = express();

// Parsers
app.use(express.json());
app.use(cors());

// Application routes
app.use("/api/v1", IndexRoutes);

app.get("/", (req: Request, res: Response) => {
    res.send("NextGen School Management System Server is running!");
});

// Error handlers
app.use(globalErrorHandler);
app.use(notFound);

export default app;
