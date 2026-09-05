import type Stripe from "stripe";
import ejs from "ejs";
import httpStatus from "http-status";
import AppError from "./AppError";
import { prisma } from "../lib/prisma";
import {
	PaymentGateway,
	PaymentStatus,
	ShipmentStatus,
} from "../../prisma/generated/prisma";
import config from "../config";
import { generatePaymentInvoice } from "../module/payment/payment.invoice";
import { transporter } from "../lib/nodemailer";
import path from "path";

export const handleCheckoutSession = async (
	session: Stripe.Checkout.Session,
) => {
	const shipmentId = session.metadata?.shipmentId;
	const customerId = session.metadata?.customerId;

	if (!shipmentId || !customerId) {
		throw new AppError(httpStatus.BAD_REQUEST, "Payment metadata is missing");
	}

	const paymentIntentId =
		typeof session.payment_intent === "string"
			? session.payment_intent
			: session.payment_intent?.id;

	if (!paymentIntentId) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Stripe payment intent not found",
		);
	}

	const existingPayment = await prisma.payment.findFirst({
		where: {
			OR: [
				{
					transactionId: paymentIntentId,
				},
				{
					gatewayPaymentId: session.id,
				},
			],
		},
	});

	if (existingPayment) {
		return existingPayment;
	}

	const result = await prisma.$transaction(async (tx) => {
		const shipment = await tx.shipment.findFirst({
			where: {
				id: shipmentId,
				customerId,
			},
			include: {
				customer: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

		if (!shipment) {
			throw new AppError(httpStatus.NOT_FOUND, "Shipment not found");
		}

		if (shipment.paymentStatus === PaymentStatus.PAID) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Shipment payment is already completed",
			);
		}

		const payment = await tx.payment.create({
			data: {
				shipmentId: shipment.id,
				customerId: shipment.customerId,
				amount: session.amount_total
					? session.amount_total / 100
					: Number(shipment.deliveryFee),
				currency: "BDT",
				gateway: PaymentGateway.STRIPE,
				transactionId: paymentIntentId,
				gatewayPaymentId: session.id,
				status: PaymentStatus.PAID,
				gatewayResponse: session as unknown as object,
				paidAt: new Date(),
			},
		});

		await tx.shipment.update({
			where: {
				id: shipment.id,
			},
			data: {
				paymentStatus: PaymentStatus.PAID,
				status: ShipmentStatus.CONFIRMED,
			},
		});

		return {
			payment,
			shipment,
		};
	});

	const invoice = await generatePaymentInvoice({
		customerName: result.shipment.customer.name,
		customerEmail: result.shipment.customer.email,
		trackingNumber: result.shipment.trackingNumber,
		shipmentId: result.shipment.id,
		amount: Number(result.payment.amount),
		currency: result.payment.currency,
		transactionId: result.payment.transactionId,
		paidAt: result.payment.paidAt!,
	});

	const templatePath = path.join(
		process.cwd(),
		"src/templates/payment-success-email.ejs",
	);

	const html = await ejs.renderFile(templatePath, {
		name: result.shipment.customer.name,
		trackingNumber: result.shipment.trackingNumber,
		shipmentId: result.shipment.id,
		amount: Number(result.payment.amount),
		currency: result.payment.currency,
		transactionId: result.payment.transactionId,
		paidAt: result.payment.paidAt,
	});

	await transporter.sendMail({
		from: `"Courier & Logistics" <${config.email_sender}>`,
		to: result.shipment.customer.email,
		subject: "Payment Successful — Your Shipment is Confirmed",
		html,
		attachments: [
			{
				filename: "Courier Payment Invoice.pdf",
				content: invoice,
			},
		],
	});

	return result.payment;
};
