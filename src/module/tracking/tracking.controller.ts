import { catchAsync } from "../../utils/CatchAsync";
import type { IRequestUser } from "../auth/auth.interface";
import { TrackingService } from "./tracking.service";
import { sendResponse } from "../../utils/SendResponse";
import type { Request, Response } from "express";

const getShipmentByTrackingNumber = catchAsync(
	async (req: Request, res: Response) => {
		const trackingNumber = req.params.trackingNumber;
		const user = req.user as IRequestUser;
		const result = await TrackingService.getShipmentByTrackingNumber(
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

const getShipmentTrackingHistory = catchAsync(
	async (req: Request, res: Response) => {
		const user = req.user as IRequestUser;
		const shipmentId = req.params.id;
		const result = await TrackingService.getShipmentTrackingHistory(
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

export const TrackingController = {
	getShipmentByTrackingNumber,
	getShipmentTrackingHistory,
};
