import { z } from "zod";

const addressSchema = z.object({
	label: z
		.string("Label must be a string")
		.min(2, "Label must be at least 2 characters")
		.max(50, "Label must be at most 50 characters"),

	contactName: z
		.string("Contact name must be a string")
		.min(2, "Contact name must be at least 2 characters")
		.max(100, "Contact name must be at most 100 characters"),

	phone: z
		.string("Phone must be a string")
		.min(10, "Phone number must be at least 10 characters")
		.max(20, "Phone number must be at most 20 characters"),

	addressLine: z
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

	postalCode: z
		.string("Postal code must be a string")
		.min(3, "Postal code must be at least 3 characters")
		.max(20, "Postal code must be at most 20 characters"),

	latitude: z.number().min(-90).max(90).optional(),

	longitude: z.number().min(-180).max(180).optional(),

	isDefault: z.boolean().optional(),
});

// ─────────────────────────────────────────────

const shipmentItemSchema = z.object({
	name: z
		.string("Item name must be a string")
		.min(2, "Item name must be at least 2 characters")
		.max(100, "Item name must be at most 100 characters"),

	description: z
		.string("Description must be a string")
		.max(255, "Description must be at most 255 characters")
		.optional(),

	quantity: z
		.number("Quantity must be a number")
		.int("Quantity must be an integer")
		.positive("Quantity must be greater than 0"),

	weight: z
		.number("Weight must be a number")
		.positive("Weight must be greater than 0"),

	declaredValue: z
		.number("Declared value must be a number")
		.nonnegative("Declared value cannot be negative"),
});

// ─────────────────────────────────────────────

export const createShipmentZodSchema = z.object({
	senderAddress: addressSchema,
	receiverAddress: addressSchema,

	originHubId: z
		.string("Origin hub ID must be a string")
		.uuid("Invalid origin hub ID"),

	destinationHubId: z
		.string("Destination hub ID must be a string")
		.uuid("Invalid destination hub ID"),

	serviceType: z.enum(["STANDARD", "EXPRESS"], "Invalid service type"),

	packageType: z.enum(
		["DOCUMENT", "PARCEL", "FRAGILE", "ELECTRONICS", "OTHER"],
		"Invalid package type",
	),

	weight: z
		.number("Weight must be a number")
		.positive("Weight must be greater than 0"),

	items: z
		.array(shipmentItemSchema)
		.min(1, "At least one shipment item is required"),

	pickupDate: z.coerce.date().optional(),

	estimatedDeliveryDate: z.coerce.date().optional(),
});

export const getAllShipmentsZodSchema = z.object({
	searchTerm: z.string().optional(),

	page: z.coerce.number().int().positive().optional(),

	limit: z.coerce.number().int().positive().max(100).optional(),

	sortBy: z.string().optional(),

	sortOrder: z.enum(["asc", "desc"]).optional(),

	status: z
		.enum([
			"CREATED",
			"PAYMENT_PENDING",
			"CONFIRMED",
			"PICKUP_SCHEDULED",
			"COURIER_ASSIGNED",
			"PICKED_UP",
			"AT_ORIGIN_HUB",
			"IN_TRANSIT",
			"AT_DESTINATION_HUB",
			"OUT_FOR_DELIVERY",
			"DELIVERY_FAILED",
			"RETURN_TO_SENDER",
			"RETURNED",
			"DELIVERED",
			"CANCELLED",
		])
		.optional(),

	serviceType: z.enum(["STANDARD", "EXPRESS"]).optional(),

	packageType: z
		.enum(["DOCUMENT", "PARCEL", "FRAGILE", "ELECTRONICS", "OTHER"])
		.optional(),
});

export const getMyShipmentsZodSchema = z.object({
	searchTerm: z.string().optional(),

	page: z.coerce.number().int().positive().optional(),

	limit: z.coerce.number().int().positive().max(100).optional(),

	sortBy: z.string().optional(),

	sortOrder: z.enum(["asc", "desc"]).optional(),

	status: z
		.enum([
			"CREATED",
			"PAYMENT_PENDING",
			"CONFIRMED",
			"PICKUP_SCHEDULED",
			"COURIER_ASSIGNED",
			"PICKED_UP",
			"AT_ORIGIN_HUB",
			"IN_TRANSIT",
			"AT_DESTINATION_HUB",
			"OUT_FOR_DELIVERY",
			"DELIVERY_FAILED",
			"RETURN_TO_SENDER",
			"RETURNED",
			"DELIVERED",
			"CANCELLED",
		])
		.optional(),
});

export const updateShipmentStatusZodSchema = z.object({
	status: z.enum([
		"CREATED",
		"PAYMENT_PENDING",
		"CONFIRMED",
		"PICKUP_SCHEDULED",
		"COURIER_ASSIGNED",
		"PICKED_UP",
		"AT_ORIGIN_HUB",
		"IN_TRANSIT",
		"AT_DESTINATION_HUB",
		"OUT_FOR_DELIVERY",
		"DELIVERY_FAILED",
		"RETURN_TO_SENDER",
		"RETURNED",
		"DELIVERED",
		"CANCELLED",
	]),
	note: z.string().max(255).optional(),
});

export const assignCourierZodSchema = z.object({
	courierId: z.string().uuid("Invalid courier ID"),
});
