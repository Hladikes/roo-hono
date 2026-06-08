import { Hono } from "hono";
import * as z from "zod";
import { db } from "../db.js";
import { getSessionUser } from "../middleware/auth.js";

export const timetableRouter = new Hono();

const dayParamSchema = z.object({
  userId: z.coerce.number().int().positive(),
  day: z.coerce.number().int().min(1).max(7),
});

timetableRouter.get("/:userId/:day", (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const parsed = dayParamSchema.safeParse(c.req.param());
  if (!parsed.success) return c.json({ message: "Invalid params" }, 400);

  const { userId, day } = parsed.data;
  if (sessionUser.role !== "admin" && sessionUser.id !== userId) return c.json({ message: "Forbidden" }, 403);

  const lessons = db.prepare(`
    SELECT * FROM timetable WHERE user_id = ? AND day_of_week = ? ORDER BY lesson_number
  `).all(userId, day);

  return c.json(lessons);
});