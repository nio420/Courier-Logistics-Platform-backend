import express from "express";
import type { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { notFound } from "./middleware/notFound";
import { AuthRoutes } from "./module/auth/auth.routes";
import { globalErrorHandler } from "./middleware/globalErrorHandler";
import config from "./config";
import passport from "passport";
import "../src/lib/google.strategy";
import { UserRoutes } from "./module/user/user.routes";
import { HubRoutes } from "./module/hub/hub.routes";
import { CourierRoutes } from "./module/courier/courier.routes";
import { ShipmentRoutes } from "./module/shipment/shipment.routes";
import { AdminRoutes } from "./module/admin/admin.route";
import { TrackingRoutes } from "./module/tracking/tracking.routes";
import httpStatus from "http-status";
import { PaymentRoutes } from "./module/payment/payment.routes";
import helmet from "helmet";
import { PaymentController } from "./module/payment/payment.controller";
import { ReviewRoutes } from "./module/review/review.route";
import { apiRateLimiter } from "./middleware/rateLimiter";

const app: Application = express();

app.use(
	cors({
		origin: config.frontend_url,
		credentials: true,
	}),
);

app.use(helmet());

// webhook
app.post(
	"/api/v1/payments/webhook",
	express.raw({ type: "application/json" }),
	PaymentController.confirmPayment,
);

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

//rate limiter
app.use("/api", apiRateLimiter);

// buisness routes
app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/user", UserRoutes);
app.use("/api/v1/hubs", HubRoutes);
app.use("/api/v1/couriers", CourierRoutes);
app.use("/api/v1/shipments", ShipmentRoutes);
app.use("/api/v1/tracking", TrackingRoutes);
app.use("/api/v1/admin", AdminRoutes);
app.use("/api/v1/payment", PaymentRoutes);
app.use("/api/v1/reviews", ReviewRoutes);

// Basic route
app.get("/", (_req, res) => {
	res.status(httpStatus.OK).json({
		success: true,
		message: "Welcome to the Courier Logistics Platform API",
		data: null,
	});
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
