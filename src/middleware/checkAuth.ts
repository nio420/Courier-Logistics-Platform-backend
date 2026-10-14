import type { NextFunction, Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";
import config from "../config";
import { prisma } from "../lib/prisma";
import { catchAsync } from "../utils/CatchAsync";
import { jwtUtils } from "../utils/Jwt";
import type { Role } from "../../prisma/generated/prisma";
import httpStatus from "http-status";
import AppError from "../utils/AppError";

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
    // 1. Extract Token from Cookies or Bearer Header
    const token = req.cookies?.accessToken
      ? req.cookies.accessToken
      : req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : req.headers.authorization;

    if (!token) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "You are not logged in. Please log in to access this resource.",
      );
    }

    // 2. Verify JWT Token
    const verifiedToken = jwtUtils.verifyToken(token, config.jwt_access_secret);

    if (!verifiedToken.success) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        verifiedToken.error || "Invalid token. Please log in again.",
      );
    }

    const { email, userId, role } = verifiedToken.data as JwtPayload;

    if (!userId || !email || !role) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Invalid authentication token payload.",
      );
    }

    // 3. Role-based access check
    if (requiredRoles.length && !requiredRoles.includes(role as Role)) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Forbidden. You don't have permission to access this resource.",
      );
    }

    // 4. Fetch User from Database
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new Error("User not found. Please log in again.");
    }

    if (user.status === "BLOCKED") {
      throw new Error("Your account has been blocked. Please contact support.");
    }

    if (user.status === "SUSPENDED") {
      throw new Error(
        "Your account has been suspended. Please contact support.",
      );
    }

    // 5. Attach User to Express Request
    req.user = {
      email: user.email,
      name: user.name,
      userId: user.id,
      role: user.role as Role,
    };

    next();
  });
};
