import { Router } from "express";
import { CourierController } from "./courier.controller";
import { rejectCourierZodSchema } from "./courier.validation";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../prisma/generated/prisma";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

router.patch(
	"/availability",
	auth(Role.COURIER),
	CourierController.updateCourierAvailability,
);

// ─────────────────────────────────────────────

router.get(
	"/dashboard",
	auth(Role.COURIER),
	CourierController.getCourierDashboard,
);

// ─────────────────────────────────────────────

router.patch(
	"/assignments/:id/accept",
	auth(Role.COURIER),
	CourierController.acceptAssignment,
);

// ─────────────────────────────────────────────

router.patch(
	"/assignments/:id/reject",
	auth(Role.COURIER),
	validateRequest(rejectCourierZodSchema),
	CourierController.rejectAssignment,
);

// ─────────────────────────────────────────────

router.patch(
	"/assignments/:id/complete",
	auth(Role.COURIER),
	CourierController.completeAssignment,
);

export const CourierRoutes = router;
