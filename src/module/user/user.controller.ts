import type { Request, Response } from "express";

import httpStatus from "http-status";
import { sendResponse } from "../../utils/SendResponse";
import { catchAsync } from "../../utils/CatchAsync";
import { UserService } from "./user.service";
import type { IRequestUser } from "../auth/auth.interface";

const updateProfileImg = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.userId;
	if (!req.file) {
		throw new Error("No file uploaded");
	}
	console.log(req.file, "req file");
	const result = await UserService.updateProfileImg(req.file.buffer, userId!);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Profile image updated successfully",
		data: result,
	});
});

const getMyDashboard = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;

	const result = await UserService.getMyDashboard(user.userId);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Dashboard data retrieved successfully",
		data: result,
	});
});

// ─────────────────────────────────────────────

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;

	const result = await UserService.getMyProfile(user.userId);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Profile retrieved successfully",
		data: result,
	});
});

// ─────────────────────────────────────────────

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;

	const result = await UserService.updateMyProfile(user.userId, req.body);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Profile updated successfully",
		data: result,
	});
});

export const UserController = {
	updateProfileImg,
	getMyDashboard,
	getMyProfile,
	updateMyProfile,
};
