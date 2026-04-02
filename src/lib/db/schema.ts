import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: text("email_verified"),
  image: text("image"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  channelId: text("channel_id").notNull(),
  channelTitle: text("channel_title").notNull(),
  channelThumbnail: text("channel_thumbnail"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const watchHistory = sqliteTable("watch_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  videoId: text("video_id").notNull(),
  videoTitle: text("video_title").notNull(),
  videoThumbnail: text("video_thumbnail"),
  watchedAt: integer("watched_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("watch_history_user_video").on(table.userId, table.videoId),
]);

export const favorites = sqliteTable("favorites", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  videoId: text("video_id").notNull(),
  title: text("title").notNull(),
  thumbnail: text("thumbnail"),
  channelName: text("channel_name"),
  duration: text("duration"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("favorites_user_video").on(table.userId, table.videoId),
]);

export const watchLater = sqliteTable("watch_later", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  videoId: text("video_id").notNull(),
  title: text("title").notNull(),
  thumbnail: text("thumbnail"),
  channelName: text("channel_name"),
  duration: text("duration"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("watch_later_user_video").on(table.userId, table.videoId),
]);

export const videoNotes = sqliteTable("video_notes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  videoId: text("video_id").notNull(),
  videoTitle: text("video_title").notNull(),
  content: text("content").notNull(),
  hashtags: text("hashtags"),
  startTime: integer("start_time").notNull().default(0),
  endTime: integer("end_time").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const deniedVideos = sqliteTable('denied_videos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  videoId: text('video_id').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  uniqueIndex('denied_videos_user_video').on(table.userId, table.videoId),
]);

export const userSettings = sqliteTable("user_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  // Unique constraint for UPSERT support — one key per user
  uniqueIndex("user_settings_user_key").on(table.userId, table.key),
]);
