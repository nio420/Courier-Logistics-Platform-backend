import { Router } from "express";

import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../prisma/generated/prisma";
import { validateRequest } from "../../middleware/validateRequest";
import {
	getAllCouriersZodSchema,
	rejectCourierZodSchema,
} from "../courier/courier.validation";
import { AdminController } from "./admin.controller";
import {
	getAllUsersZodSchema,
	updateUserStatusZodSchema,
} from "./admin.validation";

const router = Router();

router.get(
	"/users",
	auth(Role.ADMIN),
	validateRequest(getAllUsersZodSchema),
	AdminController.getAllUsers,
);

// ─────────────────────────────────────────────

router.get("/users/:id", auth(Role.ADMIN), AdminController.getUserById);

// ─────────────────────────────────────────────

router.patch(
	"/users/:id/status",
	auth(Role.ADMIN),
	validateRequest(updateUserStatusZodSchema),
	AdminController.updateUserStatus,
);

router.get(
	"/courier-pending",
	auth(Role.ADMIN),
	AdminController.getPendingCouriers,
);

router.get(
	"/couriers",
	auth(Role.ADMIN),
	validateRequest(getAllCouriersZodSchema),
	AdminController.getAllCouriers,
);

router.get("/courier/:id", auth(Role.ADMIN), AdminController.getCourierById);

router.patch(
	"/approve/:userId",
	auth(Role.ADMIN),
	AdminController.approveCourier,
);

// ─────────────────────────────────────────────

router.patch(
	"/reject/:userId",
	auth(Role.ADMIN),
	validateRequest(rejectCourierZodSchema),
	AdminController.rejectCourier,
);

export const AdminRoutes = router;
