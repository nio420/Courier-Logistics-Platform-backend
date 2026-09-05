import PDFDocument from "pdfkit";
import type { IInvoiceData } from "./payment.interface";

export const generatePaymentInvoice = async (
	invoiceData: IInvoiceData,
): Promise<Buffer> => {
	const pdfDocument = new PDFDocument({
		autoFirstPage: false,
		margin: 50,
		size: [595, 842],
		info: {
			Title: "Courier Payment Invoice",
			Author: "Courier & Logistics",
			Subject: "Payment Invoice",
			Keywords: "Courier Payment Invoice",
			Creator: "Courier & Logistics",
			Producer: "Courier & Logistics",
		},
	});

	pdfDocument.addPage();

	const pdfChunks: Buffer[] = [];

	pdfDocument.on("data", (chunk: Buffer) => {
		pdfChunks.push(chunk);
	});

	const pdfReadyPromise = new Promise<Buffer>((resolve) => {
		pdfDocument.on("end", () => {
			resolve(Buffer.concat(pdfChunks));
		});
	});

	const pageWidth = pdfDocument.page.width;
	const pageHeight = pdfDocument.page.height;

	const left = 50;
	const right = pageWidth - 50;
	const contentWidth = right - left;

	const primaryColor = "#111827";
	const secondaryColor = "#6B7280";
	const lightColor = "#F3F4F6";
	const borderColor = "#E5E7EB";
	const successColor = "#15803D";
	const successBackground = "#DCFCE7";

	// ─────────────────────────────────────────────
	// Header

	pdfDocument.roundedRect(left, 45, contentWidth, 105, 12).fill("#111827");

	pdfDocument
		.fillColor("#FFFFFF")
		.font("Helvetica-Bold")
		.fontSize(23)
		.text("COURIER & LOGISTICS", left + 25, 68);

	pdfDocument
		.fillColor("#D1D5DB")
		.font("Helvetica")
		.fontSize(10)
		.text("Reliable delivery. Professional service.", left + 25, 98);

	pdfDocument
		.fillColor("#FFFFFF")
		.font("Helvetica-Bold")
		.fontSize(22)
		.text("INVOICE", right - 145, 67, {
			width: 120,
			align: "right",
		});

	pdfDocument
		.fillColor("#D1D5DB")
		.font("Helvetica")
		.fontSize(9)
		.text("PAYMENT RECEIPT", right - 145, 100, {
			width: 120,
			align: "right",
		});

	// ─────────────────────────────────────────────
	// Payment Status

	pdfDocument.roundedRect(right - 95, 165, 95, 28, 14).fill(successBackground);

	pdfDocument
		.fillColor(successColor)
		.font("Helvetica-Bold")
		.fontSize(10)
		.text("●  PAID", right - 95, 174, {
			width: 95,
			align: "center",
		});

	// ─────────────────────────────────────────────
	// Customer Information

	pdfDocument
		.fillColor(primaryColor)
		.font("Helvetica-Bold")
		.fontSize(13)
		.text("BILLED TO", left, 220);

	pdfDocument
		.fillColor(primaryColor)
		.font("Helvetica-Bold")
		.fontSize(11)
		.text(invoiceData.customerName, left, 247);

	pdfDocument
		.fillColor(secondaryColor)
		.font("Helvetica")
		.fontSize(9)
		.text(invoiceData.customerEmail, left, 266);

	// ─────────────────────────────────────────────
	// Invoice Details

	pdfDocument
		.fillColor(primaryColor)
		.font("Helvetica-Bold")
		.fontSize(13)
		.text("PAYMENT DETAILS", 330, 220);

	pdfDocument
		.fillColor(secondaryColor)
		.font("Helvetica")
		.fontSize(9)
		.text("Payment Date", 330, 248);

	pdfDocument
		.fillColor(primaryColor)
		.font("Helvetica-Bold")
		.fontSize(9)
		.text(invoiceData.paidAt.toLocaleString(), 420, 248, {
			width: 125,
			align: "right",
		});

	pdfDocument
		.fillColor(secondaryColor)
		.font("Helvetica")
		.fontSize(9)
		.text("Payment Method", 330, 267);

	pdfDocument
		.fillColor(primaryColor)
		.font("Helvetica-Bold")
		.fontSize(9)
		.text("Stripe", 420, 267, {
			width: 125,
			align: "right",
		});

	// ─────────────────────────────────────────────
	// Shipment Information Box

	pdfDocument.roundedRect(left, 310, contentWidth, 105, 10).fill(lightColor);

	pdfDocument
		.fillColor(primaryColor)
		.font("Helvetica-Bold")
		.fontSize(12)
		.text("SHIPMENT INFORMATION", left + 18, 328);

	pdfDocument
		.fillColor(secondaryColor)
		.font("Helvetica")
		.fontSize(8)
		.text("TRACKING NUMBER", left + 18, 357);

	pdfDocument
		.fillColor(primaryColor)
		.font("Helvetica-Bold")
		.fontSize(10)
		.text(invoiceData.trackingNumber, left + 18, 372, {
			width: 220,
		});

	pdfDocument
		.fillColor(secondaryColor)
		.font("Helvetica")
		.fontSize(8)
		.text("SHIPMENT ID", left + 290, 357);

	pdfDocument
		.fillColor(primaryColor)
		.font("Helvetica-Bold")
		.fontSize(8)
		.text(invoiceData.shipmentId, left + 290, 372, {
			width: 175,
		});

	// ─────────────────────────────────────────────
	// Payment Summary

	pdfDocument
		.fillColor(primaryColor)
		.font("Helvetica-Bold")
		.fontSize(13)
		.text("PAYMENT SUMMARY", left, 460);

	pdfDocument
		.moveTo(left, 488)
		.lineTo(right, 488)
		.lineWidth(1)
		.strokeColor(borderColor)
		.stroke();

	pdfDocument
		.fillColor(secondaryColor)
		.font("Helvetica")
		.fontSize(10)
		.text("Courier delivery service", left, 510);

	pdfDocument
		.fillColor(primaryColor)
		.font("Helvetica-Bold")
		.fontSize(10)
		.text(
			`${invoiceData.amount.toFixed(2)} ${invoiceData.currency}`,
			right - 150,
			510,
			{
				width: 150,
				align: "right",
			},
		);

	pdfDocument
		.moveTo(left, 540)
		.lineTo(right, 540)
		.lineWidth(1)
		.strokeColor(borderColor)
		.stroke();

	// ─────────────────────────────────────────────
	// Total

	pdfDocument.roundedRect(left, 560, contentWidth, 65, 10).fill("#F9FAFB");

	pdfDocument
		.fillColor(secondaryColor)
		.font("Helvetica")
		.fontSize(11)
		.text("TOTAL PAID", left + 18, 584);

	pdfDocument
		.fillColor(primaryColor)
		.font("Helvetica-Bold")
		.fontSize(20)
		.text(
			`${invoiceData.amount.toFixed(2)} ${invoiceData.currency}`,
			right - 210,
			578,
			{
				width: 190,
				align: "right",
			},
		);

	// ─────────────────────────────────────────────
	// Transaction Information

	pdfDocument
		.fillColor(secondaryColor)
		.font("Helvetica")
		.fontSize(8)
		.text("STRIPE TRANSACTION ID", left, 660);

	pdfDocument
		.fillColor(primaryColor)
		.font("Helvetica-Bold")
		.fontSize(9)
		.text(invoiceData.transactionId, left, 676, {
			width: contentWidth,
		});

	// ─────────────────────────────────────────────
	// Thank You Section

	pdfDocument.roundedRect(left, 720, contentWidth, 55, 10).fill("#111827");

	pdfDocument
		.fillColor("#FFFFFF")
		.font("Helvetica-Bold")
		.fontSize(11)
		.text("Thank you for choosing Courier & Logistics.", left + 15, 737, {
			width: contentWidth - 30,
			align: "center",
		});

	pdfDocument
		.fillColor("#9CA3AF")
		.font("Helvetica")
		.fontSize(8)
		.text("Your payment has been successfully received.", left + 15, 755, {
			width: contentWidth - 30,
			align: "center",
		});

	// ─────────────────────────────────────────────
	// Footer

	pdfDocument
		.fillColor("#9CA3AF")
		.font("Helvetica")
		.fontSize(7)
		.text(
			"This is a computer-generated invoice and does not require a signature.",
			left,
			pageHeight - 30,
			{
				width: contentWidth,
				align: "center",
			},
		);

	pdfDocument.end();

	return await pdfReadyPromise;
};
