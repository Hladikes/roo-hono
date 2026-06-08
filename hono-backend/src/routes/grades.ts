// grades.ts
import { Hono } from "hono";
import { db } from "../db.js";
import { getSessionUser } from "../middleware/auth.js";

export const gradesRouter = new Hono();

gradesRouter.get("/me", (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const rows = db.prepare("SELECT * FROM grades WHERE user_id = ?")
    .all(sessionUser.id);

  return c.json(rows);
});