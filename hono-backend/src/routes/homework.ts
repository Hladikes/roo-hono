import { Hono } from "hono";
import * as z from "zod";
import { sValidator } from "@hono/standard-validator";
import { db } from "../db.js";
import { getSessionUser } from "../middleware/auth.js";

export const homeworkRouter = new Hono();

const homeworkSchema = z.object({
  date_label: z.string().min(1),
  type: z.enum(["homework", "test", "exam"]),
  teacher: z.string().optional(),
  subject: z.string().min(1),
  text: z.string().min(1),
  time: z.string().optional(),
  color: z.string().optional(),
  recipient_ids: z.array(z.number().int().positive()).optional(),
});

homeworkRouter.get("/", (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  let rows;

  if (sessionUser.role === "admin") {
    rows = db.prepare(`
      SELECT * FROM homework WHERE type = 'homework' ORDER BY date_label DESC
    `).all();
  } else if (sessionUser.role === "teacher") {
    rows = db.prepare(`
      SELECT * FROM homework WHERE type = 'homework' AND user_id = ? ORDER BY date_label DESC
    `).all(sessionUser.id);
  } else {
    rows = db.prepare(`
      SELECT h.* FROM homework h
      LEFT JOIN homework_recipients hr ON hr.homework_id = h.id
      WHERE h.type = 'homework'
      AND (h.user_id = ? OR hr.user_id = ?)
      ORDER BY h.date_label DESC
    `).all(sessionUser.id, sessionUser.id);
  }

  const grouped: Record<string, any[]> = {};
  for (const row of rows as any[]) {
    if (!grouped[(row as any).date_label]) grouped[(row as any).date_label] = [];
    grouped[(row as any).date_label].push(row);
  }

  return c.json(Object.entries(grouped).map(([dateLabel, items]) => ({ dateLabel, items })));
});

homeworkRouter.get("/test", (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  let rows;

  if (sessionUser.role === "admin") {
    rows = db.prepare(`
      SELECT * FROM homework WHERE type IN ('test', 'exam') ORDER BY date_label DESC
    `).all();
  } else if (sessionUser.role === "teacher") {
    rows = db.prepare(`
      SELECT * FROM homework WHERE type IN ('test', 'exam') AND user_id = ? ORDER BY date_label DESC
    `).all(sessionUser.id);
  } else {
    rows = db.prepare(`
      SELECT h.* FROM homework h
      LEFT JOIN homework_recipients hr ON hr.homework_id = h.id
      WHERE h.type IN ('test', 'exam')
      AND (h.user_id = ? OR hr.user_id = ?)
      ORDER BY h.date_label DESC
    `).all(sessionUser.id, sessionUser.id);
  }

  const grouped: Record<string, any[]> = {};
  for (const row of rows as any[]) {
    if (!grouped[(row as any).date_label]) grouped[(row as any).date_label] = [];
    grouped[(row as any).date_label].push(row);
  }

  return c.json(Object.entries(grouped).map(([dateLabel, items]) => ({ dateLabel, items })));
});

homeworkRouter.post("/", sValidator("json", homeworkSchema), (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const data = c.req.valid("json");
  const result = db.prepare(`
    INSERT INTO homework (user_id, date_label, type, teacher, subject, text, time, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(sessionUser.id, data.date_label, data.type, data.teacher ?? null, data.subject, data.text, data.time ?? null, data.color ?? null);

  const homeworkId = result.lastInsertRowid;

  if (data.recipient_ids && data.recipient_ids.length > 0) {
    for (const userId of data.recipient_ids) {
      db.prepare(`INSERT INTO homework_recipients (homework_id, user_id) VALUES (?, ?)`).run(homeworkId, userId);
    }
  }

  return c.json({ success: true, id: homeworkId });
});

homeworkRouter.get("/:id", (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const id = Number(c.req.param("id"));
  if (!id) return c.json({ message: "Invalid id" }, 400);

  const row = db.prepare("SELECT * FROM homework WHERE id = ?").get(id) as any;
  if (!row) return c.json({ message: "Not found" }, 404);

  if (sessionUser.role !== "admin" && row.user_id !== sessionUser.id)
    return c.json({ message: "Forbidden" }, 403);

  return c.json(row);
});

homeworkRouter.patch("/:id", sValidator("json", homeworkSchema.partial()), (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const id = Number(c.req.param("id"));
  if (!id) return c.json({ message: "Invalid id" }, 400);

  const existing = db.prepare("SELECT * FROM homework WHERE id = ?").get(id) as any;
  if (!existing) return c.json({ message: "Not found" }, 404);

  if (sessionUser.role !== "admin" && existing.user_id !== sessionUser.id)
    return c.json({ message: "Forbidden" }, 403);

  const data = c.req.valid("json");
  db.prepare(`
    UPDATE homework SET date_label=?, type=?, teacher=?, subject=?, text=?, time=?, color=? WHERE id=?
  `).run(
    data.date_label ?? existing.date_label,
    data.type ?? existing.type,
    data.teacher ?? existing.teacher,
    data.subject ?? existing.subject,
    data.text ?? existing.text,
    data.time ?? existing.time,
    data.color ?? existing.color,
    id
  );

  if (data.recipient_ids) {
    db.prepare(`DELETE FROM homework_recipients WHERE homework_id = ?`).run(id);
    for (const userId of data.recipient_ids) {
      db.prepare(`INSERT INTO homework_recipients (homework_id, user_id) VALUES (?, ?)`).run(id, userId);
    }
  }

  return c.json({ success: true });
});

homeworkRouter.delete("/:id", (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const id = Number(c.req.param("id"));
  if (!id) return c.json({ message: "Invalid id" }, 400);

  const existing = db.prepare("SELECT * FROM homework WHERE id = ?").get(id) as any;
  if (!existing) return c.json({ message: "Not found" }, 404);

  if (sessionUser.role !== "admin" && existing.user_id !== sessionUser.id)
    return c.json({ message: "Forbidden" }, 403);

  db.prepare("DELETE FROM homework WHERE id = ?").run(id);
  return c.json({ success: true, message: "Deleted successfully" });
});