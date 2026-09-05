import { catchAsync } from "../../utils/CatchAsync";
import { sendResponse } from "../../utils/SendResponse";
import { CourierService } from "./courier.service";
import httpStatus from "http-status";
import type { Request, Response } from "express";
import type { IRequestUser } from "../auth/auth.interface";

const updateCourierAvailability = catchAsync(
	async (req: Request, res: Response) => {
		const user = req.user as IRequestUser;

		const result = await CourierService.updateCourierAvailability(
			user.userId,
			req.body.availabilityStatus,
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Courier availability updated successfully",
			data: result,
		});
	},
);

const getCourierDashboard = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;

	const result = await CourierService.getCourierDashboard(user.userId);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Courier dashboard retrieved successfully",
		data: result,
	});
});

const acceptAssignment = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;

	const result = await CourierService.acceptAssignment(
		req.params.id as string,
		user.userId,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Assignment accepted successfully",
		data: result,
	});
});

const rejectAssignment = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;

	const result = await CourierService.rejectAssignment(
		req.params.id as string,
		user.userId,
		req.body.reason,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Assignment rejected successfully",
		data: result,
	});
});

const completeAssignment = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;

	const result = await CourierService.completeAssignment(
		req.params.id as string,
		user.userId,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Assignment completed successfully",
		data: result,
	});
});

export const CourierController = {
	updateCourierAvailability,
	getCourierDashboard,
	acceptAssignment,
	rejectAssignment,
	completeAssignment,
};
