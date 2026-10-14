import { QueryFailedError } from "typeorm";
import { describe, expect, it } from "vitest";
import { dbClientErrorOf } from "./dbError";

function queryError(code: string): QueryFailedError {
  return new QueryFailedError("INSERT …", [], Object.assign(new Error(code), { code }));
}

describe("dbClientErrorOf", () => {
  it("maps a duplicate key to 409", () => {
    expect(dbClientErrorOf(queryError("ER_DUP_ENTRY"))?.status).toBe(409);
  });

  it("maps a delete blocked by a foreign key to 409", () => {
    expect(dbClientErrorOf(queryError("ER_ROW_IS_REFERENCED_2"))?.status).toBe(409);
  });

  it("maps a missing referenced row to 400", () => {
    expect(dbClientErrorOf(queryError("ER_NO_REFERENCED_ROW_2"))?.status).toBe(400);
  });

  it("ignores other database errors and non-database errors", () => {
    expect(dbClientErrorOf(queryError("ER_LOCK_DEADLOCK"))).toBeUndefined();
    expect(dbClientErrorOf(new Error("boom"))).toBeUndefined();
  });
});
