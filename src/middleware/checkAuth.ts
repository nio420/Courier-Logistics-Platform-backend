import type { NextFunction, Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";
import config from "../config";
import { prisma } from "../lib/prisma";
import { catchAsync } from "../utils/CatchAsync";
import { jwtUtils } from "../utils/Jwt";
import type { Role } from "../../prisma/generated/prisma";

export interface RequestUser {
	email: string;
	name: string;
	userId: string;
	role: Role;
}

declare global {
	namespace Express {
		interface User extends RequestUser {}
	}
}

export const auth = (...requiredRoles: Role[]) => {
	return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
		const token = req.cookies.accessToken
			? req.cookies.accessToken
			: req.headers.authorization?.startsWith("Bearer ")
				? req.headers.authorization.split(" ")[1]
				: req.headers.authorization;

		if (!token) {
			throw new Error(
				"You are not logged in. Please log in to access this resource.",
			);
		}

		const verifiedToken = jwtUtils.verifyToken(token, config.jwt_access_secret);

		if (!verifiedToken.success) {
			throw new Error(verifiedToken.error);
		}

		const { email, name, userId, role } = verifiedToken.data as JwtPayload;

		if (!email || !name || !userId || !role) {
			throw new Error("Invalid authentication token.");
		}

		if (requiredRoles.length && !requiredRoles.includes(role as Role)) {
			throw new Error(
				"Forbidden. You don't have permission to access this resource.",
			);
		}

		const user = await prisma.user.findUnique({
			where: {
				id: userId,
			},
		});

		if (!user) {
			throw new Error("User not found. Please log in again.");
		}

		if (user.email !== email || user.name !== name || user.role !== role) {
			throw new Error(
				"Authentication information is no longer valid. Please log in again.",
			);
		}

		if (user.status === "BLOCKED") {
			throw new Error("Your account has been blocked. Please contact support.");
		}

		if (user.status === "SUSPENDED") {
			throw new Error(
				"Your account has been suspended. Please contact support.",
			);
		}

		req.user = {
			email,
			name,
			userId,
			role: role as Role,
		};

		next();
	});
};
