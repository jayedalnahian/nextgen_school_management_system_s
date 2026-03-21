import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import status from "http-status";
import { AttendanceService } from "./attendance.service.js";

const createAttendance = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const result = await AttendanceService.createAttendanceInDB(userId, req.body);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Attendance recorded successfully",
    data: result,
  });
});

export const AttendanceController = {
  createAttendance,
};
