import { z } from "zod";

export const getAllUsersZodSchema = z.object({
	searchTerm: z.string().optional(),
	page: z.coerce.number().int().positive().optional(),
	limit: z.coerce.number().int().positive().max(100).optional(),
	sortBy: z.string().optional(),
	sortOrder: z.enum(["asc", "desc"]).optional(),
	status: z.enum(["ACTIVE", "SUSPENDED", "BLOCKED"]).optional(),
	role: z.enum(["CUSTOMER", "COURIER", "ADMIN"]).optional(),
});

// ─────────────────────────────────────────────

export const updateUserStatusZodSchema = z.object({
	status: z.enum(["ACTIVE", "SUSPENDED", "BLOCKED"]),
});
