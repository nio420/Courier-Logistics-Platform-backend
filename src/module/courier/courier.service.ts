import {
	AssignmentStatus,
	CourierAvailability,
	ShipmentStatus,
} from "../../../prisma/generated/prisma";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import httpStatus from "http-status";

const updateCourierAvailability = async (
	userId: string,
	availabilityStatus: CourierAvailability,
) => {
	const courier = await prisma.courier.findUnique({
		where: {
			userId,
		},
	});

	if (!courier) {
		throw new AppError(httpStatus.NOT_FOUND, "Courier profile not found");
	}

	if (courier.availabilityStatus === CourierAvailability.SUSPENDED) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Suspended courier cannot update availability",
		);
	}

	const updatedCourier = await prisma.courier.update({
		where: {
			userId,
		},
		data: {
			availabilityStatus,
		},
	});

	return updatedCourier;
};

const getCourierDashboard = async (userId: string) => {
	const courier = await prisma.courier.findUnique({
		where: {
			userId,
		},
		select: {
			employeeId: true,
			availabilityStatus: true,
			totalDeliveries: true,
			totalEarnings: true,
			rating: true,
		},
	});

	if (!courier) {
		throw new AppError(httpStatus.NOT_FOUND, "Courier profile not found");
	}

	const assignmentStats = await prisma.courierAssignment.groupBy({
		by: ["status"],
		where: {
			courierId: userId,
		},
		_count: {
			id: true,
		},
	});

	const pendingAssignments =
		assignmentStats.find((item) => item.status === AssignmentStatus.PENDING)
			?._count.id || 0;

	const acceptedAssignments =
		assignmentStats.find((item) => item.status === AssignmentStatus.ACCEPTED)
			?._count.id || 0;

	const completedAssignments =
		assignmentStats.find((item) => item.status === AssignmentStatus.COMPLETED)
			?._count.id || 0;

	return {
		employeeId: courier.employeeId,
		availabilityStatus: courier.availabilityStatus,
		totalDeliveries: courier.totalDeliveries,
		totalEarnings: courier.totalEarnings,
		rating: courier.rating,
		pendingAssignments,
		acceptedAssignments,
		completedAssignments,
	};
};

const acceptAssignment = async (assignmentId: string, userId: string) => {
	const assignment = await prisma.courierAssignment.findUnique({
		where: {
			id: assignmentId,
		},
		select: {
			id: true,
			courierId: true,
			status: true,
			shipmentId: true,
		},
	});

	if (!assignment) {
		throw new AppError(httpStatus.NOT_FOUND, "Assignment not found");
	}

	if (assignment.courierId !== userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You are not allowed to accept this assignment",
		);
	}

	if (assignment.status !== AssignmentStatus.PENDING) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"This assignment cannot be accepted",
		);
	}

	const result = await prisma.$transaction(async (tx) => {
		const updatedAssignment = await tx.courierAssignment.update({
			where: {
				id: assignmentId,
			},
			data: {
				status: AssignmentStatus.ACCEPTED,
				acceptedAt: new Date(),
			},
		});

		await tx.shipment.update({
			where: {
				id: assignment.shipmentId,
			},
			data: {
				status: ShipmentStatus.COURIER_ASSIGNED,
			},
		});

		await tx.shipmentTracking.create({
			data: {
				shipmentId: assignment.shipmentId,
				status: ShipmentStatus.COURIER_ASSIGNED,
				courierId: userId,
				updatedBy: userId,
				note: "Courier accepted the assignment",
			},
		});

		return updatedAssignment;
	});

	return result;
};

const rejectAssignment = async (
	assignmentId: string,
	userId: string,
	reason?: string,
) => {
	const assignment = await prisma.courierAssignment.findUnique({
		where: {
			id: assignmentId,
		},
		select: {
			id: true,
			courierId: true,
			status: true,
			shipmentId: true,
		},
	});

	if (!assignment) {
		throw new AppError(httpStatus.NOT_FOUND, "Assignment not found");
	}

	if (assignment.courierId !== userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You are not allowed to reject this assignment",
		);
	}

	if (assignment.status !== AssignmentStatus.PENDING) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"This assignment cannot be rejected",
		);
	}

	const result = await prisma.$transaction(async (tx) => {
		const updatedAssignment = await tx.courierAssignment.update({
			where: {
				id: assignmentId,
			},
			data: {
				status: AssignmentStatus.REJECTED,
				rejectedAt: new Date(),
				rejectionReason: reason,
			},
		});

		await tx.shipment.update({
			where: {
				id: assignment.shipmentId,
			},
			data: {
				courierId: null,
				status: ShipmentStatus.PICKUP_SCHEDULED,
			},
		});

		await tx.courier.update({
			where: {
				userId,
			},
			data: {
				availabilityStatus: CourierAvailability.AVAILABLE,
			},
		});

		await tx.shipmentTracking.create({
			data: {
				shipmentId: assignment.shipmentId,
				status: ShipmentStatus.PICKUP_SCHEDULED,
				updatedBy: userId,
				note: reason || "Courier rejected the assignment",
			},
		});

		return updatedAssignment;
	});

	return result;
};

const completeAssignment = async (assignmentId: string, userId: string) => {
	const assignment = await prisma.courierAssignment.findUnique({
		where: {
			id: assignmentId,
		},
		select: {
			id: true,
			courierId: true,
			shipmentId: true,
			status: true,
			shipment: {
				select: {
					deliveryFee: true,
				},
			},
		},
	});

	if (!assignment) {
		throw new AppError(httpStatus.NOT_FOUND, "Assignment not found");
	}

	if (assignment.courierId !== userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You are not allowed to complete this assignment",
		);
	}

	if (assignment.status !== AssignmentStatus.ACCEPTED) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Only accepted assignments can be completed",
		);
	}

	const deliveredAt = new Date();

	const result = await prisma.$transaction(async (tx) => {
		const updatedAssignment = await tx.courierAssignment.update({
			where: {
				id: assignmentId,
			},
			data: {
				status: AssignmentStatus.COMPLETED,
				completedAt: deliveredAt,
			},
		});

		await tx.shipment.update({
			where: {
				id: assignment.shipmentId,
			},
			data: {
				status: ShipmentStatus.DELIVERED,
				deliveredAt,
				proofOfDelivery: {
					assignmentId: assignment.id,
					courierId: userId,
					deliveredAt: deliveredAt.toISOString(),
					status: ShipmentStatus.DELIVERED,
				},
			},
		});

		await tx.courier.update({
			where: {
				userId,
			},
			data: {
				availabilityStatus: CourierAvailability.AVAILABLE,
				totalDeliveries: {
					increment: 1,
				},
				totalEarnings: {
					increment: assignment.shipment.deliveryFee,
				},
			},
		});

		await tx.shipmentTracking.create({
			data: {
				shipmentId: assignment.shipmentId,
				status: ShipmentStatus.DELIVERED,
				courierId: userId,
				updatedBy: userId,
				note: "Shipment delivered successfully",
			},
		});

		return updatedAssignment;
	});

	return result;
};

export const CourierService = {
	getCourierDashboard,
	updateCourierAvailability,
	acceptAssignment,
	rejectAssignment,
	completeAssignment,
};
