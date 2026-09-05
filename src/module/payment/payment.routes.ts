import { Router } from "express";
import { PaymentController } from "./payment.controller";
import {
	createPaymentZodSchema,
	getPaymentByIdZodSchema,
} from "./payment.validation";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { Role } from "../../../prisma/generated/prisma";

const router = Router();

// ─────────────────────────────────────────────

router.post(
	"/create",
	auth(Role.CUSTOMER),
	validateRequest(createPaymentZodSchema),
	PaymentController.createPaymentSession,
);

// ─────────────────────────────────────────────

router.get("/", auth(Role.CUSTOMER), PaymentController.getMyPayments);

// ─────────────────────────────────────────────

router.get(
	"/:id",
	auth(Role.CUSTOMER),
	validateRequest(getPaymentByIdZodSchema),
	PaymentController.getSinglePayment,
);

// ─────────────────────────────────────────────

export const PaymentRoutes = router;
