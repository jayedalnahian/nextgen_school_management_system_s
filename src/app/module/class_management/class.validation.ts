import { z } from "zod";

const createClassSchema = z.object({
  body: z.object({
    name: z.string(),
    section: z.string().optional(),
    monthlyFee: z
      .number()
      .min(0, "Monthly fee cannot be negative"),
    capacity: z
      .number()
      .int()
      .min(0, "Capacity cannot be negative")
      .optional(),
  }),
});

export const ClassValidation = {
  createClassSchema,
};
