import { z } from "zod";

export const createReviewZodSchema = z.object({
	shipmentId: z
		.string("Shipment ID must be a string")
		.uuid("Invalid shipment ID"),

	rating: z
		.number("Rating must be a number")
		.int("Rating must be a whole number")
		.min(1, "Rating must be at least 1")
		.max(5, "Rating cannot be more than 5"),

	comment: z
		.string("Comment must be a string")
		.max(500, "Comment cannot exceed 500 characters")
		.optional(),
});

// ─────────────────────────────────────────────
