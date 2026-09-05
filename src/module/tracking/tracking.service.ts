import { Role } from "../../../prisma/generated/prisma";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import type { IRequestUser } from "../auth/auth.interface";
import httpStatus from "http-status";

const getShipmentByTrackingNumber = async (
	trackingNumber: string,
	user: IRequestUser,
) => {
	const where =
		user.role === Role.ADMIN
			? {
					trackingNumber,
				}
			: user.role === Role.CUSTOMER
				? {
						trackingNumber,
						customerId: user.userId,
					}
				: {
						trackingNumber,
						courierId: user.userId,
					};

	const shipment = await prisma.shipment.findUnique({
		where,
		include: {
			items: true,
			senderAddress: true,
			receiverAddress: true,
			originHub: true,
			destinationHub: true,
			tracking: {
				orderBy: {
					createdAt: "desc",
				},
			},
		},
	});

	if (!shipment) {
		throw new AppError(httpStatus.NOT_FOUND, "Shipment not found");
	}

	return shipment;
};

const getShipmentTrackingHistory = async (
	shipmentId: string,
	user: IRequestUser,
) => {
	const shipment = await prisma.shipment.findUnique({
		where: {
			id: shipmentId,
		},
		select: {
			id: true,
			customerId: true,
			courierId: true,
		},
	});

	if (!shipment) {
		throw new AppError(httpStatus.NOT_FOUND, "Shipment not found");
	}

	if (user.role === Role.CUSTOMER && shipment.customerId !== user.userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You are not allowed to view this shipment tracking",
		);
	}

	if (user.role === Role.COURIER && shipment.courierId !== user.userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You are not allowed to view this shipment tracking",
		);
	}

	const tracking = await prisma.shipmentTracking.findMany({
		where: {
			shipmentId,
		},
		include: {
			hub: true,
			courier: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
			updater: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
		orderBy: {
			createdAt: "asc",
		},
	});

	return tracking;
};

export const TrackingService = {
	getShipmentByTrackingNumber,
	getShipmentTrackingHistory,
};
