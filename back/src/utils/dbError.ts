import { QueryFailedError } from "typeorm";

export interface DbClientError {
  status: number;
  message: string;
}

const IN_USE: DbClientError = {
  status: 409,
  message: "This resource is still in use and cannot be deleted",
};

/**
 * MariaDB constraint violations that are the client's doing rather than a
 * server fault. Services check these cases up front; this is the safety net
 * for races (two identical requests at once) and any case not checked.
 */
const CLIENT_ERRORS: Record<string, DbClientError> = {
  ER_DUP_ENTRY: { status: 409, message: "This resource already exists" },
  ER_ROW_IS_REFERENCED: IN_USE,
  ER_ROW_IS_REFERENCED_2: IN_USE,
  ER_NO_REFERENCED_ROW: {
    status: 400,
    message: "A referenced resource does not exist",
  },
  ER_NO_REFERENCED_ROW_2: {
    status: 400,
    message: "A referenced resource does not exist",
  },
};

/** The HTTP status/message for a constraint violation, `undefined` for any other error. */
export function dbClientErrorOf(err: unknown): DbClientError | undefined {
  if (!(err instanceof QueryFailedError)) return undefined;
  const code = (err.driverError as { code?: unknown } | undefined)?.code;
  return typeof code === "string" ? CLIENT_ERRORS[code] : undefined;
}
