import { Router } from "express";

import { ReviewController } from "./review.controller";
import { createReviewZodSchema } from "./review.validation";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { Role } from "../../../prisma/generated/prisma";

const router = Router();

// Get all reviews
router.get(
  "/",
  auth(Role.CUSTOMER, Role.COURIER, Role.ADMIN),
  ReviewController.getReviews,
);

// Get reviews submitted by the logged-in customer
router.get("/my-reviews", auth(Role.CUSTOMER), ReviewController.getMyReviews);

// Get reviews for a specific courier
router.get(
  "/courier/:courierId",
  auth(Role.CUSTOMER, Role.COURIER, Role.ADMIN),
  ReviewController.getCourierReviews,
);

// Create a review
router.post(
  "/",
  auth(Role.CUSTOMER),
  validateRequest(createReviewZodSchema),
  ReviewController.createReview,
);

router.get("/admin", auth(Role.ADMIN), ReviewController.getAdminReviews);

export const ReviewRoutes = router;
