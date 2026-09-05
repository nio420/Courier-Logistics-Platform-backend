import { z } from "zod";

export const createPaymentZodSchema = z.object({
	shipmentId: z
		.string("Shipment ID must be a string")
		.uuid("Invalid shipment ID"),
});

export const getPaymentByIdZodSchema = z.object({
	id: z.string("Payment ID must be a string").uuid("Invalid payment ID"),
});
