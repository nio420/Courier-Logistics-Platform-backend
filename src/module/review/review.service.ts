import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import type { ICreateReviewPayload } from "./review.interface";
import { ShipmentStatus, Role } from "../../../prisma/generated/prisma";
import AppError from "../../utils/AppError";

// ─────────────────────────────────────────────

const createReview = async (
	customerId: string,
	payload: ICreateReviewPayload,
) => {
	const { shipmentId, rating, comment } = payload;

	const shipment = await prisma.shipment.findFirst({
		where: {
			id: shipmentId,
			customerId,
		},
		select: {
			id: true,
			status: true,
			courierId: true,
		},
	});

	if (!shipment) {
		throw new AppError(httpStatus.NOT_FOUND, "Shipment not found");
	}

	if (shipment.status !== ShipmentStatus.DELIVERED) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Review can only be submitted after delivery",
		);
	}

	if (!shipment.courierId) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"No courier is assigned to this shipment",
		);
	}

	const existingReview = await prisma.review.findUnique({
		where: {
			shipmentId,
		},
	});

	if (existingReview) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Review already exists for this shipment",
		);
	}

	const review = await prisma.review.create({
		data: {
			shipmentId,
			customerId,
			courierId: shipment.courierId,
			rating,
			comment: comment || null,
		},
	});

	const courierReviews = await prisma.review.aggregate({
		where: {
			courierId: shipment.courierId,
		},
		_avg: {
			rating: true,
		},
	});

	await prisma.courier.update({
		where: {
			userId: shipment.courierId,
		},
		data: {
			rating: courierReviews._avg.rating || 0,
		},
	});

	return review;
};

// ─────────────────────────────────────────────

const getCourierReviews = async (courierId: string) => {
	const courier = await prisma.user.findFirst({
		where: {
			id: courierId,
			role: Role.COURIER,
		},
		select: {
			id: true,
		},
	});

	if (!courier) {
		throw new AppError(httpStatus.NOT_FOUND, "Courier not found");
	}

	const reviews = await prisma.review.findMany({
		where: {
			courierId,
		},
		select: {
			id: true,
			shipmentId: true,
			customerId: true,
			courierId: true,
			rating: true,
			comment: true,
			createdAt: true,
			updatedAt: true,
			customer: {
				select: {
					id: true,
					name: true,
					profileImage: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	return reviews;
};

// ─────────────────────────────────────────────

export const ReviewService = {
	createReview,
	getCourierReviews,
};
