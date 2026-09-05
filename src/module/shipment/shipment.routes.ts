import { Router } from "express";
import {
	assignCourierZodSchema,
	createShipmentZodSchema,
	getAllShipmentsZodSchema,
	getMyShipmentsZodSchema,
	updateShipmentStatusZodSchema,
} from "./shipment.validation";
import { ShipmentController } from "./shipment.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../prisma/generated/prisma";

const router = Router();

router.post(
	"/",
	auth(Role.CUSTOMER),
	validateRequest(createShipmentZodSchema),
	ShipmentController.createShipment,
);

router.get(
	"/",
	auth(Role.ADMIN),
	validateRequest(getAllShipmentsZodSchema),
	ShipmentController.getAllShipments,
);

router.get(
	"/my-shipments",
	auth(Role.CUSTOMER),
	validateRequest(getMyShipmentsZodSchema),
	ShipmentController.getMyShipments,
);

router.get(
	"/:id",
	auth(Role.ADMIN, Role.CUSTOMER, Role.COURIER),
	ShipmentController.getShipmentById,
);

router.patch(
	"/cancel/:id",
	auth(Role.CUSTOMER),
	ShipmentController.cancelShipment,
);

router.patch(
	"/status/:id",
	auth(Role.ADMIN, Role.COURIER),
	validateRequest(updateShipmentStatusZodSchema),
	ShipmentController.updateShipmentStatus,
);

router.patch(
	"/assign-courier/:id",
	auth(Role.ADMIN),
	validateRequest(assignCourierZodSchema),
	ShipmentController.assignCourier,
);

export const ShipmentRoutes = router;
