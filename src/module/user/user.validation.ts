import { z } from "zod";

export const updateMyProfileZodSchema = z.object({
	name: z
		.string("Name must be a string")
		.min(2, "Name must be at least 2 characters")
		.max(100, "Name cannot exceed 100 characters")
		.optional(),

	phone: z
		.string("Phone must be a string")
		.min(10, "Phone number must be at least 10 characters")
		.max(20, "Phone number cannot exceed 20 characters")
		.optional(),

	bio: z
		.string("Bio must be a string")
		.max(500, "Bio cannot exceed 500 characters")
		.optional(),
});

// ─────────────────────────────────────────────
