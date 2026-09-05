export interface IUpdateMyProfilePayload {
	name?: string;
	phone?: string;
	bio?: string;
}

// ─────────────────────────────────────────────

export interface IUserDashboard {
	totalShipments: number;
	pendingShipments: number;
	inTransitShipments: number;
	deliveredShipments: number;
	cancelledShipments: number;
	totalPayments: number;
	totalSpent: number;
	totalReviews: number;
	recentShipments: unknown[];
	recentReviews: unknown[];
}

// ─────────────────────────────────────────────
