import { catchAsync } from "../../utils/CatchAsync";
import { sendResponse } from "../../utils/SendResponse";
import httpStatus from "http-status";
import type { Request, Response } from "express";
import { AdminService } from "./admin.service";
import type { UserStatus } from "../../../prisma/generated/prisma";
import type { IRequestUser } from "../auth/auth.interface";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
	const result = await AdminService.getAllUsers(req.query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Users retrieved successfully",
		data: result,
	});
});

// ─────────────────────────────────────────────

const getUserById = catchAsync(async (req: Request, res: Response) => {
	const result = await AdminService.getUserById(req.params.id as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User retrieved successfully",
		data: result,
	});
});

// ─────────────────────────────────────────────

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;

	const result = await AdminService.updateUserStatus(
		req.params.id as string,
		req.body.status as UserStatus,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User status updated successfully",
		data: result,
	});
});

const getPendingCouriers = catchAsync(async (_req: Request, res: Response) => {
	const result = await AdminService.getPendingCouriers();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Pending couriers fetched successfully",
		data: result,
	});
});

const getAllCouriers = catchAsync(async (req: Request, res: Response) => {
	const query = req.query;
	const result = await AdminService.getAllCouriers(query);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Couriers retrieved successfully",
		data: result,
	});
});

const getCourierById = catchAsync(async (req: Request, res: Response) => {
	const result = await AdminService.getCourierById(req.params.id as string);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Courier retrieved successfully",
		data: result,
	});
});

const approveCourier = catchAsync(async (req: Request, res: Response) => {
	const userId = req.params.userId;
	const result = await AdminService.approveCourier(userId as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Courier approved successfully",
		data: result,
	});
});

// ─────────────────────────────────────────────

const rejectCourier = catchAsync(async (req: Request, res: Response) => {
	const userId = req.params.userId;
	const payload = req.body;
	const result = await AdminService.rejectCourier(userId as string, payload);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Courier rejected successfully",
		data: result,
	});
});

// ─────────────────────────────────────────────

export const AdminController = {
	getAllUsers,
	getUserById,
	updateUserStatus,
	getPendingCouriers,
	getAllCouriers,
	getCourierById,
	approveCourier,
	rejectCourier,
};
