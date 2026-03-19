import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import status from "http-status";
import { ClassService } from "./class.service.js";

const createClass = catchAsync(async (req: Request, res: Response) => {
  const result = await ClassService.createClassInDB(req.body);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Class created successfully",
    data: result,
  });
});

export const ClassController = {
  createClass,
};
