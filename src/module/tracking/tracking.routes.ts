import { Router } from "express";
import { Role } from "../../../prisma/generated/prisma";
import { auth } from "../../middleware/checkAuth";
import { TrackingController } from "./tracking.controller";

const router = Router();

router.get(
	"/:trackingNumber",
	auth(Role.ADMIN, Role.CUSTOMER, Role.COURIER),
	TrackingController.getShipmentByTrackingNumber,
);

router.get(
	"/tracking-history/:id",
	auth(Role.ADMIN, Role.CUSTOMER, Role.COURIER),
	TrackingController.getShipmentTrackingHistory,
);

export const TrackingRoutes = router;
