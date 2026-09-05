import { z } from "zod";

export const rejectCourierZodSchema = z.object({
	reason: z
		.string("Rejection reason must be a string")
		.min(3, "Rejection reason must be at least 3 characters")
		.max(255, "Rejection reason must be at most 255 characters")
		.optional(),
});

export const getAllCouriersZodSchema = z.object({
	searchTerm: z.string().optional(),

	page: z.coerce.number().int().positive().optional(),

	limit: z.coerce.number().int().positive().max(100).optional(),

	sortBy: z.string().optional(),

	sortOrder: z.enum(["asc", "desc"]).optional(),

	approvalStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),

	availabilityStatus: z
		.enum(["AVAILABLE", "BUSY", "OFFLINE", "SUSPENDED"])
		.optional(),
});
