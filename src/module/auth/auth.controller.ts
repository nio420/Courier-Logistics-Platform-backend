import type { Profile } from "passport-google-oauth20";
import { catchAsync } from "../../utils/CatchAsync";
import { sendResponse } from "../../utils/SendResponse";
import type { IRequestUser } from "./auth.interface";
import { AuthService } from "./auth.service";
import type { Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../config";

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  await AuthService.registerUser(payload);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Verification otp sent to email",
    data: null,
  });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await AuthService.verifyEmail(payload);

  const { accessToken, refreshToken, user } = result;

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Email is successfully verified",
    data: {
      user,
      accessToken,
      refreshToken,
    },
  });
});

const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  await AuthService.resendOtp(payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP sent to email",
    data: null,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await AuthService.loginUser(payload);
  const { accessToken, refreshToken } = result;

  const isProduction = config.node_env === "production";

  const authCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    path: "/",
  };

  res.cookie("accessToken", accessToken, {
    ...authCookieOptions,
    maxAge: 1000 * 60 * 60 * 24,
  });

  res.cookie("refreshToken", refreshToken, {
    ...authCookieOptions,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully",
    data: {
      accessToken,
      refreshToken,
    },
  });
});

const logoutUser = catchAsync(async (_req: Request, res: Response) => {
  const isProduction = config.node_env === "production";

  const authCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    path: "/",
  };

  res.cookie("accessToken", "", {
    ...authCookieOptions,
    expires: new Date(0),
    maxAge: 0,
  });

  res.cookie("refreshToken", "", {
    ...authCookieOptions,
    expires: new Date(0),
    maxAge: 0,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged out successfully",
    data: null,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as unknown as IRequestUser;

  if (!user) {
    throw new Error("User information is missing in the request");
  }

  const result = await AuthService.getMe(user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User profile fetched successfully",
    data: result,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  if (!req.cookies.refreshToken) {
    throw new Error("Refresh token is missing");
  }
  const result = await AuthService.refreshToken(req.cookies.refreshToken);
  const { accessToken, refreshToken: newRefreshToken } = result;

  const isProduction = config.node_env === "production";

  const authCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    path: "/",
  };

  res.cookie("accessToken", accessToken, {
    ...authCookieOptions,
    maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
  });
  res.cookie("refreshToken", newRefreshToken, {
    ...authCookieOptions,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "New tokens generated successfully",
    data: null,
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  await AuthService.forgotPassword(payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `OTP sent to Email: ${payload.email}`,
    data: null,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  await AuthService.resetPassword(payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: null,
  });
});

const googleCallback = catchAsync(async (req: Request, res: Response) => {
  const profile = req.user as unknown as Profile;
  const { accessToken, refreshToken, user } =
    await AuthService.googleLogin(profile);

  const dashboardPath =
    user.role === "ADMIN"
      ? "/admin"
      : user.role === "COURIER"
        ? "/courier"
        : "/dashboard";

  const frontendUrl = config.frontend_url.replace(/\/$/, "");

  console.log(
    "Google OAuth redirect target:",
    `${frontendUrl}/google/callback#accessToken=[REDACTED]&refreshToken=[REDACTED]&dashboardPath=${dashboardPath}`,
  );

  return res.redirect(
    `${frontendUrl}/google/callback#${new URLSearchParams({
      accessToken,
      refreshToken,
      dashboardPath,
    }).toString()}`,
  );
});

export const AuthController = {
  registerUser,
  verifyEmail,
  loginUser,
  getMe,
  refreshToken,
  forgotPassword,
  resetPassword,
  googleCallback,
  resendOtp,
  logoutUser,
};
