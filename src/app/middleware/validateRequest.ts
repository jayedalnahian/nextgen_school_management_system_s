import { NextFunction, Request, Response } from "express";
import z from "zod";

export const validateRequest = (zodSchema: z.Schema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.body.data) {
            try {
                req.body = JSON.parse(req.body.data);
            } catch (error) {
                return next(new z.ZodError([{ path: ["body", "data"], message: "Invalid JSON in data field", code: "custom" }]));
            }
        }

        const parsedResult = zodSchema.safeParse(req.body);

        if (!parsedResult.success) {
            return next(parsedResult.error);
        }

        // sanitizing the data
        req.body = parsedResult.data;

        next();
    }
}
