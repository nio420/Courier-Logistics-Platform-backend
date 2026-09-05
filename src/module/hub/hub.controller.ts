import type { Request, Response } from "express";
import httpStatus from "http-status";
import { HubService } from "./hub.service";
import { catchAsync } from "../../utils/CatchAsync";
import { sendResponse } from "../../utils/SendResponse";

const createHub = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const result = await HubService.createHub(payload);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Hub created successfully",
		data: result,
	});
});

// ─────────────────────────────────────────────

const getAllHubs = catchAsync(async (req: Request, res: Response) => {
	const query = req.query;
	const result = await HubService.getAllHubs(query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Hubs fetched successfully",
		data: result,
	});
});

// ─────────────────────────────────────────────

const getSingleHub = catchAsync(async (req: Request, res: Response) => {
	const id = req.params.id;
	const result = await HubService.getSingleHub(id as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Hub fetched successfully",
		data: result,
	});
});
// ─────────────────────────────────────────────

const getActiveHubs = catchAsync(async (_req: Request, res: Response) => {
	const result = await HubService.getActiveHubs();

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Active hubs retrieved successfully",
		data: result,
	});
});

// ─────────────────────────────────────────────

const updateHub = catchAsync(async (req: Request, res: Response) => {
	const id = req.params.id;
	const payload = req.body;
	const result = await HubService.updateHub(id as string, payload);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Hub updated successfully",
		data: result,
	});
});

// ─────────────────────────────────────────────

const deleteHub = catchAsync(async (req: Request, res: Response) => {
	const id = req.params.id;
	const result = await HubService.deleteHub(id as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Hub deactivated successfully",
		data: result,
	});
});

// ─────────────────────────────────────────────

export const HubController = {
	createHub,
	getAllHubs,
	getSingleHub,
	getActiveHubs,
	updateHub,
	deleteHub,
};
