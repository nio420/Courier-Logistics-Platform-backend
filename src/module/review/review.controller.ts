import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/CatchAsync";
import type { IRequestUser } from "../auth/auth.interface";
import { ReviewService } from "./review.service";
import { sendResponse } from "../../utils/SendResponse";

// ─────────────────────────────────────────────

const createReview = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;

  const result = await ReviewService.createReview(user.userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Review created successfully",
    data: result,
  });
});

// ─────────────────────────────────────────────

const getCourierReviews = catchAsync(async (req: Request, res: Response) => {
  const courierId = req.params.courierId;
  const result = await ReviewService.getCourierReviews(courierId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Courier reviews retrieved successfully",
    data: result,
  });
});

const getReviews = catchAsync(async (_req: Request, res: Response) => {
  const result = await ReviewService.getReviews();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reviews retrieved successfully",
    data: result,
  });
});

const getMyReviews = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;

  const result = await ReviewService.getMyReviews(user.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your reviews retrieved successfully",
    data: result,
  });
});

const getAdminReviews = catchAsync(async (_req: Request, res: Response) => {
  const result = await ReviewService.getAdminReviews();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin reviews retrieved successfully",
    data: result,
  });
});

export const ReviewController = {
  createReview,
  getCourierReviews,
  getReviews,
  getMyReviews,
  getAdminReviews,
};
