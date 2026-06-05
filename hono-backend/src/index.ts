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
`);

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
  db.prepare(
    `
    INSERT INTO timetable (
      user_id,
      lesson_number,
      day_of_week,
      subject,
      teacher,
      classroom,
      lesson_group,
      start_time,
      end_time
    )
    VALUES
    (1,1,3,'Physical Education','Eva Vengerova','Gym','Group 2','08:00','08:45'),

    (1,2,3,'Programming Practice','Rastislav Kráhenbil','HybridLAB','Group 1','08:50','09:35'),

    (1,3,3,'Programming Practice','Mária Poláková','GamesLAB','Group 2','09:45','10:30'),

    (1,4,3,'Programming Practice','Mária Poláková','GamesLAB','Group 2','10:40','11:25')
  `,
  ).run();
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
  db.prepare(
    `
      INSERT INTO events(title,day)
      VALUES
      ('Homework',3),
      ('Test',5),
      ('Homework',6),
      ('Test',10)
    `,
  ).run();
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

  return c.json({ success: true, user });
});

// ==========================
// ROUTES
// ==========================
app.get("/timetable/:userId/:day", (c) => {
  const parsed = dayParamSchema.safeParse(c.req.param());

  if (!parsed.success) {
    return c.json({ message: "Invalid userId or day format" }, 400);
  }

  const { userId, day } = parsed.data;

  const lessons = db
    .prepare(
      `
      SELECT *
      FROM timetable
      WHERE user_id = ?
      AND day_of_week = ?
      ORDER BY lesson_number
    `,
    )
    .all(userId, day);

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

app.get("/grades/:userId", (c) => {
  const parsed = idParamSchema.safeParse(c.req.param());

  if (!parsed.success) {
    return c.json({ message: "Invalid userId format" }, 400);
  }

  const { userId } = parsed.data;

  const grades = db
    .prepare("SELECT * FROM grades WHERE user_id = ?")
    .all(userId);

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

  return c.json(user);
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

// ==========================
// START SERVER
// ==========================
serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`);
});
