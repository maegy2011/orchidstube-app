import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

function getTursoClient() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.startsWith("file:")) {
    return null;
  }
  if (dbUrl.startsWith("libsql://")) {
    try {
      const urlObj = new URL(dbUrl);
      const authToken = urlObj.searchParams.get("authToken");
      if (authToken) {
        urlObj.searchParams.delete("authToken");
        return createClient({ url: urlObj.toString(), authToken });
      }
      return createClient({ url: dbUrl });
    } catch {
      return null;
    }
  }
  return createClient({ url: dbUrl });
}

// All CREATE TABLE statements matching drizzle schema
const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL UNIQUE,
  email_verified TEXT,
  image TEXT,
  password TEXT,
  created_at INTEGER DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  session_token TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  channel_id TEXT NOT NULL,
  channel_title TEXT NOT NULL,
  channel_thumbnail TEXT,
  created_at INTEGER DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS watch_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  video_id TEXT NOT NULL,
  video_title TEXT NOT NULL,
  video_thumbnail TEXT,
  watched_at INTEGER DEFAULT (CURRENT_TIMESTAMP),
  UNIQUE(user_id, video_id)
);

CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail TEXT,
  channel_name TEXT,
  duration TEXT,
  created_at INTEGER DEFAULT (CURRENT_TIMESTAMP),
  UNIQUE(user_id, video_id)
);

CREATE TABLE IF NOT EXISTS watch_later (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail TEXT,
  channel_name TEXT,
  duration TEXT,
  created_at INTEGER DEFAULT (CURRENT_TIMESTAMP),
  UNIQUE(user_id, video_id)
);

CREATE TABLE IF NOT EXISTS video_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  video_title TEXT NOT NULL,
  content TEXT NOT NULL,
  hashtags TEXT,
  start_time INTEGER NOT NULL DEFAULT 0,
  end_time INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS denied_videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT '',
  UNIQUE(user_id, video_id)
);

CREATE TABLE IF NOT EXISTS playlists (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  created_at INTEGER DEFAULT (CURRENT_TIMESTAMP),
  updated_at INTEGER DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS playlist_items (
  id TEXT PRIMARY KEY,
  playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail TEXT,
  channel_name TEXT,
  duration TEXT,
  added_at INTEGER DEFAULT (CURRENT_TIMESTAMP),
  UNIQUE(playlist_id, video_id)
);

CREATE TABLE IF NOT EXISTS user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_accounts_provider ON accounts(provider, provider_account_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_history_user ON watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_later_user ON watch_later(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user ON video_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_denied_user ON denied_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist ON playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);
`;

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    return NextResponse.json({
      status: "error",
      message: "DATABASE_URL is not set. Please add it in Vercel → Settings → Environment Variables.",
    }, { status: 500 });
  }

  if (dbUrl.startsWith("file:")) {
    return NextResponse.json({
      status: "info",
      message: "Using local SQLite file. No setup needed.",
    });
  }

  const client = getTursoClient();
  if (!client) {
    return NextResponse.json({
      status: "error",
      message: "Failed to connect to database. Check your DATABASE_URL format.",
      hint: "Should be: libsql://your-db-name.turso.io?authToken=your-token",
    }, { status: 500 });
  }

  try {
    // Test connection
    const testResult = await client.execute("SELECT 1 as ok");
    if (!testResult.rows || testResult.rows.length === 0) {
      throw new Error("Connection test failed");
    }

    // Execute all CREATE TABLE statements
    const statements = CREATE_TABLES_SQL.split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const results: string[] = [];
    for (const sql of statements) {
      try {
        await client.execute(sql);
        // Extract table/index name for reporting
        const match = sql.match(/(CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)|CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+))/i);
        const name = match?.[2] || match?.[3] || "statement";
        results.push(`✅ ${name}`);
      } catch (err: any) {
        results.push(`❌ ${err.message?.substring(0, 80)}`);
      }
    }

    // Verify tables exist
    const tables = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );

    return NextResponse.json({
      status: "success",
      message: "Database connected and tables created!",
      databaseUrl: dbUrl.replace(/authToken=[^&]+/, "authToken=***"),
      tablesCreated: results,
      existingTables: tables.rows.map((r: any) => r.name),
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      message: "Database connection failed",
      detail: error.message,
      hint: "Make sure DATABASE_URL is set correctly in Vercel environment variables.",
    }, { status: 500 });
  }
}
