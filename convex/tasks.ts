import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getTasks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tasks").orderBy("createdAt", "desc").collect();
  },
});

export const addTask = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done")
    ),
    assignee: v.union(v.literal("大哥"), v.literal("BRO")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("tasks", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateTaskStatus = mutation({
  args: {
    id: v.id("tasks"),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const updateTaskAssignee = mutation({
  args: {
    id: v.id("tasks"),
    assignee: v.union(v.literal("大哥"), v.literal("BRO")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      assignee: args.assignee,
      updatedAt: Date.now(),
    });
  },
});

export const deleteTask = mutation({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
