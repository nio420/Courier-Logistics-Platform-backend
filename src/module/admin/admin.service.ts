import {
  CourierApprovalStatus,
  CourierAvailability,
  Role,
  type UserStatus,
} from "../../../prisma/generated/prisma";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import httpStatus from "http-status";
import type {
  ICourierQuery,
  IRejectCourierPayload,
} from "../courier/courier.interface";
import type { IAdminUserQuery } from "./admin.interface";

const getAllUsers = async (query: IAdminUserQuery) => {
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
          email: {
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

  if (query.role) {
    andConditions.push({
      role: query.role,
    });
  }

  const where = {
    AND: andConditions,
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        courierApprovalStatus: true,
        authProvider: true,
        emailVerified: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
  };
};

const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      courierApprovalStatus: true,
      authProvider: true,
      emailVerified: true,
      profileImage: true,
      createdAt: true,
      updatedAt: true,
      courier: {
        select: {
          employeeId: true,
          vehicleType: true,
          vehicleNumber: true,
          licenseNumber: true,
          availabilityStatus: true,
          totalDeliveries: true,
          totalEarnings: true,
          rating: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  return user;
};

const updateUserStatus = async (userId: string, status: UserStatus) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.role === Role.ADMIN) {
    throw new AppError(httpStatus.FORBIDDEN, "Admin status cannot be changed");
  }

  if (user.status === status) {
    throw new AppError(httpStatus.BAD_REQUEST, `User is already ${status}`);
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      status,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

const getPendingCouriers = async () => {
  const couriers = await prisma.user.findMany({
    where: {
      role: "COURIER",
      courierApprovalStatus: "PENDING",
    },
    select: {
      id: true,
      name: true,
      email: true,
      courierApprovalStatus: true,
      createdAt: true,
      courier: {
        select: {
          employeeId: true,
          vehicleType: true,
          vehicleNumber: true,
          licenseNumber: true,
          availabilityStatus: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!couriers || couriers.length === 0) {
    const error = new Error("No pending courier applications found") as any;
    error.statusCode = httpStatus.NOT_FOUND;
    error.success = false;
    throw error;
  }

  return couriers;
};

const getAllCouriers = async (query: ICourierQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: any[] = [
    {
      role: Role.COURIER,
    },
  ];

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
          email: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  if (query.approvalStatus) {
    andConditions.push({
      courierApprovalStatus: query.approvalStatus,
    });
  }

  if (query.availabilityStatus) {
    andConditions.push({
      courier: {
        availabilityStatus: query.availabilityStatus,
      },
    });
  }

  const where = {
    AND: andConditions,
  };

  const [couriers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        courierApprovalStatus: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
        courier: {
          select: {
            employeeId: true,
            vehicleType: true,
            vehicleNumber: true,
            licenseNumber: true,
            availabilityStatus: true,
            totalDeliveries: true,
            totalEarnings: true,
            rating: true,
          },
        },
      },
    }),

    prisma.user.count({
      where,
    }),
  ]);

  return {
    couriers,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
  };
};

const getCourierById = async (courierId: string) => {
  const courier = await prisma.user.findUnique({
    where: {
      id: courierId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      courierApprovalStatus: true,
      profileImage: true,
      createdAt: true,
      updatedAt: true,
      courier: {
        select: {
          id: true,
          employeeId: true,
          vehicleType: true,
          vehicleNumber: true,
          licenseNumber: true,
          availabilityStatus: true,
          currentLat: true,
          currentLng: true,
          totalDeliveries: true,
          totalEarnings: true,
          rating: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!courier || courier.role !== Role.COURIER) {
    throw new AppError(httpStatus.NOT_FOUND, "Courier not found");
  }

  return courier;
};

const approveCourier = async (userId: string) => {
  const courier = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      courier: true,
    },
  });

  if (!courier) {
    throw new AppError(httpStatus.NOT_FOUND, "Courier application not found");
  }

  if (courier.role !== "COURIER") {
    throw new AppError(httpStatus.BAD_REQUEST, "This user is not a courier");
  }

  if (courier.courierApprovalStatus === CourierApprovalStatus.APPROVED) {
    throw new AppError(httpStatus.BAD_REQUEST, "Courier is already approved");
  }

  if (courier.courierApprovalStatus === CourierApprovalStatus.REJECTED) {
    throw new AppError(httpStatus.BAD_REQUEST, "Courier is already rejected");
  }

  if (
    courier.courierApprovalStatus !== "PENDING" &&
    courier.courierApprovalStatus !== null
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Courier application is not pending",
    );
  }

  if (!courier.courier) {
    throw new AppError(httpStatus.NOT_FOUND, "Courier profile not found");
  }

  const employeeId = `EMP-${Date.now()}`;

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        courierApprovalStatus: "APPROVED",
      },
    });

    const updatedCourier = await tx.courier.update({
      where: {
        userId,
      },
      data: {
        employeeId,
        availabilityStatus: CourierAvailability.AVAILABLE,
      },
    });

    return {
      user: updatedUser,
      courier: updatedCourier,
    };
  });

  return result;
};

const deleteExpiredPendingCouriers = async () => {
  const expirationDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const result = await prisma.user.deleteMany({
    where: {
      role: Role.COURIER,
      courierApprovalStatus: CourierApprovalStatus.PENDING,
      createdAt: {
        lt: expirationDate,
      },
    },
  });

  return result;
};

const rejectCourier = async (
  userId: string,
  payload: IRejectCourierPayload,
) => {
  const courier = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!courier) {
    throw new AppError(httpStatus.NOT_FOUND, "Courier application not found");
  }

  if (courier.role !== "COURIER") {
    throw new AppError(httpStatus.BAD_REQUEST, "This user is not a courier");
  }

  if (courier.courierApprovalStatus === CourierApprovalStatus.APPROVED) {
    throw new AppError(httpStatus.BAD_REQUEST, "Courier is already approved");
  }

  if (courier.courierApprovalStatus === CourierApprovalStatus.REJECTED) {
    throw new AppError(httpStatus.BAD_REQUEST, "Courier is already rejected");
  }

  if (
    courier.courierApprovalStatus !== "PENDING" &&
    courier.courierApprovalStatus !== null
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Courier application is not pending",
    );
  }

  const rejectedCourier = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      courierApprovalStatus: "REJECTED",
    },
  });

  return {
    ...rejectedCourier,
    rejectionReason: payload.reason || null,
  };
};

export const AdminService = {
  getAllUsers,
  getUserById,
  updateUserStatus,
  getPendingCouriers,
  getAllCouriers,
  getCourierById,
  approveCourier,
  deleteExpiredPendingCouriers,
  rejectCourier,
};
