import crypto from "crypto";
import type {
	ICreateShipmentPayload,
	IShipmentQuery,
	IUpdateShipmentStatusPayload,
} from "./shipment.interface";
import AppError from "../../utils/AppError";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import {
	AssignmentStatus,
	CourierApprovalStatus,
	CourierAvailability,
	PaymentStatus,
	Prisma,
	Role,
	ShipmentStatus,
} from "../../../prisma/generated/prisma";
import {
	calculateDeliveryFee,
	calculateDistance,
	generateTrackingNumber,
} from "../../utils/shipment.utility";
import type { IQuery } from "../../interface";
import type { IRequestUser } from "../auth/auth.interface";

const createShipment = async (
	customerId: string,
	payload: ICreateShipmentPayload,
) => {
	const {
		originHubId,
		destinationHubId,
		serviceType,
		weight,
		senderAddress,
		receiverAddress,
		items,
		pickupDate,
		estimatedDeliveryDate,
		packageType,
	} = payload;

	if (originHubId === destinationHubId) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Origin and destination hubs cannot be the same",
		);
	}

	return await prisma.$transaction(async (tx) => {
		// 1. Fetch active hubs concurrently using an ID map
		const hubsList = await tx.hub.findMany({
			where: { id: { in: [originHubId, destinationHubId] }, status: "ACTIVE" },
			select: { id: true, latitude: true, longitude: true },
		});

		const hubMap = new Map(hubsList.map((hub) => [hub.id, hub]));
		const originHub = hubMap.get(originHubId);
		const destinationHub = hubMap.get(destinationHubId);

		if (!originHub || !destinationHub) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Origin or destination hub is invalid or inactive",
			);
		}

		if (
			originHub.latitude === null ||
			originHub.longitude === null ||
			destinationHub.latitude === null ||
			destinationHub.longitude === null
		) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Hub coordinates are required",
			);
		}

		// 2. Compute metrics
		const distance = calculateDistance(
			Number(senderAddress.latitude),
			Number(senderAddress.longitude),
			Number(receiverAddress.latitude),
			Number(receiverAddress.longitude),
		);
		const calculatedFee = calculateDeliveryFee(weight, serviceType, distance);
		const trackingNumber = generateTrackingNumber();

		// 3. Clean and isolate Address layouts
		const { isDefault: senderDefault, ...cleanSenderAddress } = senderAddress;
		const { isDefault: receiverDefault, ...cleanReceiverAddress } =
			receiverAddress;

		// 4. Create addresses FIRST to get their IDs
		const createdSenderAddress = await tx.address.create({
			data: {
				userId: customerId,
				label: cleanSenderAddress.label,
				contactName: cleanSenderAddress.contactName,
				phone: cleanSenderAddress.phone,
				addressLine: cleanSenderAddress.addressLine,
				city: cleanSenderAddress.city,
				district: cleanSenderAddress.district,
				postalCode: cleanSenderAddress.postalCode,
				latitude: cleanSenderAddress.latitude ?? null,
				longitude: cleanSenderAddress.longitude ?? null,
				isDefault: senderDefault ?? false,
			},
		});

		const createdReceiverAddress = await tx.address.create({
			data: {
				userId: customerId,
				label: cleanReceiverAddress.label,
				contactName: cleanReceiverAddress.contactName,
				phone: cleanReceiverAddress.phone,
				addressLine: cleanReceiverAddress.addressLine,
				city: cleanReceiverAddress.city,
				district: cleanReceiverAddress.district,
				postalCode: cleanReceiverAddress.postalCode,
				latitude: cleanReceiverAddress.latitude ?? null,
				longitude: cleanReceiverAddress.longitude ?? null,
				isDefault: receiverDefault ?? false,
			},
		});

		// 5. Create shipment matching exact Prisma schema field layouts
		const shipment = await tx.shipment.create({
			data: {
				trackingNumber,
				customerId,
				originHubId,
				destinationHubId,
				currentHubId: originHubId,
				serviceType,
				packageType,
				// Wrap your raw numbers inside Prisma's Decimal type mapping
				weight: new Prisma.Decimal(weight),
				deliveryFee: new Prisma.Decimal(calculatedFee),
				paymentStatus: "PENDING",
				status: "PAYMENT_PENDING" as any, // Cast if your database enum requires standard status casing
				pickupDate: pickupDate ? new Date(pickupDate) : null,
				estimatedDeliveryDate: estimatedDeliveryDate
					? new Date(estimatedDeliveryDate)
					: null,

				// Exact schema mapped scalar relational string properties
				senderAddressId: createdSenderAddress.id,
				receiverAddressId: createdReceiverAddress.id,

				items: {
					create: items.map((item) => ({
						name: item.name,
						description: item.description || null,
						quantity: item.quantity,
						weight: new Prisma.Decimal(item.weight),
						declaredValue: new Prisma.Decimal(item.declaredValue),
					})),
				},
				// CRITICAL FIX: Changed 'shipmentTracking' to 'tracking' to match model configuration
				tracking: {
					create: {
						status: "PAYMENT_PENDING" as any,
						hubId: originHubId,
						updatedBy: customerId,
						location: {
							latitude: Number(originHub.latitude),
							longitude: Number(originHub.longitude),
						} as Prisma.InputJsonValue,
						note: "Shipment created and waiting for payment",
					},
				},
			},
			include: {
				items: true,
				originHub: true,
				destinationHub: true,
				tracking: true,
			},
		});

		const Totaldistance = Number(distance.toFixed(2));

		return {
			shipment: {
				...shipment,
				senderAddress: createdSenderAddress,
				receiverAddress: createdReceiverAddress,
			},
			distance: Totaldistance,
			deliveryFee: calculatedFee,
		};
	});
};

const getAllShipments = async (query: IShipmentQuery) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: any[] = [];

	if (query.searchTerm) {
		andConditions.push({
			trackingNumber: {
				contains: query.searchTerm,
				mode: "insensitive",
			},
		});
	}

	if (query.status) {
		andConditions.push({
			status: query.status,
		});
	}

	if (query.serviceType) {
		andConditions.push({
			serviceType: query.serviceType,
		});
	}

	if (query.packageType) {
		andConditions.push({
			packageType: query.packageType,
		});
	}

	const where = {
		AND: andConditions,
	};

	const [shipments, total] = await Promise.all([
		prisma.shipment.findMany({
			where,
			skip,
			take: limit,
			orderBy: {
				[sortBy]: sortOrder,
			},
			include: {
				senderAddress: true,
				receiverAddress: true,
				originHub: true,
				destinationHub: true,
			},
		}),

		prisma.shipment.count({
			where,
		}),
	]);

	return {
		shipments,
		meta: {
			page,
			limit,
			total,
			totalPage: Math.ceil(total / limit),
		},
	};
};

const getMyShipments = async (customerId: string, query: IQuery) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: any[] = [
		{
			customerId,
		},
	];

	if (query.searchTerm) {
		andConditions.push({
			trackingNumber: {
				contains: query.searchTerm,
				mode: "insensitive",
			},
		});
	}

	if (query.status) {
		andConditions.push({
			status: query.status,
		});
	}

	const where = {
		AND: andConditions,
	};

	const [shipments, total] = await Promise.all([
		prisma.shipment.findMany({
			where,
			skip,
			take: limit,
			orderBy: {
				[sortBy]: sortOrder,
			},
			include: {
				senderAddress: true,
				receiverAddress: true,
				originHub: true,
				destinationHub: true,
			},
		}),

		prisma.shipment.count({
			where,
		}),
	]);

	return {
		shipments,
		meta: {
			page,
			limit,
			total,
			totalPage: Math.ceil(total / limit),
		},
	};
};

const getShipmentById = async (shipmentId: string, user: IRequestUser) => {
	const where =
		user.role === Role.ADMIN
			? {
					id: shipmentId,
				}
			: user.role === Role.CUSTOMER
				? {
						id: shipmentId,
						customerId: user.userId,
					}
				: {
						id: shipmentId,
						courierId: user.userId,
					};

	const shipment = await prisma.shipment.findFirst({
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

const cancelShipment = async (shipmentId: string, user: IRequestUser) => {
	const shipment = await prisma.shipment.findUnique({
		where: {
			id: shipmentId,
			customerId: user.userId,
		},
		select: {
			id: true,
			status: true,
			paymentStatus: true,
		},
	});

	if (!shipment) {
		throw new AppError(httpStatus.NOT_FOUND, "Shipment not found");
	}

	const cancellableStatuses = [
		"CREATED",
		"PAYMENT_PENDING",
		"CONFIRMED",
		"PICKUP_SCHEDULED",
	];

	if (!cancellableStatuses.includes(shipment.status)) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Shipment cannot be cancelled at this stage",
		);
	}

	const updatedShipment = await prisma.shipment.update({
		where: {
			id: shipmentId,
		},
		data: {
			status: "CANCELLED",
		},
	});

	return updatedShipment;
};

const updateShipmentStatus = async (
	shipmentId: string,
	user: IRequestUser,
	payload: IUpdateShipmentStatusPayload,
) => {
	const shipment = await prisma.shipment.findUnique({
		where: {
			id: shipmentId,
		},
		select: {
			id: true,
			status: true,
			customerId: true,
			courierId: true,
			currentHubId: true,
		},
	});

	if (!shipment) {
		throw new AppError(httpStatus.NOT_FOUND, "Shipment not found");
	}

	if (user.role === Role.CUSTOMER && shipment.customerId !== user.userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You are not allowed to update this shipment",
		);
	}

	if (user.role === Role.COURIER && shipment.courierId !== user.userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You are not allowed to update this shipment",
		);
	}

	if (shipment.status === ShipmentStatus.DELIVERED) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Delivered shipment cannot be updated",
		);
	}

	if (shipment.status === ShipmentStatus.CANCELLED) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Cancelled shipment cannot be updated",
		);
	}

	const updatedShipment = await prisma.$transaction(async (tx) => {
		const shipmentData = await tx.shipment.update({
			where: {
				id: shipmentId,
			},
			data: {
				status: payload.status,
				deliveredAt:
					payload.status === ShipmentStatus.DELIVERED ? new Date() : undefined,
			},
		});

		await tx.shipmentTracking.create({
			data: {
				shipmentId,
				status: payload.status,
				hubId: shipment.currentHubId,
				updatedBy: user.userId,
				note: payload.note,
			},
		});

		return shipmentData;
	});

	return updatedShipment;
};

const assignCourier = async (
	shipmentId: string,
	courierId: string,
	user: IRequestUser,
) => {
	const shipment = await prisma.shipment.findUnique({
		where: {
			id: shipmentId,
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

	if (shipment.courierId) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Courier is already assigned to this shipment",
		);
	}

	const courier = await prisma.user.findUnique({
		where: {
			id: courierId,
		},
		select: {
			id: true,
			role: true,
			status: true,
			courierApprovalStatus: true,
			courier: {
				select: {
					availabilityStatus: true,
				},
			},
		},
	});

	if (!courier || courier.role !== Role.COURIER) {
		throw new AppError(httpStatus.NOT_FOUND, "Courier not found");
	}

	if (courier.status !== "ACTIVE") {
		throw new AppError(httpStatus.BAD_REQUEST, "Courier account is not active");
	}

	if (
		courier.courierApprovalStatus !== CourierApprovalStatus.APPROVED ||
		!courier.courier
	) {
		throw new AppError(httpStatus.BAD_REQUEST, "Courier is not approved yet");
	}

	if (courier.courier.availabilityStatus !== CourierAvailability.AVAILABLE) {
		throw new AppError(httpStatus.BAD_REQUEST, "Courier is not available");
	}

	if (
		shipment.status !== ShipmentStatus.CONFIRMED &&
		shipment.status !== ShipmentStatus.PICKUP_SCHEDULED
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Shipment is not ready for courier assignment",
		);
	}

	const result = await prisma.$transaction(async (tx) => {
		const updatedShipment = await tx.shipment.update({
			where: {
				id: shipmentId,
			},
			data: {
				courierId,
				status: ShipmentStatus.COURIER_ASSIGNED,
			},
		});

		const newAssignment = await tx.courierAssignment.create({
			data: {
				shipmentId,
				courierId,
				assignedBy: user.userId,
				status: AssignmentStatus.PENDING,
			},
		});

		await tx.courier.update({
			where: {
				userId: courierId,
			},
			data: {
				availabilityStatus: CourierAvailability.BUSY,
			},
		});

		await tx.shipmentTracking.create({
			data: {
				shipmentId,
				status: ShipmentStatus.COURIER_ASSIGNED,
				courierId,
				updatedBy: user.userId,
				note: "Courier assigned to shipment",
			},
		});

		return {
			...updatedShipment,
			courierAssignmentId: newAssignment.id,
		};
	});

	return result;
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

export const ShipmentService = {
	createShipment,
	getAllShipments,
	getMyShipments,
	getShipmentById,
	getShipmentByTrackingNumber,
	cancelShipment,
	updateShipmentStatus,
	assignCourier,
	getShipmentTrackingHistory,
};
