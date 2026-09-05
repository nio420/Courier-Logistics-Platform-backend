import type { UploadApiResponse } from "cloudinary";
import { cloudinaryClient } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import type { IUpdateMyProfilePayload } from "./user.interface";
import { Role, ShipmentStatus } from "../../../prisma/generated/prisma";
import httpStatus from "http-status";

const updateProfileImg = async (buffer: Buffer, userId: string) => {
	const currentUser = await prisma.user.findUnique({
		where: {
			id: userId,
		},
		select: {
			profileImage: true,
			imagePublicId: true,
		},
	});

	// Upload new image
	const cloudinaryResult = await new Promise<UploadApiResponse>(
		(resolve, reject) => {
			cloudinaryClient.uploader
				.upload_stream(
					{
						resource_type: "auto",
					},
					async (error, result) => {
						if (error) {
							console.log(error);
							return reject(error);
						}
						if (!result) {
							return reject("No result");
						}
						resolve(result);
					},
				)
				.end(buffer);
		},
	);

	// Update user
	const updateUser = await prisma.user.update({
		where: {
			id: userId,
		},
		data: {
			profileImage: cloudinaryResult.secure_url,
			imagePublicId: cloudinaryResult.public_id,
		},
		omit: {
			password: true,
		},
	});

	// Delete old image
	if (currentUser?.imagePublicId && currentUser.profileImage) {
		await cloudinaryClient.uploader.destroy(currentUser.imagePublicId);
	}

	return updateUser;
};

const getMyDashboard = async (customerId: string) => {
	const customer = await prisma.user.findFirst({
		where: {
			id: customerId,
			role: Role.CUSTOMER,
		},
		select: {
			id: true,
		},
	});

	if (!customer) {
		throw new AppError(httpStatus.NOT_FOUND, "Customer not found");
	}

	const [
		totalShipments,
		pendingShipments,
		inTransitShipments,
		deliveredShipments,
		cancelledShipments,
		totalPayments,
		totalSpent,
		totalReviews,
		recentShipments,
		recentReviews,
	] = await Promise.all([
		prisma.shipment.count({
			where: {
				customerId,
			},
		}),

		prisma.shipment.count({
			where: {
				customerId,
				status: {
					in: [
						ShipmentStatus.CREATED,
						ShipmentStatus.PAYMENT_PENDING,
						ShipmentStatus.CONFIRMED,
						ShipmentStatus.PICKUP_SCHEDULED,
						ShipmentStatus.COURIER_ASSIGNED,
					],
				},
			},
		}),

		prisma.shipment.count({
			where: {
				customerId,
				status: {
					in: [
						ShipmentStatus.PICKED_UP,
						ShipmentStatus.AT_ORIGIN_HUB,
						ShipmentStatus.IN_TRANSIT,
						ShipmentStatus.AT_DESTINATION_HUB,
						ShipmentStatus.OUT_FOR_DELIVERY,
					],
				},
			},
		}),

		prisma.shipment.count({
			where: {
				customerId,
				status: ShipmentStatus.DELIVERED,
			},
		}),

		prisma.shipment.count({
			where: {
				customerId,
				status: ShipmentStatus.CANCELLED,
			},
		}),

		prisma.payment.count({
			where: {
				customerId,
			},
		}),

		prisma.payment.aggregate({
			where: {
				customerId,
				status: "PAID",
			},
			_sum: {
				amount: true,
			},
		}),

		prisma.review.count({
			where: {
				customerId,
			},
		}),

		prisma.shipment.findMany({
			where: {
				customerId,
			},
			select: {
				id: true,
				trackingNumber: true,
				status: true,
				serviceType: true,
				packageType: true,
				deliveryFee: true,
				createdAt: true,
			},
			orderBy: {
				createdAt: "desc",
			},
			take: 5,
		}),

		prisma.review.findMany({
			where: {
				customerId,
			},
			select: {
				id: true,
				shipmentId: true,
				rating: true,
				comment: true,
				createdAt: true,
				courier: {
					select: {
						id: true,
						name: true,
						profileImage: true,
					},
				},
				shipment: {
					select: {
						trackingNumber: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
			take: 5,
		}),
	]);

	return {
		totalShipments,
		pendingShipments,
		inTransitShipments,
		deliveredShipments,
		cancelledShipments,
		totalPayments,
		totalSpent: Number(totalSpent._sum.amount || 0),
		totalReviews,
		recentShipments,
		recentReviews,
	};
};

// ─────────────────────────────────────────────

const getMyProfile = async (userId: string) => {
	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
		select: {
			id: true,
			name: true,
			email: true,
			phone: true,
			bio: true,
			profileImage: true,
			role: true,
			authProvider: true,
			emailVerified: true,
			status: true,
			courierApprovalStatus: true,
			createdAt: true,
			updatedAt: true,

			courier: {
				select: {
					employeeId: true,
					vehicleType: true,
					vehicleNumber: true,
					licenseNumber: true,
					availabilityStatus: true,
					currentLat: true,
					currentLng: true,
					totalDeliveries: true,
					totalEarnings: true,
					rating: true,
				},
			},
		},
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	return user;
};

// ─────────────────────────────────────────────

const updateMyProfile = async (
	userId: string,
	payload: IUpdateMyProfilePayload,
) => {
	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
		select: {
			id: true,
		},
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	const updatedUser = await prisma.user.update({
		where: {
			id: userId,
		},
		data: {
			...(payload.name !== undefined && {
				name: payload.name,
			}),
			...(payload.phone !== undefined && {
				phone: payload.phone,
			}),
			...(payload.bio !== undefined && {
				bio: payload.bio,
			}),
		},
		select: {
			id: true,
			name: true,
			email: true,
			phone: true,
			bio: true,
			profileImage: true,
			role: true,
			authProvider: true,
			emailVerified: true,
			status: true,
			courierApprovalStatus: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	return updatedUser;
};

export const UserService = {
	updateProfileImg,
	getMyDashboard,
	getMyProfile,
	updateMyProfile,
};
