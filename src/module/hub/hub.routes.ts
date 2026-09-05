import { Router } from "express";
import { HubController } from "./hub.controller";
import { hubValidation } from "./hub.validation";
import { validateRequest } from "../../middleware/validateRequest";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../prisma/generated/prisma";

const router = Router();

router.post(
	"/",
	auth(Role.ADMIN),
	validateRequest(hubValidation.createHubZodSchema),
	HubController.createHub,
);

// ─────────────────────────────────────────────

router.get("/", auth(Role.ADMIN), HubController.getAllHubs);

// ─────────────────────────────────────────────

router.get("/active-hubs", auth(Role.CUSTOMER), HubController.getActiveHubs);

router.get("/:id", auth(Role.ADMIN), HubController.getSingleHub);

// ─────────────────────────────────────────────

router.patch(
	"/:id",
	auth(Role.ADMIN),
	validateRequest(hubValidation.updateHubZodSchema),
	HubController.updateHub,
);

// ─────────────────────────────────────────────

router.delete("/:id", auth(Role.ADMIN), HubController.deleteHub);

export const HubRoutes = router;
