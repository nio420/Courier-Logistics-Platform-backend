import { z } from "zod";

const createHubZodSchema = z.object({
	name: z
		.string("Hub name must be a string")
		.min(2, "Hub name must be at least 2 characters")
		.max(100, "Hub name must be at most 100 characters"),

	code: z
		.string("Hub code must be a string")
		.min(2, "Hub code must be at least 2 characters")
		.max(20, "Hub code must be at most 20 characters"),

	address: z
		.string("Address must be a string")
		.min(5, "Address must be at least 5 characters")
		.max(255, "Address must be at most 255 characters"),

	city: z
		.string("City must be a string")
		.min(2, "City must be at least 2 characters")
		.max(100, "City must be at most 100 characters"),

	district: z
		.string("District must be a string")
		.min(2, "District must be at least 2 characters")
		.max(100, "District must be at most 100 characters"),

	latitude: z.number().min(-90).max(90).optional(),

	longitude: z.number().min(-180).max(180).optional(),

	status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

const updateHubZodSchema = z.object({
	name: z
		.string("Hub name must be a string")
		.min(2, "Hub name must be at least 2 characters")
		.max(100, "Hub name must be at most 100 characters")
		.optional(),

	address: z
		.string("Address must be a string")
		.min(5, "Address must be at least 5 characters")
		.max(255, "Address must be at most 255 characters")
		.optional(),

	city: z
		.string("City must be a string")
		.min(2, "City must be at least 2 characters")
		.max(100, "City must be at most 100 characters")
		.optional(),

	district: z
		.string("District must be a string")
		.min(2, "District must be at least 2 characters")
		.max(100, "District must be at most 100 characters")
		.optional(),

	latitude: z.number().min(-90).max(90).optional(),

	longitude: z.number().min(-180).max(180).optional(),

	status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const hubValidation = {
	createHubZodSchema,
	updateHubZodSchema,
};
