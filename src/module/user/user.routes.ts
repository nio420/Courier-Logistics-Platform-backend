import { Router } from "express";
import { upload } from "../../lib/multer";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../prisma/generated/prisma";
import { UserController } from "./user.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { updateMyProfileZodSchema } from "./user.validation";

const router = Router();

router.patch(
	"/profile-image",
	auth(Role.CUSTOMER, Role.COURIER, Role.ADMIN),
	upload.single("profileImage"),
	UserController.updateProfileImg,
);

router.get("/dashboard", auth(Role.CUSTOMER), UserController.getMyDashboard);

// ─────────────────────────────────────────────

router.get(
	"/me",
	auth(Role.CUSTOMER, Role.COURIER, Role.ADMIN),
	UserController.getMyProfile,
);

// ─────────────────────────────────────────────

router.patch(
	"/me-update",
	auth(Role.CUSTOMER, Role.COURIER, Role.ADMIN),
	validateRequest(updateMyProfileZodSchema),
	UserController.updateMyProfile,
);

export const UserRoutes = router;
