import express from "express";
import { validateRequest } from "../../middleware/validateRequest.js";
import { AttendanceValidation } from "./attendance.validation.js";
import { AttendanceController } from "./attendance.controller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { Role } from "../../../generated/prisma/index.js";

const router = express.Router();

router.post(
  "/",
  checkAuth(Role.TEACHER),
  validateRequest(AttendanceValidation.createAttendanceSchema),
  AttendanceController.createAttendance,
);

router.get(
  "/report",
  checkAuth(Role.ADMIN, Role.TEACHER),
  validateRequest(AttendanceValidation.getAttendanceReportSchema),
  AttendanceController.getAttendanceReport,
);

export const AttendanceRoutes = router;
