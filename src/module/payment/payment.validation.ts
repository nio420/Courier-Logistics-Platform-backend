import { z } from "zod";

export const createPaymentZodSchema = z.object({
  shipmentId: z.string().uuid("Invalid shipment ID"),
});

export const getPaymentByIdZodSchema = z.object({
  id: z.string().uuid(),
});
