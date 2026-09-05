import type { Request, Response } from "express";
import { ShipmentService } from "./shipment.service";
import { catchAsync } from "../../utils/CatchAsync";
import { sendResponse } from "../../utils/SendResponse";
import httpStatus from "http-status";
import type { IShipmentQuery } from "./shipment.interface";
import type { IQuery } from "../../interface";
import type { IRequestUser } from "../auth/auth.interface";

const createShipment = catchAsync(async (req: Request, res: Response) => {
	const customerId = req.user?.userId as string;
	const payload = req.body;

	const result = await ShipmentService.createShipment(customerId, payload);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Shipment created successfully",
		data: result,
	});
});

const getAllShipments = catchAsync(async (req: Request, res: Response) => {
	const query = req.query;
	const result = await ShipmentService.getAllShipments(query as IShipmentQuery);
	``;
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Shipments retrieved successfully",
		data: result,
	});
});

const getMyShipments = catchAsync(async (req: Request, res: Response) => {
	const query = req.query;
	const customerId = req.user?.userId as string;
	const result = await ShipmentService.getMyShipments(
		customerId,
		query as IQuery,
	);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "My shipments retrieved successfully",
		data: result,
	});
});

const getShipmentById = catchAsync(async (req: Request, res: Response) => {
	const shipmentId = req.params.id;
	const user = req.user as IRequestUser;
	const result = await ShipmentService.getShipmentById(
		shipmentId as string,
		user,
	);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Shipment retrieved successfully",
		data: result,
	});
});

const getShipmentByTrackingNumber = catchAsync(
	async (req: Request, res: Response) => {
		const trackingNumber = req.params.trackingNumber;
		const user = req.user as IRequestUser;
		const result = await ShipmentService.getShipmentByTrackingNumber(
			trackingNumber as string,
			user,
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Shipment retrieved successfully",
			data: result,
		});
	},
);

const cancelShipment = catchAsync(async (req: Request, res: Response) => {
	const shipmentId = req.params.id;
	const user = req.user as IRequestUser;
	const result = await ShipmentService.cancelShipment(
		shipmentId as string,
		user,
	);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Shipment cancelled successfully",
		data: result,
	});
});

const updateShipmentStatus = catchAsync(async (req: Request, res: Response) => {
	const shipmentId = req.params.id;
	const payload = req.body;
	const user = req.user as IRequestUser;
	const result = await ShipmentService.updateShipmentStatus(
		shipmentId as string,
		user,
		payload,
	);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Shipment status updated successfully",
		data: result,
	});
});

const assignCourier = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;
	const payload = req.body;
	const shipmentId = req.params.id;

	const result = await ShipmentService.assignCourier(
		shipmentId as string,
		payload.courierId,
		user,
	);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Courier assigned successfully",
		data: result,
	});
});

const getShipmentTrackingHistory = catchAsync(
	async (req: Request, res: Response) => {
		const user = req.user as IRequestUser;
		const shipmentId = req.params.id;
		const result = await ShipmentService.getShipmentTrackingHistory(
			shipmentId as string,
			user,
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Shipment tracking retrieved successfully",
			data: result,
		});
	},
);

export const ShipmentController = {
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
