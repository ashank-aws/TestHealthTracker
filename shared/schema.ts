import { pgTable, text, serial, integer, boolean, timestamp, decimal } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { z } from 'zod';

// Define users table (base table from template)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Environment table
export const environments = pgTable("environments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Metrics table
export const metrics = pgTable("metrics", {
  id: serial("id").primaryKey(),
  environmentId: integer("environment_id").references(() => environments.id).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  uptime: decimal("uptime", { precision: 5, scale: 2 }).notNull(), // percentage
  mttr: integer("mttr").notNull(), // mean time to recover (minutes)
  mtbf: integer("mtbf").notNull(), // mean time between failures (minutes)
  resourceUtilization: decimal("resource_utilization", { precision: 5, scale: 2 }).notNull(), // percentage
  occupancy: decimal("occupancy", { precision: 5, scale: 2 }).notNull(), // percentage
});

// Daily status table
export const dailyStatus = pgTable("daily_status", {
  id: serial("id").primaryKey(),
  environmentId: integer("environment_id").references(() => environments.id).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  status: text("status").notNull(), // 'healthy', 'issues', 'down'
  uptimePercentage: decimal("uptime_percentage", { precision: 5, scale: 2 }).notNull(),
  hasIncident: boolean("has_incident").default(false).notNull(),
  incidentCount: integer("incident_count").default(0).notNull(),
  recoveryTime: integer("recovery_time").default(0), // minutes, null if no incident
});

// Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  abbreviation: text("abbreviation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Booking table
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  environmentId: integer("environment_id").references(() => environments.id).notNull(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  purpose: text("purpose"),
  configuration: text("configuration").notNull(),
  status: text("status").notNull().default("scheduled"), // 'scheduled', 'active', 'completed', 'cancelled'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Incidents table
export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  environmentId: integer("environment_id").references(() => environments.id).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"), // 'open', 'resolved'
  recoveryTime: integer("recovery_time"), // minutes, calculated when resolved
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Funds table for testing
export const funds = pgTable("funds", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("fund_code").notNull().unique(),
  description: text("description"),
  projects: text("projects"),
  status: text("status").notNull().default("active"), // 'active', 'inactive'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations
export const environmentsRelations = relations(environments, ({ many }) => ({
  metrics: many(metrics),
  dailyStatus: many(dailyStatus),
  bookings: many(bookings),
  incidents: many(incidents),
}));

export const metricsRelations = relations(metrics, ({ one }) => ({
  environment: one(environments, {
    fields: [metrics.environmentId],
    references: [environments.id],
  }),
}));

export const dailyStatusRelations = relations(dailyStatus, ({ one }) => ({
  environment: one(environments, {
    fields: [dailyStatus.environmentId],
    references: [environments.id],
  }),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  environment: one(environments, {
    fields: [bookings.environmentId],
    references: [environments.id],
  }),
  team: one(teams, {
    fields: [bookings.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
}));

export const incidentsRelations = relations(incidents, ({ one }) => ({
  environment: one(environments, {
    fields: [incidents.environmentId],
    references: [environments.id],
  }),
}));

// Create schemas for validation
export const environmentsInsertSchema = createInsertSchema(environments, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  description: (schema) => schema.optional(),
});
export type EnvironmentInsert = z.infer<typeof environmentsInsertSchema>;
export type Environment = typeof environments.$inferSelect;

export const metricsInsertSchema = createInsertSchema(metrics);
export type MetricInsert = z.infer<typeof metricsInsertSchema>;
export type Metric = typeof metrics.$inferSelect;

export const dailyStatusInsertSchema = createInsertSchema(dailyStatus, {
  status: (schema) => schema.refine(
    val => ['healthy', 'issues', 'down'].includes(val),
    { message: "Status must be one of: 'healthy', 'issues', 'down'" }
  ),
});
export type DailyStatusInsert = z.infer<typeof dailyStatusInsertSchema>;
export type DailyStatus = typeof dailyStatus.$inferSelect;

export const teamsInsertSchema = createInsertSchema(teams, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  abbreviation: (schema) => schema.max(3, "Abbreviation must be no more than 3 characters").optional(),
});
export type TeamInsert = z.infer<typeof teamsInsertSchema>;
export type Team = typeof teams.$inferSelect;

export const bookingsInsertSchema = createInsertSchema(bookings, {
  purpose: (schema) => schema.optional(),
  status: (schema) => schema.refine(
    val => ['scheduled', 'active', 'completed', 'cancelled'].includes(val),
    { message: "Status must be one of: 'scheduled', 'active', 'completed', 'cancelled'" }
  ),
});
export type BookingInsert = z.infer<typeof bookingsInsertSchema>;
export type Booking = typeof bookings.$inferSelect;

export const incidentsInsertSchema = createInsertSchema(incidents, {
  description: (schema) => schema.min(3, "Description must be at least 3 characters"),
  status: (schema) => schema.refine(
    val => ['open', 'resolved'].includes(val),
    { message: "Status must be one of: 'open', 'resolved'" }
  ),
});
export type IncidentInsert = z.infer<typeof incidentsInsertSchema>;
export type Incident = typeof incidents.$inferSelect;

// Funds schema
export const fundsInsertSchema = createInsertSchema(funds, {
  name: (schema) => schema.min(2, "Fund name must be at least 2 characters"),
  code: (schema) => schema.min(2, "Fund code must be at least 2 characters"),
  description: (schema) => schema.optional(),
  projects: (schema) => schema.optional(),
  status: (schema) => schema.refine(
    val => ['active', 'inactive'].includes(val),
    { message: "Status must be one of: 'active', 'inactive'" }
  ),
});
export type FundInsert = z.infer<typeof fundsInsertSchema>;
export type Fund = typeof funds.$inferSelect;

// User schema from template
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
