import { Hono } from "hono";
import * as z from "zod";
import { sValidator } from "@hono/standard-validator";
import { db } from "../db.js";
import { getSessionUser, sessions, safeUser } from "../middleware/auth.js";
import bcrypt from "bcrypt";
import { getCookie } from "hono/cookie";

export const usersRouter = new Hono();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(3),
  role: z.enum(["student", "admin", "teacher"]).default("student"),
});

usersRouter.get("/", (c) => {
  return c.json(db.prepare("SELECT id,email,role FROM users").all());
});

usersRouter.get("/:userId/subjects", (c) => {
  const userId = Number(c.req.param("userId"));
  const subjects = db.prepare(`
    SELECT s.* FROM subjects s
    JOIN user_subjects us ON us.subject_id = s.id
    WHERE us.user_id = ?
  `).all(userId);
  return c.json(subjects);
});

usersRouter.get("/favorites", (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const favs = db.prepare(`SELECT message_id FROM message_favorites WHERE user_id = ?`).all(sessionUser.id) as any[];
  return c.json(favs.map(f => f.message_id));
});

usersRouter.post("/favorites/:messageId", (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const messageId = Number(c.req.param("messageId"));
  const existing = db.prepare(`SELECT * FROM message_favorites WHERE user_id = ? AND message_id = ?`).get(sessionUser.id, messageId);

  if (existing) {
    db.prepare(`DELETE FROM message_favorites WHERE user_id = ? AND message_id = ?`).run(sessionUser.id, messageId);
    return c.json({ favorited: false });
  } else {
    db.prepare(`INSERT INTO message_favorites (user_id, message_id) VALUES (?, ?)`).run(sessionUser.id, messageId);
    return c.json({ favorited: true });
  }
});

usersRouter.post("/admin/register", sValidator("json", registerSchema), async (c) => {
  const sessionId = getCookie(c, "session");
  const admin = sessionId ? sessions.get(sessionId) : null;
  if (!admin || admin.role !== "admin") return c.json({ message: "Forbidden" }, 403);

  const { email, password, role } = c.req.valid("json");
  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return c.json({ message: "User already exists" }, 400);

  db.prepare(`INSERT INTO users (email, password, role) VALUES (?, ?, ?)`).run(email, hashedPassword, role);
  return c.json({ success: true });
});

usersRouter.delete("/admin/users/:id", (c) => {
  const sessionId = getCookie(c, "session");
  if (!sessionId) return c.json({ success: false, message: "Not logged in" }, 401);

  const currentUser = sessions.get(sessionId);
  if (!currentUser || currentUser.role !== "admin") return c.json({ success: false, message: "Forbidden" }, 403);

  const id = Number(c.req.param("id"));
  if (currentUser.id === id) return c.json({ success: false, message: "You cannot delete your own account" }, 400);
  if (!id) return c.json({ success: false, message: "Invalid user id" }, 400);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  if (!user) return c.json({ success: false, message: "User not found" }, 404);

  db.prepare("DELETE FROM users WHERE id = ?").run(id);
  return c.json({ success: true, message: "User deleted successfully" });
});

