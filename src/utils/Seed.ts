import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import config from "../config";
import {
	AuthProvider,
	CourierAvailability,
	Role,
	UserStatus,
} from "../../prisma/generated/prisma";

export const seedAdmin = async () => {
	try {
		const existingAdmin = await prisma.user.findFirst({
			where: {
				role: Role.ADMIN,
			},
		});

		if (existingAdmin) {
			console.log("Admin already exists");
			return;
		}

		const name = config.admin_name;
		const email = config.admin_email;
		const password = config.admin_password;

		if (!name || !email || !password) {
			throw new Error("Admin details are missing. Please check your .env file");
		}

		const hashedPassword = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const admin = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role: Role.ADMIN,
				authProvider: "CREDENTIALS",
				emailVerified: true,
				needPasswordChange: false,
			},
		});

		console.log("Admin created successfully:", admin.email);
	} catch (error) {
		console.error("Error seeding admin:", error);
		throw error;
	}
};

export const seedCourier = async () => {
	try {
		const email = config.courier_email;
		const existingCourier = await prisma.user.findUnique({ where: { email } });
		if (existingCourier) {
			console.log("Courier already exists");
			return;
		}
		const hashedPassword = await bcrypt.hash(
			config.courier_password,
			Number(config.bcrypt_salt_rounds),
		);
		const courier = await prisma.user.create({
			data: {
				name: config.courier_name,
				email,
				password: hashedPassword,
				role: Role.COURIER,
				authProvider: AuthProvider.CREDENTIALS,
				emailVerified: true,
				needPasswordChange: false,
				status: UserStatus.ACTIVE,
			},
		});
		await prisma.courier.create({
			data: {
				userId: courier.id,
				employeeId: "EMP-1001",
				vehicleType: "MOTORCYCLE",
				vehicleNumber: "DHAKA-METRO-1234",
				licenseNumber: "DL-1001",
				availabilityStatus: CourierAvailability.OFFLINE,
				totalDeliveries: 0,
				totalEarnings: 0,
				rating: 0,
			},
		});
		console.log("Demo courier created successfully:", courier.email);
	} catch (error) {
		console.error("Error seeding courier:", error);
		throw error;
	}
};
