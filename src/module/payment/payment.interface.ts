import type { PaymentStatus } from "../../../prisma/generated/prisma";

export interface ICreatePaymentPayload {
	shipmentId: string;
}

export interface IPaymentQuery {
	status?: PaymentStatus;
}

export interface IInvoiceData {
	customerName: string;
	customerEmail: string;
	trackingNumber: string;
	shipmentId: string;
	amount: number;
	currency: string;
	transactionId: string;
	paidAt: Date;
}
