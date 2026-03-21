import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import status from "http-status";
import { StudentService } from "./student.service.js";

const createStudent = catchAsync(async (req: Request, res: Response) => {
  const result = await StudentService.createStudentInDB(req.body);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Student admitted successfully",
    data: result,
  });
});

const getAllStudents = catchAsync(async (req: Request, res: Response) => {
  const result = await StudentService.getAllStudentsFromDB(req.query as any);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Students fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const promoteStudent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await StudentService.promoteStudentInDB(id as string, req.body);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Student promoted successfully",
    data: result,
  });
});

export const StudentController = {
  createStudent,
  getAllStudents,
  promoteStudent,
};
