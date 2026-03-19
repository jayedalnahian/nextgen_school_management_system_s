import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import status from "http-status";
import { UserService } from "./user.service.js";
import { IUserQueryParams } from "./user.interface.js";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAllUsersFromDB(req.query as unknown as IUserQueryParams);

  if (result.data.length === 0) {
    return sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "No users found matching the criteria.",
      meta: result.meta,
      data: result.data,
    });
  }

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Users fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});


const getSingleUser = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string
    const result = await UserService.getSingleUser(id)
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User fetched successfully",
        data: result
    })
})

export const UserController = {
  getAllUsers,
  getSingleUser
};
