import crypto from "crypto";

export const calculateDistance = (
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): number => {
	const toRad = (value: number) => (value * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);

	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

	return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const calculateDeliveryFee = (
	weight: number,
	serviceType: "STANDARD" | "EXPRESS",
	distance: number,
): number => {
	const isStandard = serviceType === "STANDARD";
	const baseFee = isStandard ? 60 : 100;
	const weightRate = isStandard ? 20 : 30;
	const distanceRate = isStandard ? 10 : 15;

	const totalFee =
		baseFee +
		Math.max(weight - 1, 0) * weightRate +
		Math.max(distance - 5, 0) * distanceRate;
	return Number(totalFee.toFixed(2));
};

export const generateTrackingNumber = (): string => {
	return `CR-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
};
