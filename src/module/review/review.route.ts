import { Router } from "express";

import { ReviewController } from "./review.controller";
import { createReviewZodSchema } from "./review.validation";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { Role } from "../../../prisma/generated/prisma";

const router = Router();

// ─────────────────────────────────────────────

router.post(
	"/",
	auth(Role.CUSTOMER),
	validateRequest(createReviewZodSchema),
	ReviewController.createReview,
);

// ─────────────────────────────────────────────

router.get(
	"/courier/:courierId",
	auth(Role.CUSTOMER, Role.COURIER, Role.ADMIN),
	ReviewController.getCourierReviews,
);

// ─────────────────────────────────────────────

export const ReviewRoutes = router;
