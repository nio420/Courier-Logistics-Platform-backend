import type { IQuery } from "../../interface";

export interface IApproveCourierPayload {
	courierId: string;
}

export interface IRejectCourierPayload {
	reason?: string;
}

export interface ICourierQuery extends IQuery {
	approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
	availabilityStatus?: "AVAILABLE" | "BUSY" | "OFFLINE" | "SUSPENDED";
}
