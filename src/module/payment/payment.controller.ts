import type { Request, Response } from "express";
import httpStatus from "http-status";
import { PaymentService } from "./payment.service";
import { sendResponse } from "../../utils/SendResponse";
import type { IRequestUser } from "../auth/auth.interface";
import { catchAsync } from "../../utils/CatchAsync";

const createPaymentSession = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;

	const result = await PaymentService.createPaymentSessionDB(
		req.body.shipmentId,
		user.userId,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Payment session created successfully",
		data: result,
	});
});

// ─────────────────────────────────────────────

const confirmPayment = async (req: Request, res: Response) => {
	const signature = req.headers["stripe-signature"];

	if (!signature || Array.isArray(signature)) {
		return res.status(httpStatus.BAD_REQUEST).json({
			success: false,
			message: "Stripe signature is missing",
			errors: [],
		});
	}

	const result = await PaymentService.confirmPaymentDB(req.body, signature);

	return res.status(httpStatus.OK).json({
		success: true,
		message: "Payment webhook received successfully",
		data: result,
	});
};

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;

	const result = await PaymentService.getMyPaymentsDB(user.userId, req.query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Payments retrieved successfully",
		data: result,
	});
});

// ─────────────────────────────────────────────

const getSinglePayment = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;

	const result = await PaymentService.getSinglePaymentDB(
		req.params.id as string,
		user.userId,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Single Payment retrieved successfully",
		data: result,
	});
});

// ─────────────────────────────────────────────

export const PaymentController = {
	createPaymentSession,
	confirmPayment,
	getMyPayments,
	getSinglePayment,
};
