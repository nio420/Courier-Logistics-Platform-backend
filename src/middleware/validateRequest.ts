import { catchAsync } from "../utils/CatchAsync";
import type { NextFunction, Request, Response } from "express";
import AppError from "../utils/AppError";
import httpStatus from "http-status";
import type { ZodTypeAny } from "zod";

type ValidationSource = "body" | "query" | "params";

export const validateRequest = (
  zodSchema: ZodTypeAny,
  source: ValidationSource = "body",
) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const input =
      source === "query"
        ? req.query
        : source === "params"
          ? req.params
          : req.body;

    const result = await zodSchema.safeParseAsync(input);

    if (!result.success) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        result.error.issues[0].message,
      );
    }

    if (source === "body") {
      req.body = result.data;
    } else if (source === "query") {
      res.locals.validatedQuery = result.data;
    } else {
      res.locals.validatedParams = result.data;
    }

    next();
  });
};
