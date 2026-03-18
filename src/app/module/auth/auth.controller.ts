import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service.js";

const registerUser = catchAsync(async (req: Request, res: Response) => {
    const payload = {
            ...req.body,
            image : req.file?.path
        };
    const result = await AuthService.registerUser(payload);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        message: "User registered successfully",
        data: result,
    });
});


export const AuthController = {registerUser}