//index.ts

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import Database from "better-sqlite3";
import * as z from "zod";
import { sValidator } from "@hono/standard-validator";
import { setCookie, getCookie } from "hono/cookie";
import crypto from "crypto";
import { deleteCookie } from "hono/cookie";
import bcrypt from "bcrypt";
import { createNodeWebSocket } from "@hono/node-ws";
import { readFileSync } from "fs";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";


const app = new Hono();
app.use(
  "*",
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
const sessions = new Map<string, any>();

// ⚠️ DB init
const db = new Database("test-db.db");
db.pragma("foreign_keys = ON");

const idParamSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

const dayParamSchema = z.object({
  userId: z.coerce.number().int().positive(),
  day: z.coerce.number().int().min(1).max(7),
});

// ==========================
// INIT TABLES (idempotent)
// ==========================
db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student'
);

CREATE TABLE IF NOT EXISTS timetable (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    lesson_number INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 1 AND 7),

    subject TEXT NOT NULL,
    teacher TEXT,
    classroom TEXT,
    lesson_group TEXT,
    start_time TEXT,
    end_time TEXT,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);



CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    grade INTEGER NOT NULL CHECK(grade BETWEEN 1 AND 5),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dashboard_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    icon TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    day INTEGER NOT NULL CHECK(day BETWEEN 1 AND 31)
);

CREATE TABLE IF NOT EXISTS homework (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    date_label TEXT NOT NULL,
    type TEXT NOT NULL,

    teacher TEXT,
    subject TEXT NOT NULL,

    text TEXT NOT NULL,
    time TEXT,
    color TEXT
);

CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS user_subjects (
    user_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, subject_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS message_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mimetype TEXT NOT NULL,
    size INTEGER NOT NULL,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);
`);

// tabulka pre comments
db.exec(`
CREATE TABLE IF NOT EXISTS message_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`);

mkdirSync("uploads", { recursive: true });

// ==========================
// SAFE SEED (NO DUPLICATES)
// ==========================
function seedTable(table: string, checkQuery: string, insertFn: () => void) {
  const exists = db.prepare(checkQuery).get() as { count: number };

  if (exists.count === 0) {
    insertFn();
  }
}

seedTable("users", "SELECT COUNT(*) as count FROM users", () => {
  db.prepare(`
    INSERT INTO users(email,password,role)
    VALUES
    (
      'student@test.com',
      '$2b$10$OPUWHyAYJw/ZXGSNYTCDmeepeUh1w1cJfsXVNKocl9dmgckkI0UOu',
      'student'
    ),
    (
      'admin@test.com',
      '$2b$10$5BajZgY.0.XFay/7pVCGtuMQlbF/1CvEQN8ykEGP3Em07Od9vx12.',
      'admin'
    ),
      (
      'user1@test.com',
      '$2b$10$SV.L6IDVs2zEVzsO2PmV2OL7miK26CEfohvoIrORyZlGDaElLVYDG',
      'student'
    )


  `).run();
});

seedTable("homework", "SELECT COUNT(*) as count FROM homework", () => {
  db.prepare(
    `
      INSERT INTO homework (date_label, type, teacher, subject, text, time, color)
      VALUES
      ('Štv 04.06.', 'homework', 'Mária Poláková', 'programovanie',
       'Každý si vyberie tému a od budúcej hodiny budú prezentácie', NULL, 'blue'),

      ('Štv 04.06.', 'test', 'Edita Šotetová', 'nemčiny jazyk',
       'Päťminútovka: L.15', '09:45 - 10:00', 'green'),

      ('Štv 04.06.', 'exam', 'Michaela Kocúrová', 'matematika',
       'Koncoročná písomná práca z matematiky', NULL, 'orange'),

      ('Pon 01.06.', 'test', 'Monika Vodičková', 'slovenský jazyk a literatúra',
       'Prozodické vlastnosti reči', NULL, 'yellow')
    `,
  ).run();
});

seedTable("timetable", "SELECT COUNT(*) as count FROM timetable", () => {
  db.prepare(`
    INSERT INTO timetable (user_id, lesson_number, day_of_week, subject, teacher, classroom, lesson_group, start_time, end_time)
    VALUES
    -- Pondelok (1)
    (1,1,1,'Mathematics','Peter Novák','101','Group 1','08:00','08:45'),
    (1,2,1,'English','Jana Kováčová','202','Group 1','08:50','09:35'),
    (1,3,1,'Physics','Tomáš Horváth','Lab1','Group 1','09:45','10:30'),
    (1,4,1,'Slovak','Monika Vodičková','103','Group 1','10:40','11:25'),
    (1,5,1,'Chemistry','Eva Blahová','Lab2','Group 1','11:30','12:15'),

    -- Utorok (2)
    (1,1,2,'Programming','Mária Poláková','GamesLAB','Group 2','08:00','08:45'),
    (1,2,2,'Mathematics','Peter Novák','101','Group 1','08:50','09:35'),
    (1,3,2,'English','Jana Kováčová','202','Group 1','09:45','10:30'),
    (1,4,2,'Biology','Rastislav Krajčí','Lab3','Group 1','10:40','11:25'),
    (1,5,2,'History','Zuzana Mináčová','104','Group 1','11:30','12:15'),
    (1,6,2,'Geography','Martin Szabó','105','Group 1','12:20','13:05'),

    -- Streda (3)
    (1,1,3,'Physical Education','Eva Vengerova','Gym','Group 2','08:00','08:45'),
    (1,2,3,'Programming','Rastislav Kráhenbil','HybridLAB','Group 1','08:50','09:35'),
    (1,3,3,'Programming','Mária Poláková','GamesLAB','Group 2','09:45','10:30'),
    (1,4,3,'Programming','Mária Poláková','GamesLAB','Group 2','10:40','11:25'),
    (1,5,3,'Slovak','Monika Vodičková','103','Group 1','11:30','12:15'),

    -- Štvrtok (4)
    (1,1,4,'Mathematics','Peter Novák','101','Group 1','08:00','08:45'),
    (1,2,4,'Chemistry','Eva Blahová','Lab2','Group 1','08:50','09:35'),
    (1,3,4,'English','Jana Kováčová','202','Group 1','09:45','10:30'),
    (1,4,4,'Physics','Tomáš Horváth','Lab1','Group 1','10:40','11:25'),
    (1,5,4,'Biology','Rastislav Krajčí','Lab3','Group 1','11:30','12:15'),
    (1,6,4,'History','Zuzana Mináčová','104','Group 1','12:20','13:05'),

    -- Piatok (5)
    (1,1,5,'Slovak','Monika Vodičková','103','Group 1','08:00','08:45'),
    (1,2,5,'Geography','Martin Szabó','105','Group 1','08:50','09:35'),
    (1,3,5,'Physical Education','Eva Vengerova','Gym','Group 2','09:45','10:30'),
    (1,4,5,'Mathematics','Peter Novák','101','Group 1','10:40','11:25'),
    (1,5,5,'English','Jana Kováčová','202','Group 1','11:30','12:15')
  `).run();
});

seedTable("grades", "SELECT COUNT(*) as count FROM grades", () => {
  db.prepare(
    `
      INSERT INTO grades (user_id,subject,grade)
      VALUES
      (1,'MAT',1),
      (1,'MAT',2),
      (1,'ANJ',1),
      (1,'PCV',1)
    `,
  ).run();
});

seedTable("messages", "SELECT COUNT(*) as count FROM messages", () => {
  db.prepare(
    `
      INSERT INTO messages(title,content)
      VALUES
      ('School administration','Welcome to StudyGrid'),
      ('Teacher','Homework for Mathematics has been added'),
      ('Announcement','School trip registration is now available')
    `,
  ).run();
});

seedTable(
  "dashboard_cards",
  "SELECT COUNT(*) as count FROM dashboard_cards",
  () => {
    db.prepare(
      `
      INSERT INTO dashboard_cards(title,subtitle,icon)
      VALUES
      ('Homework','Latest assignments','ClipboardDocumentListIcon'),
      ('Tests','Upcoming tests','ClockIcon'),
      ('Results','Grades overview','ChartBarIcon'),
      ('Attendance','School attendance','CalendarDaysIcon'),
      ('Competitions','School events','TrophyIcon'),
      ('Class','Class information','UserGroupIcon'),
      ('Payments','School payments','CurrencyEuroIcon'),
      ('Grades','Student grades','AcademicCapIcon'),
      ('Subjects','Course materials','DocumentTextIcon')
    `,
    ).run();
  },
);

seedTable("events", "SELECT COUNT(*) as count FROM events", () => {
  db.prepare(`
    INSERT INTO events (title, day)
    VALUES
    ('Math Test', 3),
    ('Programming Presentation', 5),
    ('Homework - Slovak', 6),
    ('Chemistry Lab', 8),
    ('English Test', 10),
    ('School Trip', 12),
    ('Biology Exam', 15),
    ('Physics Test', 17),
    ('Programming Homework', 19),
    ('Parent Meeting', 20),
    ('History Test', 22),
    ('Geography Presentation', 24),
    ('Final Exam - Math', 27),
    ('School Event', 30)
  `).run();
});

seedTable("subjects", "SELECT COUNT(*) as count FROM subjects", () => {
  db.prepare(`
    INSERT INTO subjects (name) VALUES
    ('Mathematics'), ('English'), ('Programming'), ('Physics')
  `).run();
});

seedTable("user_subjects", "SELECT COUNT(*) as count FROM user_subjects", () => {
  db.prepare(`
    INSERT INTO user_subjects (user_id, subject_id) VALUES
    (1, 1), (1, 2), (1, 3)
  `).run();
});

// ==========================
// LOGIN
// ==========================
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(3),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(3),
  role: z.enum(["student", "admin"]).default("student"),
});

function safeUser(user: any) {
  const { password, ...rest } = user;
  return rest;
}

app.post("/login", sValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const adminHash = await bcrypt.hash("admin123", 10);
  

  type User = {
  id: number;
  email: string;
  password: string;
  role: string;
};

const user = db
  .prepare("SELECT * FROM users WHERE email = ?")
  .get(email) as User | undefined;

  if (!user) {
  return c.json(
    { success: false, message: "Invalid credentials" },
    401
  );
}

const validPassword = await bcrypt.compare(
  password,
  user.password
);

if (!validPassword) {
  return c.json(
    { success: false, message: "Invalid credentials" },
    401
  );
}

  const sessionId = crypto.randomUUID();

  sessions.set(sessionId, user);

  setCookie(c, "session", sessionId, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "Lax",
  });

  return c.json({ success: true, user: safeUser(user) });
});

// ==========================
// ROUTES
// ==========================
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

app.get("/ws", upgradeWebSocket(() => {
  return {
    onOpen(_evt, ws) {
      console.log("Client connected");
      ws.send("Connected to server");
    },

    onMessage(evt, ws) {
      console.log("Message:", evt.data.toString());

      ws.send("Echo: " + evt.data);
    },

    onClose() {
      console.log("Client disconnected");
    },
  };
}));

const server = serve({
  fetch: app.fetch,
  port: 3000,
});

injectWebSocket(server);



app.get("/timetable/:userId/:day", (c) => {
  const sessionUser = getSessionUser(c);

  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const parsed = dayParamSchema.safeParse(c.req.param());
  if (!parsed.success) return c.json({ message: "Invalid params" }, 400);

  const { userId, day } = parsed.data;

  if (sessionUser.role !== "admin" && sessionUser.id !== userId) {
    return c.json({ message: "Forbidden" }, 403);
  }

  const lessons = db.prepare(`
    SELECT * FROM timetable
    WHERE user_id = ? AND day_of_week = ?
    ORDER BY lesson_number
  `).all(userId, day);

  return c.json(lessons);
});

app.get("/users", (c) => {
  const users = db
    .prepare(
      `
    SELECT id,email,role
    FROM users
  `,
    )
    .all();

  return c.json(users);
});

const idSchema = z.object({
  userId: z.string().regex(/^\d+$/),
});

const homeworkSchema = z.object({
  date_label: z.string().min(1),
  type: z.enum(["homework", "test", "exam"]),
  teacher: z.string().optional(),
  subject: z.string().min(1),
  text: z.string().min(1),
  time: z.string().optional(),
  color: z.string().optional(),
});

app.get("/grades/:userId", (c) => {
  const sessionUser = getSessionUser(c);

  if (!sessionUser) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const parsed = idParamSchema.safeParse(c.req.param());
  if (!parsed.success) return c.json({ message: "Invalid userId" }, 400);

  const { userId } = parsed.data;

  // user môže vidieť len svoje dáta, admin vidí všetko
  if (sessionUser.role !== "admin" && sessionUser.id !== userId) {
    return c.json({ message: "Forbidden" }, 403);
  }

  const grades = db.prepare("SELECT * FROM grades WHERE user_id = ?").all(userId);
  return c.json(grades);
});

function badRequest(message: string) {
  return new Response(JSON.stringify({ message }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

app.get("/messages", (c) => {
  return c.json(db.prepare("SELECT * FROM messages").all());
});

app.get("/cards", (c) => {
  return c.json(db.prepare("SELECT * FROM dashboard_cards").all());
});

app.get("/events", (c) => {
  return c.json(db.prepare("SELECT * FROM events").all());
});

type HomeworkRow = {
  id: number;
  date_label: string;
  type: string;
  teacher: string;
  subject: string;
  text: string;
  time: string | null;
  color: string;
};

app.get("/homework", (c) => {
  const rows = db
    .prepare(
      `
      SELECT * FROM homework
      WHERE type = 'homework'
      ORDER BY date_label DESC
    `,
    )
    .all();

  const grouped: Record<string, any[]> = {};

  for (const row of rows as any[]) {
    if (!grouped[row.date_label]) grouped[row.date_label] = [];
    grouped[row.date_label].push(row);
  }

  return c.json(
    Object.entries(grouped).map(([dateLabel, items]) => ({
      dateLabel,
      items,
    })),
  );
});

app.get("/test", (c) => {
  const rows = db
    .prepare(
      `
      SELECT * FROM homework
      WHERE type IN ('test', 'exam')
      ORDER BY date_label DESC
    `,
    )
    .all();

  const grouped: Record<string, any[]> = {};

  for (const row of rows as any[]) {
    if (!grouped[row.date_label]) grouped[row.date_label] = [];
    grouped[row.date_label].push(row);
  }

  return c.json(
    Object.entries(grouped).map(([dateLabel, items]) => ({
      dateLabel,
      items,
    })),
  );
});

app.get("/me", (c) => {
  const sessionId = getCookie(c, "session");

  if (!sessionId) {
    return c.json({ error: "No session" }, 401);
  }

  const user = sessions.get(sessionId);

  if (!user) {
    return c.json({ error: "Invalid session" }, 401);
  }

  return c.json(safeUser(user));
});

app.get("/users/:userId/subjects", (c) => {
  const parsed = idParamSchema.safeParse(c.req.param());
  if (!parsed.success) return c.json({ message: "Invalid userId" }, 400);

  const { userId } = parsed.data;

  const subjects = db.prepare(`
    SELECT s.* FROM subjects s
    JOIN user_subjects us ON us.subject_id = s.id
    WHERE us.user_id = ?
  `).all(userId);

  return c.json(subjects);
});

function getSessionUser(c: any) {
  const sessionId = getCookie(c, "session");
  if (!sessionId) return null;
  return sessions.get(sessionId) ?? null;
}

// upload endpoint
app.post("/messages/:id/attachments", async (c) => {
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
  if (!allowed.includes(file.type)) {
    return c.json({ message: "Invalid file type. Allowed: jpg, png, gif, pdf" }, 400);
  }

  if (file.size > 5 * 1024 * 1024) {
    return c.json({ message: "File too large. Max 5MB" }, 400);
  }

  const ext = file.name.split(".").pop();
  const filename = `${crypto.randomUUID()}.${ext}`;
  const filepath = join("uploads", filename);

  const buffer = await file.arrayBuffer();
  writeFileSync(filepath, Buffer.from(buffer));

  db.prepare(`
    INSERT INTO message_attachments (message_id, filename, original_name, mimetype, size)
    VALUES (?, ?, ?, ?, ?)
  `).run(messageId, filename, file.name, file.type, file.size);

  return c.json({ success: true, filename, original_name: file.name });
});

// get attachments
app.get("/messages/:id/attachments", (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const messageId = Number(c.req.param("id"));
  const attachments = db.prepare(
    "SELECT * FROM message_attachments WHERE message_id = ?"
  ).all(messageId);

  return c.json(attachments);
});
// GET comments
app.get("/messages/:id/comments", (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const messageId = Number(c.req.param("id"));
  const comments = db.prepare(`
    SELECT mc.*, u.email FROM message_comments mc
    JOIN users u ON u.id = mc.user_id
    WHERE mc.message_id = ?
    ORDER BY mc.created_at ASC
  `).all(messageId);

  return c.json(comments);
});

// POST comment
app.post("/messages/:id/comments", async (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const messageId = Number(c.req.param("id"));
  const body = await c.req.json();

  if (!body.text?.trim()) return c.json({ message: "Text is required" }, 400);

  db.prepare(`
    INSERT INTO message_comments (message_id, user_id, text)
    VALUES (?, ?, ?)
  `).run(messageId, sessionUser.id, body.text.trim());

  return c.json({ success: true });
});

// download attachment
app.get("/attachments/:filename", (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const filename = c.req.param("filename");
  const row = db.prepare(
    "SELECT * FROM message_attachments WHERE filename = ?"
  ).get(filename) as any;

  if (!row) return c.json({ message: "Not found" }, 404);

  const filepath = join("uploads", filename);
  const file = readFileSync(filepath);

  return new Response(file, {
    headers: {
      "Content-Type": row.mimetype,
      "Content-Disposition": `attachment; filename="${row.original_name}"`,
    },
  });
});

app.post("/admin/register", sValidator("json", registerSchema), async (c) => {
  const sessionId = getCookie(c, "session");
  const admin = sessionId ? sessions.get(sessionId) : null;

  // ⛔ must be admin
  if (!admin || admin.role !== "admin") {
    return c.json({ message: "Forbidden" }, 403);
  }

  const { email, password, role } = c.req.valid("json");
  const hashedPassword = await bcrypt.hash(password, 10);

  // check if exists
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email);

  if (existing) {
    return c.json({ message: "User already exists" }, 400);
  }

  db.prepare(
    `INSERT INTO users (email, password, role)
       VALUES (?, ?, ?)`,
  ).run(email, hashedPassword, role);

  return c.json({ success: true });
});

app.post("/logout", (c) => {
  const sessionId = getCookie(c, "session");

  if (sessionId) {
    sessions.delete(sessionId);
  }

  deleteCookie(c, "session", {
    path: "/",
  });

  return c.json({
    success: true,
  });
});;

// CREATE
app.post("/homework", sValidator("json", homeworkSchema), (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const data = c.req.valid("json");

  const result = db.prepare(`
    INSERT INTO homework (date_label, type, teacher, subject, text, time, color)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(data.date_label, data.type, data.teacher ?? null, data.subject, data.text, data.time ?? null, data.color ?? null);

  return c.json({ success: true, id: result.lastInsertRowid });
});

// READ ONE
app.get("/homework/:id", (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const id = Number(c.req.param("id"));
  if (!id) return c.json({ message: "Invalid id" }, 400);

  const row = db.prepare("SELECT * FROM homework WHERE id = ?").get(id);
  if (!row) return c.json({ message: "Not found" }, 404);

  return c.json(row);
});

// UPDATE
app.patch("/homework/:id", sValidator("json", homeworkSchema.partial()), (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const id = Number(c.req.param("id"));
  if (!id) return c.json({ message: "Invalid id" }, 400);

  const existing = db.prepare("SELECT * FROM homework WHERE id = ?").get(id) as any;
  if (!existing) return c.json({ message: "Not found" }, 404);

  const data = c.req.valid("json");

  db.prepare(`
    UPDATE homework SET
      date_label = ?,
      type = ?,
      teacher = ?,
      subject = ?,
      text = ?,
      time = ?,
      color = ?
    WHERE id = ?
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

  return c.json({ success: true });
});

// DELETE
app.delete("/homework/:id", (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser) return c.json({ message: "Unauthorized" }, 401);

  const id = Number(c.req.param("id"));
  if (!id) return c.json({ message: "Invalid id" }, 400);

  const existing = db.prepare("SELECT * FROM homework WHERE id = ?").get(id);
  if (!existing) return c.json({ message: "Not found" }, 404);

  db.prepare("DELETE FROM homework WHERE id = ?").run(id);

  return c.json({ success: true, message: "Deleted successfully" });
});

app.delete("/admin/users/:id", (c) => {
  const sessionId = getCookie(c, "session");
  if (!sessionId) {
    return c.json(
      {
        success: false,
        message: "Not logged in",
      },
      401,
    );
  }

  const currentUser = sessions.get(sessionId);

  if (!currentUser || currentUser.role !== "admin") {
    return c.json(
      {
        success: false,
        message: "Forbidden",
      },
      403,
    );
  }

  const id = Number(c.req.param("id"));
  if (currentUser.id === id) {
    return c.json(
      {
        success: false,
        message: "You cannot delete your own account",
      },
      400,
    );
  }

  if (!id) {
    return c.json(
      {
        success: false,
        message: "Invalid user id",
      },
      400,
    );
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);

  if (!user) {
    return c.json(
      {
        success: false,
        message: "User not found",
      },
      404,
    );
  }

  db.prepare("DELETE FROM users WHERE id = ?").run(id);

  return c.json({
    success: true,
    message: "User deleted successfully",
  });
});
