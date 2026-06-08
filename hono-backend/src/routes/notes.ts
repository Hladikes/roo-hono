import { Hono } from "hono";
import { db } from "../db.js";
import { getSessionUser } from "../middleware/auth.js";

export const notesRouter = new Hono();

notesRouter.get("/:timetableId", (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const timetableId = Number(c.req.param("timetableId"));
  const note = db.prepare(`SELECT note FROM lesson_notes WHERE user_id = ? AND timetable_id = ?`).get(sessionUser.id, timetableId) as any;

  return c.json({ note: note?.note ?? "" });
});

notesRouter.post("/:timetableId", async (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const timetableId = Number(c.req.param("timetableId"));
  const body = await c.req.json();
  if (!body.note && body.note !== "") return c.json({ message: "Note required" }, 400);

  db.prepare(`
    INSERT INTO lesson_notes (user_id, timetable_id, note) VALUES (?, ?, ?)
    ON CONFLICT(user_id, timetable_id) DO UPDATE SET note = excluded.note
  `).run(sessionUser.id, timetableId, body.note);

  return c.json({ success: true });
});