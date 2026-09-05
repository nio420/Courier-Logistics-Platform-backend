import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import type { IQuery } from "../../interface";
import type { ICreateHubPayload, IUpdateHubPayload } from "./hub.interface";
import AppError from "../../utils/AppError";

const createHub = async (payload: ICreateHubPayload) => {
	const code = payload.code.trim().toUpperCase();
	const existingHub = await prisma.hub.findUnique({
		where: {
			code,
		},
	});

	if (existingHub) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Hub with this code already exists",
		);
	}

	const hub = await prisma.hub.create({
		data: {
			name: payload.name.trim(),
			code,
			address: payload.address.trim(),
			city: payload.city.trim(),
			district: payload.district.trim(),
			latitude: payload.latitude,
			longitude: payload.longitude,
			status: payload.status || "ACTIVE",
		},
	});

	return hub;
};

// ─────────────────────────────────────────────

const getAllHubs = async (query: IQuery) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: any[] = [];

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{
					name: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
				{
					code: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
				{
					city: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
				{
					district: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
			],
		});
	}

	if (query.status) {
		andConditions.push({
			status: query.status,
		});
	}

	if (query.city) {
		andConditions.push({
			city: {
				equals: query.city,
				mode: "insensitive",
			},
		});
	}

	if (query.district) {
		andConditions.push({
			district: {
				equals: query.district,
				mode: "insensitive",
			},
		});
	}

	const hubs = await prisma.hub.findMany({
		where: {
			AND: andConditions,
		},
		take: limit,
		skip: skip,
		orderBy: {
			[sortBy]: sortOrder,
		},
	});

	const total = await prisma.hub.count({
		where: {
			AND: andConditions,
		},
	});

	return {
		data: hubs,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

// ─────────────────────────────────────────────

const getSingleHub = async (id: string) => {
	const hub = await prisma.hub.findUnique({
		where: {
			id,
		},
	});

	if (!hub) {
		throw new AppError(httpStatus.NOT_FOUND, "Hub not found");
	}

	return hub;
};

// ─────────────────────────────────────────────
const getActiveHubs = async () => {
	const hubs = await prisma.hub.findMany({
		where: {
			status: "ACTIVE",
		},
		select: {
			id: true,
			name: true,
			code: true,
			address: true,
			city: true,
			district: true,
		},
		orderBy: {
			name: "asc",
		},
	});

	return hubs;
};

// ─────────────────────────────────────────────

const updateHub = async (id: string, payload: IUpdateHubPayload) => {
	const existingHub = await prisma.hub.findUnique({
		where: {
			id,
		},
	});

	if (!existingHub) {
		throw new AppError(httpStatus.NOT_FOUND, "Hub not found");
	}

	const updatedHub = await prisma.hub.update({
		where: {
			id,
		},
		data: payload,
	});

	return updatedHub;
};

// ─────────────────────────────────────────────

const deleteHub = async (id: string) => {
	const existingHub = await prisma.hub.findUnique({
		where: {
			id,
		},
	});

	if (!existingHub) {
		throw new AppError(httpStatus.NOT_FOUND, "Hub not found");
	}

	if (existingHub.status === "INACTIVE") {
		throw new AppError(httpStatus.BAD_REQUEST, "Hub is already inactive");
	}

	const deletedHub = await prisma.hub.update({
		where: {
			id,
		},
		data: {
			status: "INACTIVE",
		},
	});

	return deletedHub;
};

// ─────────────────────────────────────────────

export const HubService = {
	createHub,
	getAllHubs,
	getSingleHub,
	getActiveHubs,
	updateHub,
	deleteHub,
};
