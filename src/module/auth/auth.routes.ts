import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { userValidation } from "./auth.validation";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../prisma/generated/prisma";
import passport from "passport";
import config from "../../config";
import { authRateLimiter } from "../../middleware/rateLimiter";

const router = Router();

router.post(
	"/register",
	authRateLimiter,
	validateRequest(userValidation.registerZodSchema),
	AuthController.registerUser,
);

router.post(
	"/verify-email",
	authRateLimiter,
	validateRequest(userValidation.userEmailVerifyZodSchema),
	AuthController.verifyEmail,
);
router.post(
	"/login",
	authRateLimiter,
	validateRequest(userValidation.loginUserZodSchema),
	AuthController.loginUser,
);
router.get(
	"/me",
	auth(Role.CUSTOMER, Role.COURIER, Role.ADMIN),
	AuthController.getMe,
);
router.post(
	"/forgot-password",
	authRateLimiter,
	validateRequest(userValidation.forgetPasswordZodSchema),
	AuthController.forgotPassword,
);

router.post(
	"/reset-password",
	authRateLimiter,
	validateRequest(userValidation.resetPasswordZodSchema),
	AuthController.resetPassword,
);

router.get(
	"/google",
	passport.authenticate("google", {
		scope: ["profile", "email"],
		prompt: "consent select_account",
		session: false,
	}),
);

router.get(
	"/google/callback",
	passport.authenticate("google", {
		session: false,
		failureRedirect: `${config.frontend_url}/login`,
	}),
	AuthController.googleCallback,
);

export const AuthRoutes = router;
