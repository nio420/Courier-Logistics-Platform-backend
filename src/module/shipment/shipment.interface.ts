import type {
	PackageType,
	ServiceType,
	ShipmentStatus,
} from "../../../prisma/generated/prisma";
import type { IQuery } from "../../interface";

export interface IShipmentItem {
	name: string;
	description?: string;
	quantity: number;
	weight: number;
	declaredValue: number;
}

export interface ICreateShipmentPayload {
	senderAddress: {
		label: string;
		contactName: string;
		phone: string;
		addressLine: string;
		city: string;
		district: string;
		postalCode: string;
		latitude?: number;
		longitude?: number;
		isDefault?: boolean;
	};

	receiverAddress: {
		label: string;
		contactName: string;
		phone: string;
		addressLine: string;
		city: string;
		district: string;
		postalCode: string;
		latitude?: number;
		longitude?: number;
		isDefault?: boolean;
	};

	originHubId: string;
	destinationHubId: string;
	serviceType: ServiceType;
	packageType: PackageType;
	weight: number;
	deliveryFee: number;
	items: IShipmentItem[];
	pickupDate?: Date;
	estimatedDeliveryDate?: Date;
}

export interface IShipmentQuery extends IQuery {
	status?: ShipmentStatus;
	serviceType?: ServiceType;
	packageType?: PackageType;
}

export interface IUpdateShipmentStatusPayload {
	status: ShipmentStatus;
	note?: string;
}
