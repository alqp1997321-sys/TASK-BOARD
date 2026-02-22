import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done")
    ),
    assignee: v.union(v.literal("大哥"), v.literal("BRO")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
});
