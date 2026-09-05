import type { HubStatus } from "../../../prisma/generated/prisma";

export interface ICreateHubPayload {
	name: string;
	code: string;
	address: string;
	city: string;
	district: string;
	latitude?: number;
	longitude?: number;
	status?: HubStatus;
}

export interface IUpdateHubPayload {
	name?: string;
	address?: string;
	city?: string;
	district?: string;
	latitude?: number;
	longitude?: number;
	status?: HubStatus;
}
