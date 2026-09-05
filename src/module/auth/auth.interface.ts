import type { Role } from "../../../prisma/generated/prisma";

export interface IRegisterPayload {
	name: string;
	email: string;
	password: string;
	role?: Role;
	vehicleType?: string;
	vehicleNumber?: string;
	licenseNumber?: string;
}

export interface ILoginUserPayload {
	email: string;
	password: string;
}

export interface IVerifyEmailPayload {
	email: string;
	otp: string;
}

export interface IRequestUser {
	userId: string;
	email: string;
	name: string;
	role: Role;
}

export interface IGoogleLoginPayload {
	name: string;
	email: string;
	profilePhoto?: string;
}

export interface IForgotPasswordPayload {
	email: string;
}

export interface IResetPasswordPayload {
	email: string;
	newPassword: string;
	otp: string;
}
