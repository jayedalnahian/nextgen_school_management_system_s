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

const updateClassSchema = z.object({
  body: createClassSchema.shape.body.partial(),
});

export const ClassValidation = {
  createClassSchema,
  updateClassSchema,
};
