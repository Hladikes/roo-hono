import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import * as z from "zod";
import { sValidator } from "@hono/standard-validator";
import { setCookie, getCookie } from "hono/cookie";
import { deleteCookie } from "hono/cookie";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { createNodeWebSocket } from "@hono/node-ws";
import { readFileSync } from "fs";
import { join } from "path";

import { db, seedTable } from "./db.js";
import { sessions, getSessionUser, safeUser } from "./middleware/auth.js";
import { homeworkRouter } from "./routes/homework.js";
import { messagesRouter } from "./routes/messages.js";
import { usersRouter } from "./routes/users.js";
import { timetableRouter } from "./routes/timetable.js";
import { notesRouter } from "./routes/notes.js";
import { gradesRouter } from "./routes/grades.js";

const app = new Hono();

app.use("*", cors({ origin: "http://localhost:5173", credentials: true }));

// ==========================
// SEED
// ==========================
seedTable("users", "SELECT COUNT(*) as count FROM users", () => {
  db.prepare(`
    INSERT INTO users(email,password,role) VALUES
    ('student@test.com','$2b$10$OPUWHyAYJw/ZXGSNYTCDmeepeUh1w1cJfsXVNKocl9dmgckkI0UOu','student'),
    ('admin@test.com','$2b$10$5BajZgY.0.XFay/7pVCGtuMQlbF/1CvEQN8ykEGP3Em07Od9vx12.','admin'),
    ('user1@test.com','$2b$10$SV.L6IDVs2zEVzsO2PmV2OL7miK26CEfohvoIrORyZlGDaElLVYDG','student'),
    ('teacher@test.com','$2b$10$OPUWHyAYJw/ZXGSNYTCDmeepeUh1w1cJfsXVNKocl9dmgckkI0UOu','teacher')
  `).run();
});

seedTable("homework", "SELECT COUNT(*) as count FROM homework", () => {
  db.prepare(`
    INSERT INTO homework (user_id, date_label, type, teacher, subject, text, time, color) VALUES
    (1,'Štv 04.06.','homework','Mária Poláková','programovanie','Každý si vyberie tému a od budúcej hodiny budú prezentácie',NULL,'blue'),
    (1,'Štv 04.06.','test','Edita Šotetová','nemčiny jazyk','Päťminútovka: L.15','09:45 - 10:00','green'),
    (1,'Štv 04.06.','exam','Michaela Kocúrová','matematika','Koncoročná písomná práca z matematiky',NULL,'orange'),
    (1,'Pon 01.06.','test','Monika Vodičková','slovenský jazyk a literatúra','Prozodické vlastnosti reči',NULL,'yellow')
  `).run();
});

seedTable("timetable", "SELECT COUNT(*) as count FROM timetable", () => {
  db.prepare(`
    INSERT INTO timetable (user_id, lesson_number, day_of_week, subject, teacher, classroom, lesson_group, start_time, end_time) VALUES
    (1,1,1,'Mathematics','Peter Novák','101','Group 1','08:00','08:45'),
    (1,2,1,'English','Jana Kováčová','202','Group 1','08:50','09:35'),
    (1,3,1,'Physics','Tomáš Horváth','Lab1','Group 1','09:45','10:30'),
    (1,4,1,'Slovak','Monika Vodičková','103','Group 1','10:40','11:25'),
    (1,5,1,'Chemistry','Eva Blahová','Lab2','Group 1','11:30','12:15'),
    (1,1,2,'Programming','Mária Poláková','GamesLAB','Group 2','08:00','08:45'),
    (1,2,2,'Mathematics','Peter Novák','101','Group 1','08:50','09:35'),
    (1,3,2,'English','Jana Kováčová','202','Group 1','09:45','10:30'),
    (1,4,2,'Biology','Rastislav Krajčí','Lab3','Group 1','10:40','11:25'),
    (1,5,2,'History','Zuzana Mináčová','104','Group 1','11:30','12:15'),
    (1,6,2,'Geography','Martin Szabó','105','Group 1','12:20','13:05'),
    (1,1,3,'Physical Education','Eva Vengerova','Gym','Group 2','08:00','08:45'),
    (1,2,3,'Programming','Rastislav Kráhenbil','HybridLAB','Group 1','08:50','09:35'),
    (1,3,3,'Programming','Mária Poláková','GamesLAB','Group 2','09:45','10:30'),
    (1,4,3,'Programming','Mária Poláková','GamesLAB','Group 2','10:40','11:25'),
    (1,5,3,'Slovak','Monika Vodičková','103','Group 1','11:30','12:15'),
    (1,1,4,'Mathematics','Peter Novák','101','Group 1','08:00','08:45'),
    (1,2,4,'Chemistry','Eva Blahová','Lab2','Group 1','08:50','09:35'),
    (1,3,4,'English','Jana Kováčová','202','Group 1','09:45','10:30'),
    (1,4,4,'Physics','Tomáš Horváth','Lab1','Group 1','10:40','11:25'),
    (1,5,4,'Biology','Rastislav Krajčí','Lab3','Group 1','11:30','12:15'),
    (1,6,4,'History','Zuzana Mináčová','104','Group 1','12:20','13:05'),
    (1,1,5,'Slovak','Monika Vodičková','103','Group 1','08:00','08:45'),
    (1,2,5,'Geography','Martin Szabó','105','Group 1','08:50','09:35'),
    (1,3,5,'Physical Education','Eva Vengerova','Gym','Group 2','09:45','10:30'),
    (1,4,5,'Mathematics','Peter Novák','101','Group 1','10:40','11:25'),
    (1,5,5,'English','Jana Kováčová','202','Group 1','11:30','12:15')
  `).run();
});

seedTable("grades", "SELECT COUNT(*) as count FROM grades", () => {
  db.prepare(`INSERT INTO grades (user_id,subject,grade) VALUES (1,'MAT',1),(1,'MAT',2),(1,'ANJ',1),(1,'PCV',1)`).run();
});

seedTable("messages", "SELECT COUNT(*) as count FROM messages", () => {
  const msg1 = db.prepare(`INSERT INTO messages (sender_id, title, content) VALUES (2, 'School administration', 'Welcome to StudyGrid')`).run();
  db.prepare(`INSERT INTO message_recipients (message_id, recipient_id) VALUES (?, 1)`).run(msg1.lastInsertRowid);

  const msg2 = db.prepare(`INSERT INTO messages (sender_id, title, content) VALUES (2, 'Teacher', 'Homework for Mathematics has been added')`).run();
  db.prepare(`INSERT INTO message_recipients (message_id, recipient_id) VALUES (?, 1)`).run(msg2.lastInsertRowid);

  const msg3 = db.prepare(`INSERT INTO messages (sender_id, title, content) VALUES (2, 'Announcement', 'School trip registration is now available')`).run();
  db.prepare(`INSERT INTO message_recipients (message_id, recipient_id) VALUES (?, 1)`).run(msg3.lastInsertRowid);
  db.prepare(`INSERT INTO message_recipients (message_id, recipient_id) VALUES (?, 3)`).run(msg3.lastInsertRowid);
});

seedTable("dashboard_cards", "SELECT COUNT(*) as count FROM dashboard_cards", () => {
  db.prepare(`
    INSERT INTO dashboard_cards(title,subtitle,icon) VALUES
    ('Homework','Latest assignments','ClipboardDocumentListIcon'),
    ('Tests','Upcoming tests','ClockIcon'),
    ('Results','Grades overview','ChartBarIcon'),
    ('Attendance','School attendance','CalendarDaysIcon'),
    ('Competitions','School events','TrophyIcon'),
    ('Class','Class information','UserGroupIcon'),
    ('Payments','School payments','CurrencyEuroIcon'),
    ('Grades','Student grades','AcademicCapIcon'),
    ('Subjects','Course materials','DocumentTextIcon')
  `).run();
});

seedTable("events", "SELECT COUNT(*) as count FROM events", () => {
  db.prepare(`
    INSERT INTO events (title, day) VALUES
    ('Math Test',3),('Programming Presentation',5),('Homework - Slovak',6),
    ('Chemistry Lab',8),('English Test',10),('School Trip',12),
    ('Biology Exam',15),('Physics Test',17),('Programming Homework',19),
    ('Parent Meeting',20),('History Test',22),('Geography Presentation',24),
    ('Final Exam - Math',27),('School Event',30)
  `).run();
});

seedTable("subjects", "SELECT COUNT(*) as count FROM subjects", () => {
  db.prepare(`INSERT INTO subjects (name) VALUES ('Mathematics'),('English'),('Programming'),('Physics')`).run();
});

seedTable("user_subjects", "SELECT COUNT(*) as count FROM user_subjects", () => {
  db.prepare(`INSERT INTO user_subjects (user_id, subject_id) VALUES (1,1),(1,2),(1,3)`).run();
});

// ==========================
// AUTH ROUTES
// ==========================
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(3),
});

app.post("/login", sValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  type User = { id: number; email: string; password: string; role: string };
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User | undefined;

  if (!user) return c.json({ success: false, message: "Invalid credentials" }, 401);

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return c.json({ success: false, message: "Invalid credentials" }, 401);

  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, user);

  setCookie(c, "session", sessionId, {
    httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7, sameSite: "Lax",
  });

  return c.json({ success: true, user: safeUser(user) });
});

app.post("/logout", (c) => {
  const sessionId = getCookie(c, "session");
  if (sessionId) sessions.delete(sessionId);
  deleteCookie(c, "session", { path: "/" });
  return c.json({ success: true });
});

app.get("/me", (c) => {
  const sessionId = getCookie(c, "session");
  if (!sessionId) return c.json({ error: "No session" }, 401);
  const user = sessions.get(sessionId);
  if (!user) return c.json({ error: "Invalid session" }, 401);
  return c.json(safeUser(user));
});

// ==========================
// SIMPLE ROUTES
// ==========================
app.get("/cards", (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);
  return c.json(db.prepare("SELECT * FROM dashboard_cards").all());
});

app.get("/events", (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);
  return c.json(db.prepare("SELECT * FROM events").all());
});

app.get("/grades/me", (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  return c.json(db.prepare("SELECT * FROM grades WHERE user_id = ?").all(sessionUser.id));
});

app.get("/attachments/:filename", (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const filename = c.req.param("filename");
  const row = db.prepare("SELECT * FROM message_attachments WHERE filename = ?").get(filename) as any;
  if (!row) return c.json({ message: "Not found" }, 404);

  const file = readFileSync(join("uploads", filename));
  return new Response(file, {
    headers: {
      "Content-Type": row.mimetype,
      "Content-Disposition": `attachment; filename="${row.original_name}"`,
    },
  });
});

app.get("/favorites", (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);
  const favs = db.prepare(`SELECT message_id FROM message_favorites WHERE user_id = ?`).all(sessionUser.id) as any[];
  return c.json(favs.map(f => f.message_id));
});

app.post("/favorites/:messageId", (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);
  const messageId = Number(c.req.param("messageId"));
  const existing = db.prepare(`SELECT * FROM message_favorites WHERE user_id = ? AND message_id = ?`).get(sessionUser.id, messageId);
  if (existing) {
    db.prepare(`DELETE FROM message_favorites WHERE user_id = ? AND message_id = ?`).run(sessionUser.id, messageId);
    return c.json({ favorited: false });
  }
  db.prepare(`INSERT INTO message_favorites (user_id, message_id) VALUES (?, ?)`).run(sessionUser.id, messageId);
  return c.json({ favorited: true });
});

app.post("/admin/register", async (c) => {
  const sessionId = getCookie(c, "session");
  const admin = sessionId ? sessions.get(sessionId) : null;
  if (!admin || admin.role !== "admin") return c.json({ message: "Forbidden" }, 403);

  const body = await c.req.json();
  const hashedPassword = await bcrypt.hash(body.password, 10);
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(body.email);
  if (existing) return c.json({ message: "User already exists" }, 400);

  db.prepare(`INSERT INTO users (email, password, role) VALUES (?, ?, ?)`).run(body.email, hashedPassword, body.role ?? "student");
  return c.json({ success: true });
});

app.delete("/admin/users/:id", (c) => {
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

app.get("/users", (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);
  return c.json(db.prepare("SELECT id,email,role FROM users").all());
});

app.get("/users/:userId/subjects", (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);
  const userId = Number(c.req.param("userId"));
  return c.json(db.prepare(`
    SELECT s.* FROM subjects s
    JOIN user_subjects us ON us.subject_id = s.id
    WHERE us.user_id = ?
  `).all(userId));
});

// ==========================
// ROUTERS
// ==========================
app.route("/homework", homeworkRouter);
app.route("/messages", messagesRouter);
app.route("/timetable", timetableRouter);
app.route("/notes", notesRouter);

// ==========================
// WEBSOCKET
// ==========================
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

const clients = new Set<any>();

app.get("/ws", upgradeWebSocket(() => ({
  onOpen(_evt: any, ws: any) {
    clients.add(ws);
    ws.send("Connected to server");
  },
  onMessage(evt: any, ws: any) {
    const msg = evt.data.toString();
    for (const client of clients) client.send(msg);
  },
  onClose(_evt: any, ws: any) {
    clients.delete(ws);
  },
})));

const server = serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`);
});

injectWebSocket(server);