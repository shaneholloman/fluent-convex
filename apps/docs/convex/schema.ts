import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // A simple table for basic number demos
  numbers: defineTable({
    value: v.number(),
  }),

  // A richer table for auth-gated task demos
  tasks: defineTable({
    title: v.string(),
    completed: v.boolean(),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
    createdBy: v.optional(v.string()),
  }).index("by_completed", ["completed"]),
});
