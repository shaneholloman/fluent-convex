/**
 * lib.ts - The single builder instance for fluent-convex.
 *
 * This is the foundation of every fluent-convex function in the app.
 * We create ONE builder typed to our DataModel so `context.db` knows
 * about the `numbers` and `tasks` tables.
 *
 * Reusable chains (authedQuery, etc.) are defined in chains.ts to
 * avoid circular imports between this file and middleware.ts.
 */

import { createBuilder } from "fluent-convex";
import type { DataModel } from "./_generated/dataModel";

// #region builder
// The root builder - typed to our schema so `context.db` knows
// about the `numbers` and `tasks` tables.
export const convex = createBuilder<DataModel>();
// #endregion
