import type { ValueTransformer } from "typeorm";

/**
 * MariaDB `DECIMAL` columns are returned as strings by the driver. This
 * transformer keeps the entity property typed as `number` on the way out
 * while leaving values untouched on the way in.
 */
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? value : Number(value),
};
