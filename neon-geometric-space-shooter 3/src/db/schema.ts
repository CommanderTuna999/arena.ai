import { jsonb, pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

export const players = pgTable("players", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default("Pilot"),
  save: jsonb("save").notNull(),
  kills: integer("kills").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
