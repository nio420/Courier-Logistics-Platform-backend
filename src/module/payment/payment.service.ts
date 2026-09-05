import Stripe from "stripe";

import {
	PaymentStatus,
	ShipmentStatus,
} from "../../../prisma/generated/prisma";
import { prisma } from "../../lib/prisma";

import httpStatus from "http-status";
import config from "../../config";
import AppError from "../../utils/AppError";
import { handleCheckoutSession } from "../../utils/payment.handler";
import { IPaymentQuery } from "./payment.interface";
import type { IQuery } from "../../interface";

// ─────────────────────────────────────────────

const stripe = new Stripe(config.stripe_secret_key);

const createPaymentSessionDB = async (
	shipmentId: string,
	customerId: string,
) => {
	const shipment = await prisma.shipment.findFirst({
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
			senderAddress: true,
			receiverAddress: true,
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

	if (
		shipment.status === ShipmentStatus.CANCELLED ||
		shipment.status === ShipmentStatus.DELIVERED
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Payment cannot be created for this shipment",
		);
	}

	const amount = Number(shipment.deliveryFee);

	if (amount <= 0) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid shipment delivery fee");
	}

	const session = await stripe.checkout.sessions.create({
		payment_method_types: ["card"],
		mode: "payment",

		line_items: [
			{
				price_data: {
					currency: "bdt",
					product_data: {
						name: `Courier Shipment - ${shipment.trackingNumber}`,
						description: `${shipment.packageType} - ${shipment.serviceType}`,
					},
					unit_amount: Math.round(amount * 100),
				},
				quantity: 1,
			},
		],

		customer_email: shipment.customer.email,

		success_url: `${config.frontend_url}/payment/success?shipmentId=${shipment.id}`,
		cancel_url: `${config.frontend_url}/payment/cancel?shipmentId=${shipment.id}`,

		metadata: {
			shipmentId: shipment.id,
			customerId: shipment.customerId,
		},
	});

	return {
		paymentUrl: session.url,
		sessionId: session.id,
	};
};

const confirmPaymentDB = async (payload: Buffer, signature: string) => {
	const event = stripe.webhooks.constructEvent(
		payload,
		signature,
		config.stripe_webhook_secret,
	);

	if (event.type === "checkout.session.completed") {
		const session = event.data.object as Stripe.Checkout.Session;

		await handleCheckoutSession(session);
	}

	return {
		received: true,
	};
};

// ─────────────────────────────────────────────

const getMyPaymentsDB = async (customerId: string, query: IQuery) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: any[] = [
		{
			customerId,
		},
	];

	if (query.status) {
		andConditions.push({
			status: query.status,
		});
	}

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{
					transactionId: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
				{
					shipment: {
						trackingNumber: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},
			],
		});
	}

	const where = {
		AND: andConditions,
	};

	const [payments, total] = await Promise.all([
		prisma.payment.findMany({
			where,
			skip,
			take: limit,
			orderBy: {
				[sortBy]: sortOrder,
			},
			select: {
				id: true,
				shipmentId: true,
				customerId: true,
				amount: true,
				currency: true,
				gateway: true,
				transactionId: true,
				gatewayPaymentId: true,
				status: true,
				paidAt: true,
				createdAt: true,
				updatedAt: true,
				shipment: {
					select: {
						trackingNumber: true,
						serviceType: true,
						packageType: true,
						deliveryFee: true,
						status: true,
					},
				},
			},
		}),
		prisma.payment.count({
			where,
		}),
	]);

	return {
		payments,
		meta: {
			page,
			limit,
			total,
			totalPage: Math.ceil(total / limit),
		},
	};
};

// ─────────────────────────────────────────────

const getSinglePaymentDB = async (paymentId: string, customerId: string) => {
	const payment = await prisma.payment.findFirst({
		where: {
			id: paymentId,
			customerId,
		},
		select: {
			id: true,
			shipmentId: true,
			customerId: true,
			amount: true,
			currency: true,
			gateway: true,
			transactionId: true,
			gatewayPaymentId: true,
			status: true,
			gatewayResponse: true,
			paidAt: true,
			createdAt: true,
			updatedAt: true,
			shipment: {
				select: {
					id: true,
					trackingNumber: true,
					serviceType: true,
					packageType: true,
					weight: true,
					deliveryFee: true,
					paymentStatus: true,
					status: true,
					createdAt: true,
				},
			},
		},
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
	}

	return payment;
};

export const PaymentService = {
	createPaymentSessionDB,
	confirmPaymentDB,
	getMyPaymentsDB,
	getSinglePaymentDB,
};
