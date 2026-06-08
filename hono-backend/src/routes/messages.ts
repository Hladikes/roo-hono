import { Hono } from "hono";
import * as z from "zod";
import { sValidator } from "@hono/standard-validator";
import { db } from "../db.js";
import { getSessionUser } from "../middleware/auth.js";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import crypto from "crypto";

export const messagesRouter = new Hono();

const messageSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  recipient_ids: z.array(z.number().int().positive()).min(1),
});

messagesRouter.get("/", (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const messages = db.prepare(`
    SELECT m.*, u.email as sender_email
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    JOIN message_recipients mr ON mr.message_id = m.id
    WHERE mr.recipient_id = ?
    ORDER BY m.created_at DESC
  `).all(sessionUser.id);

  return c.json(messages);
});

messagesRouter.post("/", sValidator("json", messageSchema), (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const { title, content, recipient_ids } = c.req.valid("json");
  const result = db.prepare(`
    INSERT INTO messages (sender_id, title, content) VALUES (?, ?, ?)
  `).run(sessionUser.id, title, content);

  const messageId = result.lastInsertRowid;
  for (const recipientId of recipient_ids) {
    db.prepare(`INSERT INTO message_recipients (message_id, recipient_id) VALUES (?, ?)`).run(messageId, recipientId);
  }

  return c.json({ success: true, id: messageId });
});

messagesRouter.get("/:id/attachments", (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const messageId = Number(c.req.param("id"));
  const attachments = db.prepare("SELECT * FROM message_attachments WHERE message_id = ?").all(messageId);
  return c.json(attachments);
});

messagesRouter.post("/:id/attachments", async (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const messageId = Number(c.req.param("id"));
  if (!messageId) return c.json({ message: "Invalid id" }, 400);

  let formData: FormData;
  try {
    formData = await c.req.raw.formData();
  } catch {
    return c.json({ message: "Failed to parse form data" }, 400);
  }

  const file = formData.get("file") as File;
  if (!file) return c.json({ message: "No file provided" }, 400);

  const allowed = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
  if (!allowed.includes(file.type)) return c.json({ message: "Invalid file type" }, 400);
  if (file.size > 5 * 1024 * 1024) return c.json({ message: "File too large. Max 5MB" }, 400);

  const ext = file.name.split(".").pop();
  const filename = `${crypto.randomUUID()}.${ext}`;
  const buffer = await file.arrayBuffer();
  writeFileSync(join("uploads", filename), Buffer.from(buffer));

  db.prepare(`
    INSERT INTO message_attachments (message_id, filename, original_name, mimetype, size)
    VALUES (?, ?, ?, ?, ?)
  `).run(messageId, filename, file.name, file.type, file.size);

  return c.json({ success: true, filename, original_name: file.name });
});

messagesRouter.get("/:id/comments", (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const messageId = Number(c.req.param("id"));
  const comments = db.prepare(`
    SELECT mc.*, u.email FROM message_comments mc
    JOIN users u ON u.id = mc.user_id
    WHERE mc.message_id = ? ORDER BY mc.created_at ASC
  `).all(messageId);

  return c.json(comments);
});

messagesRouter.post("/:id/comments", async (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const messageId = Number(c.req.param("id"));
  const body = await c.req.json();
  if (!body.text?.trim()) return c.json({ message: "Text is required" }, 400);

  db.prepare(`INSERT INTO message_comments (message_id, user_id, text) VALUES (?, ?, ?)`).run(messageId, sessionUser.id, body.text.trim());
  return c.json({ success: true });
});