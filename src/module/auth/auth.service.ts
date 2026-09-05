import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";
import path from "path";
import config from "../../config";
import { redisClient } from "../../lib/redis";
import { transporter } from "../../lib/nodemailer";
import ejs from "ejs";
import {
	type IForgotPasswordPayload,
	IGoogleLoginPayload,
	type ILoginUserPayload,
	type IRegisterPayload,
	type IRequestUser,
	type IResetPasswordPayload,
	type IVerifyEmailPayload,
} from "./auth.interface";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
import { jwtUtils } from "../../utils/Jwt";
import httpStatus from "http-status";
import {
	AuthProvider,
	CourierApprovalStatus,
	CourierAvailability,
	Role,
	UserStatus,
} from "../../../prisma/generated/prisma";
import AppError from "../../utils/AppError";
import type { Profile } from "passport";

const registerUser = async (payload: IRegisterPayload) => {
	const { name, password } = payload;
	const email = payload.email.trim().toLowerCase();

	const isUserExists = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (isUserExists) {
		throw new Error("User with this email already exists");
	}

	const hashedPassword = await bcrypt.hash(
		password,
		Number(config.bcrypt_salt_rounds),
	);

	const otp = crypto.randomInt(100000, 1000000).toString();

	const otpKey = `register-otp:${email}`;

	await redisClient.set(otpKey, otp, {
		expiration: {
			type: "EX",
			value: 5 * 60,
		},
	});

	const registrationKey = `register-data:${email}`;

	const registrationData = {
		name,
		email,
		password: hashedPassword,
		role: payload.role || "CUSTOMER",
		vehicleType: payload.vehicleType?.trim(),
		vehicleNumber: payload.vehicleNumber?.trim(),
		licenseNumber: payload.licenseNumber?.trim(),
	};

	await redisClient.set(registrationKey, JSON.stringify(registrationData), {
		expiration: {
			type: "EX",
			value: 5 * 60,
		},
	});

	const templatePath = path.join(
		process.cwd(),
		"src/templates/email-verification.ejs",
	);

	const html = await ejs.renderFile(templatePath, {
		name,
		email,
		otp,
		expirationMinutes: 5,
	});

	await transporter.sendMail({
		from: config.email_sender,
		to: email,
		subject: "Email Verification",
		html,
	});
};

const verifyEmail = async (payload: IVerifyEmailPayload) => {
	const email = payload.email.trim().toLowerCase();
	const otp = payload.otp;

	const isUserExists = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (isUserExists?.status === UserStatus.BLOCKED) {
		throw new Error("User is blocked");
	}

	if (isUserExists?.emailVerified) {
		throw new Error("Email already verified");
	}

	const otpKey = `register-otp:${email}`;

	const redisOtp = await redisClient.get(otpKey);

	if (!redisOtp) {
		throw new Error("OTP not found or expired");
	}

	if (redisOtp !== otp) {
		throw new Error("Invalid OTP");
	}

	const registrationKey = `register-data:${email}`;

	const redisRegistrationData = await redisClient.get(registrationKey);

	if (!redisRegistrationData) {
		throw new Error("Registration data not found or expired");
	}

	const registrationData: IRegisterPayload = JSON.parse(redisRegistrationData);

	await redisClient.del([otpKey, registrationKey]);

	const createdUser = await prisma.user.create({
		data: {
			name: registrationData.name,
			email: registrationData.email,
			password: registrationData.password,
			role: registrationData.role,
			authProvider: AuthProvider.CREDENTIALS,
			status: UserStatus.ACTIVE,
			emailVerified: true,
			needPasswordChange: false,
			courierApprovalStatus:
				registrationData.role === "COURIER" ? "PENDING" : null,
		},
		omit: {
			password: true,
		},
	});

	if (registrationData.role === Role.COURIER) {
		await prisma.courier.create({
			data: {
				userId: createdUser.id,
				employeeId: `PENDING-${createdUser.id}`,
				vehicleType: registrationData.vehicleType,
				vehicleNumber: registrationData.vehicleNumber,
				licenseNumber: registrationData.licenseNumber,
				availabilityStatus: CourierAvailability.OFFLINE,
			},
		});
	}

	const templatePath = path.join(
		process.cwd(),
		"src/templates/welcome-email.ejs",
	);

	const html = await ejs.renderFile(templatePath, {
		name: createdUser.name,
	});

	await transporter.sendMail({
		from: config.email_sender,
		to: createdUser.email,
		subject: "Welcome to Courier & Logistics Platform",
		html,
	});

	const jwtPayload = {
		userId: createdUser.id,
		name: createdUser.name,
		email: createdUser.email,
		role: createdUser.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		user: createdUser,
		accessToken,
		refreshToken,
	};
};

const loginUser = async (payload: ILoginUserPayload) => {
	const { password } = payload;

	const email = payload.email.trim().toLowerCase();

	const user = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	if (user.status === UserStatus.BLOCKED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
	}

	if (user.status === UserStatus.SUSPENDED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is suspended");
	}

	if (
		user.role === Role.COURIER &&
		user.courierApprovalStatus !== CourierApprovalStatus.APPROVED
	) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Your courier account is waiting for admin approval",
		);
	}

	if (!user.emailVerified) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Please verify your email before logging in",
		);
	}

	if (user.password === null && user.googleId !== null) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"User is not registered with credentials. Please login with Google",
		);
	}

	if (!user.password) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Password authentication is not available for this account",
		);
	}

	const isPasswordMatched = await bcrypt.compare(password, user.password);

	if (!isPasswordMatched) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid credentials");
	}

	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		accessToken,
		refreshToken,
	};
};

const getMe = async (user: IRequestUser) => {
	const isUserExists = await prisma.user.findUnique({
		where: {
			id: user.userId,
		},
		omit: {
			password: true,
		},
	});

	if (!isUserExists) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	return isUserExists;
};

const refreshToken = async (token: string) => {
	const verifiedRefreshToken = jwtUtils.verifyToken(
		token,
		config.jwt_refresh_secret,
	);

	if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			config.node_env === "development"
				? verifiedRefreshToken.error
				: "Invalid refresh token",
		);
	}

	const data = verifiedRefreshToken.data as JwtPayload;

	const user = await prisma.user.findUnique({
		where: {
			id: data.userId,
		},
	});

	if (!user || user.status !== UserStatus.ACTIVE) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"User is inactive or not found",
		);
	}

	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const newRefreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		accessToken,
		refreshToken: newRefreshToken,
	};
};

const forgotPassword = async (payload: IForgotPasswordPayload) => {
	const email = payload.email.trim().toLowerCase();

	const isUserExists = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (!isUserExists) {
		throw new AppError(httpStatus.NOT_FOUND, "User does not exist");
	}

	if (isUserExists.status === UserStatus.BLOCKED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
	}

	if (isUserExists.status === UserStatus.SUSPENDED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is suspended");
	}

	if (!isUserExists.emailVerified) {
		throw new AppError(httpStatus.BAD_REQUEST, "Email not verified");
	}

	if (
		isUserExists.googleId &&
		isUserExists.authProvider === AuthProvider.GOOGLE
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"User is registered with Google",
		);
	}

	const otp = crypto.randomInt(100000, 1000000).toString();

	const key = `forgot-password-otp:${isUserExists.email}`;

	await redisClient.set(key, otp, {
		expiration: {
			type: "EX",
			value: 5 * 60,
		},
	});

	const templatePath = path.join(
		process.cwd(),
		"src/templates/forgot-password.ejs",
	);

	const html = await ejs.renderFile(templatePath, {
		name: isUserExists.name,
		OTP: otp,
		expirationMinutes: 5,
	});

	await transporter.sendMail({
		from: config.email_sender,
		to: isUserExists.email,
		subject: "Forgot Password",
		html,
	});
};

const resetPassword = async (payload: IResetPasswordPayload) => {
	const { otp, newPassword } = payload;

	const email = payload.email.trim().toLowerCase();

	const isUserExists = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (!isUserExists) {
		throw new AppError(httpStatus.NOT_FOUND, "User does not exist");
	}

	if (isUserExists.status === UserStatus.BLOCKED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
	}

	if (isUserExists.status === UserStatus.SUSPENDED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is suspended");
	}

	if (!isUserExists.emailVerified) {
		throw new AppError(httpStatus.BAD_REQUEST, "Email not verified");
	}

	if (
		isUserExists.googleId &&
		isUserExists.authProvider === AuthProvider.GOOGLE
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"User is registered with Google",
		);
	}

	const key = `forgot-password-otp:${isUserExists.email}`;

	const redisOtp = await redisClient.get(key);

	if (!redisOtp) {
		throw new AppError(httpStatus.BAD_REQUEST, "OTP not found or expired");
	}

	if (redisOtp !== otp) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
	}

	const hashedNewPassword = await bcrypt.hash(
		newPassword,
		Number(config.bcrypt_salt_rounds),
	);

	await prisma.user.update({
		where: {
			email: isUserExists.email,
		},
		data: {
			password: hashedNewPassword,
			needPasswordChange: false,
		},
	});

	await redisClient.del([key]);

	const templatePath = path.join(
		process.cwd(),
		"src/templates/reset-password-success.ejs",
	);

	const html = await ejs.renderFile(templatePath, {
		name: isUserExists.name,
	});

	await transporter.sendMail({
		from: config.email_sender,
		to: isUserExists.email,
		subject: "Password Changed Successfully",
		html,
	});
};

const googleLogin = async (profile: Profile) => {
	const name = profile.displayName;
	const googleId = profile.id;
	const email = profile.emails?.[0]?.value?.trim().toLowerCase();

	if (!email) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Google account email not found",
		);
	}

	let user = await prisma.user.findUnique({
		where: {
			googleId,
		},
	});

	if (user) {
		if (user.status !== UserStatus.ACTIVE) {
			throw new AppError(httpStatus.FORBIDDEN, "User is inactive");
		}
	} else {
		user = await prisma.user.findUnique({
			where: {
				email,
			},
		});

		if (user) {
			if (user.status !== UserStatus.ACTIVE) {
				throw new AppError(httpStatus.FORBIDDEN, "User is inactive");
			}

			user = await prisma.user.update({
				where: {
					id: user.id,
				},
				data: {
					googleId,
					authProvider: AuthProvider.GOOGLE,
					emailVerified: true,
				},
			});
		} else {
			user = await prisma.user.create({
				data: {
					name: profile.displayName,
					email,
					googleId,
					authProvider: AuthProvider.GOOGLE,
					emailVerified: true,
					role: Role.CUSTOMER,
					status: UserStatus.ACTIVE,
					profileImage: profile.photos?.[0]?.value || "",
				},
			});
		}
	}

	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	const { password, ...userWithoutPassword } = user;

	return {
		user: userWithoutPassword,
		accessToken,
		refreshToken,
	};
};

export const AuthService = {
	registerUser,
	verifyEmail,
	loginUser,
	getMe,
	refreshToken,
	forgotPassword,
	resetPassword,
	googleLogin,
};
