import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  preferredUnit: varchar("preferred_unit", { enum: ["in", "cm"] }).default("in"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Verification status enum
export const verificationStatusEnum = pgEnum("verification_status", [
  "VERIFIED_OFFICIAL",
  "UNVERIFIED_CONSERVATIVE", 
  "NEEDS_REVIEW"
]);

// Airlines table
export const airlines = pgTable("airlines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  iataCode: varchar("iata_code", { length: 2 }).notNull().unique(),
  logoUrl: varchar("logo_url"),
  maxPersonalItemLengthCm: decimal("max_personal_item_length_cm", { precision: 5, scale: 2 }),
  maxPersonalItemWidthCm: decimal("max_personal_item_width_cm", { precision: 5, scale: 2 }),
  maxPersonalItemHeightCm: decimal("max_personal_item_height_cm", { precision: 5, scale: 2 }),
  verificationStatus: verificationStatusEnum("verification_status").default("NEEDS_REVIEW"),
  sourceUrl: varchar("source_url"),
  lastVerifiedDate: timestamp("last_verified_date"),
  conflictNotes: text("conflict_notes"),
  petCarrierAllowed: boolean("pet_carrier_allowed").default(true),
  petCarrierMaxLengthCm: decimal("pet_carrier_max_length_cm", { precision: 5, scale: 2 }),
  petCarrierMaxWidthCm: decimal("pet_carrier_max_width_cm", { precision: 5, scale: 2 }),
  petCarrierMaxHeightCm: decimal("pet_carrier_max_height_cm", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bags table
export const bags = pgTable("bags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brand: varchar("brand"),
  model: varchar("model"),
  lengthCm: decimal("length_cm", { precision: 5, scale: 2 }).notNull(),
  widthCm: decimal("width_cm", { precision: 5, scale: 2 }).notNull(),
  heightCm: decimal("height_cm", { precision: 5, scale: 2 }).notNull(),
  isPetCarrier: boolean("is_pet_carrier").default(false),
  carrierType: varchar("carrier_type", { enum: ["hard-sided", "soft-sided"] }),
  isVerified: boolean("is_verified").default(false),
  imageUrl: varchar("image_url"),
  sourceUrl: varchar("source_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User bags junction table
export const userBags = pgTable("user_bags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bagId: varchar("bag_id").notNull().references(() => bags.id, { onDelete: "cascade" }),
  customName: varchar("custom_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bag compatibility checks table
export const bagChecks = pgTable("bag_checks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  bagId: varchar("bag_id").references(() => bags.id),
  airlineId: varchar("airline_id").notNull().references(() => airlines.id),
  flightNumber: varchar("flight_number"),
  bagLengthCm: decimal("bag_length_cm", { precision: 5, scale: 2 }).notNull(),
  bagWidthCm: decimal("bag_width_cm", { precision: 5, scale: 2 }).notNull(),
  bagHeightCm: decimal("bag_height_cm", { precision: 5, scale: 2 }).notNull(),
  isPetCarrier: boolean("is_pet_carrier").default(false),
  fitsUnderSeat: boolean("fits_under_seat").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userBags: many(userBags),
  bagChecks: many(bagChecks),
}));

export const airlinesRelations = relations(airlines, ({ many }) => ({
  bagChecks: many(bagChecks),
}));

export const bagsRelations = relations(bags, ({ many }) => ({
  userBags: many(userBags),
  bagChecks: many(bagChecks),
}));

export const userBagsRelations = relations(userBags, ({ one }) => ({
  user: one(users, {
    fields: [userBags.userId],
    references: [users.id],
  }),
  bag: one(bags, {
    fields: [userBags.bagId],
    references: [bags.id],
  }),
}));

export const bagChecksRelations = relations(bagChecks, ({ one }) => ({
  user: one(users, {
    fields: [bagChecks.userId],
    references: [users.id],
  }),
  bag: one(bags, {
    fields: [bagChecks.bagId],
    references: [bags.id],
  }),
  airline: one(airlines, {
    fields: [bagChecks.airlineId],
    references: [airlines.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  preferredUnit: true,
});

export const insertAirlineSchema = createInsertSchema(airlines);

export const insertBagSchema = createInsertSchema(bags);

export const insertUserBagSchema = createInsertSchema(userBags);

export const insertBagCheckSchema = createInsertSchema(bagChecks);

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Airline = typeof airlines.$inferSelect;
export type Bag = typeof bags.$inferSelect;
export type UserBag = typeof userBags.$inferSelect;
export type BagCheck = typeof bagChecks.$inferSelect;
export type InsertAirline = z.infer<typeof insertAirlineSchema>;
export type InsertBag = z.infer<typeof insertBagSchema>;
export type InsertUserBag = z.infer<typeof insertUserBagSchema>;
export type InsertBagCheck = z.infer<typeof insertBagCheckSchema>;
