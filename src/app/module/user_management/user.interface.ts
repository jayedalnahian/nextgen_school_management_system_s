import { z } from "zod";
import { UserValidation } from "./user.validation.js";

export type IUserQueryParams = z.infer<typeof UserValidation.getAllUsersQuerySchema> & Record<string, string | undefined>;
