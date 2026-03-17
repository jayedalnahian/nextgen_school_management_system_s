import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service.js";

const registerUser = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.registerUser(req.body);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        message: "User registered successfully",
        data: result,
    });
});


export const AuthController = {registerUser}