import type { IQuery } from "../../interface";
import type { Role, UserStatus } from "../../../prisma/generated/prisma";

export interface IAdminUserQuery extends IQuery {
	status?: UserStatus;
	role?: Role;
}
