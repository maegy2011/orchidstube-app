import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

function createDbClient() {
  const dbUrl = process.env.DATABASE_URL || "file:app.db";

  // Parse Turso URL: libsql://db-name.user.turso.io?authToken=xxx
  if (dbUrl.startsWith("libsql://")) {
    try {
      const urlObj = new URL(dbUrl);
      const authToken = urlObj.searchParams.get("authToken");
      if (authToken) {
        // Remove authToken from URL to avoid passing it twice
        urlObj.searchParams.delete("authToken");
        return createClient({
          url: urlObj.toString(),
          authToken,
        });
      }
    } catch {
      // URL parse failed, fall through
    }
  }

  return createClient({ url: dbUrl });
}

const client = createDbClient();

export const db = drizzle(client, { schema });
