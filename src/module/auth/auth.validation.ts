import { z } from "zod";

export const registerZodSchema = z
	.object({
		name: z
			.string("Name must be a string")
			.min(2, "Name must be at least 2 characters")
			.max(100, "Name must be at most 100 characters"),

		email: z.email("Please provide a valid email address"),

		password: z
			.string()
			.min(8, "Password must be at least 8 characters")
			.max(100, "Password must be at most 100 characters")
			.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
			.regex(/[a-z]/, "Password must contain at least one lowercase letter")
			.regex(/[0-9]/, "Password must contain at least one number")
			.regex(
				/[^A-Za-z0-9]/,
				"Password must contain at least one special character",
			),

		role: z.enum(["CUSTOMER", "COURIER"]).optional(),

		vehicleType: z
			.string("Vehicle type must be a string")
			.min(2, "Vehicle type must be at least 2 characters")
			.max(50, "Vehicle type must be at most 50 characters")
			.optional(),

		vehicleNumber: z
			.string("Vehicle number must be a string")
			.min(2, "Vehicle number must be at least 2 characters")
			.max(50, "Vehicle number must be at most 50 characters")
			.optional(),

		licenseNumber: z
			.string("License number must be a string")
			.min(2, "License number must be at least 2 characters")
			.max(50, "License number must be at most 50 characters")
			.optional(),
	})
	.superRefine((data, ctx) => {
		if (data.role === "COURIER") {
			if (!data.vehicleType) {
				ctx.addIssue({
					code: "custom",
					path: ["vehicleType"],
					message: "Vehicle type is required for courier registration",
				});
			}

			if (!data.vehicleNumber) {
				ctx.addIssue({
					code: "custom",
					path: ["vehicleNumber"],
					message: "Vehicle number is required for courier registration",
				});
			}

			if (!data.licenseNumber) {
				ctx.addIssue({
					code: "custom",
					path: ["licenseNumber"],
					message: "License number is required for courier registration",
				});
			}
		}

		if (data.role === "CUSTOMER") {
			if (data.vehicleType || data.vehicleNumber || data.licenseNumber) {
				ctx.addIssue({
					code: "custom",
					path: ["role"],
					message:
						"Vehicle information is only allowed for courier registration",
				});
			}
		}
	});

const userEmailVerifyZodSchema = z.object({
	email: z.email("No email!!!"),
	otp: z.string().length(6),
});

const loginUserZodSchema = z.object({
	email: z.email(),
	password: z
		.string()
		.min(5, "Password must be at least 5 characters")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[a-z]/, "Password must contain at least one lowercase letter")
		.regex(/[0-9]/, "Password must contain at least one number")
		.regex(
			/[^A-Za-z0-9]/,
			"Password must contain at least one special character",
		),
});

const forgetPasswordZodSchema = z.object({
	email: z.email(),
});

const resetPasswordZodSchema = z.object({
	email: z.email(),
	newPassword: z
		.string()
		.min(5, "Password must be at least 5 characters")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[a-z]/, "Password must contain at least one lowercase letter")
		.regex(/[0-9]/, "Password must contain at least one number")
		.regex(
			/[^A-Za-z0-9]/,
			"Password must contain at least one special character",
		),
	otp: z.string().length(6),
});

export const userValidation = {
	registerZodSchema,
	userEmailVerifyZodSchema,
	loginUserZodSchema,
	forgetPasswordZodSchema,
	resetPasswordZodSchema,
};
