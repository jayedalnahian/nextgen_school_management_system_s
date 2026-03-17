import express, { type Application, type Request, type Response } from "express";
import cors from "cors";
import globalErrorHandler from "./app/middleware/globalErrorHandler.js";
import notFound from "./app/middleware/notFound.js";
import router from "./app/routes/index.js";

const app: Application = express();

// Parsers
app.use(express.json());
app.use(cors());

// Application routes
app.use("/api/v1", router);

app.get("/", (req: Request, res: Response) => {
    res.send("NextGen School Management System Server is running!");
});

// Error handlers
app.use(globalErrorHandler);
app.use(notFound);

export default app;
