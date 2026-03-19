import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import status from "http-status";
import { ClassService } from "./class.service.js";
import { IClassQueryParams } from "./class.interface.js";

const createClass = catchAsync(async (req: Request, res: Response) => {
  const result = await ClassService.createClassInDB(req.body);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Class created successfully",
    data: result,
  });
});

const getAllClasses = catchAsync(async (req: Request, res: Response) => {
  const result = await ClassService.getAllClassesFromDB(req.query as unknown as IClassQueryParams);

  if (result.data.length === 0) {
    return sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "No classes found matching the criteria.",
      meta: result.meta,
      data: result.data,
    });
  }

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Classes fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

export const ClassController = {
  createClass,
  getAllClasses,
};
