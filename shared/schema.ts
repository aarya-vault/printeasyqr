import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - handles customers, shop owners, and admins
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  name: text("name"),
  email: text("email"),
  password: text("password"), // For shop owners and admins
  role: text("role").notNull().default("customer"), // 'customer', 'shop_owner', 'admin'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Shops table
export const shops = pgTable("shops", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  
  // Public Information (shown to customers)
  name: text("name").notNull(), // Public shop name
  slug: text("slug").notNull().unique(), // URL-friendly shop identifier
  address: text("address").notNull(), // Public address
  city: text("city").notNull(),
  state: text("state").notNull(),
  pinCode: text("pin_code").notNull(),
  phone: text("phone").notNull(), // Public contact number
  publicOwnerName: text("public_owner_name"), // Optional public owner name
  
  // Internal Information
  internalName: text("internal_name").notNull(), // Internal shop name
  ownerFullName: text("owner_full_name").notNull(),
  email: text("email").notNull(), // Login email
  ownerPhone: text("owner_phone").notNull(),
  completeAddress: text("complete_address").notNull(),
  
  // Services and Experience
  services: jsonb("services").notNull(), // Array of services offered including custom ones
  equipment: jsonb("equipment").notNull().default([]), // Array of equipment available
  yearsOfExperience: text("years_of_experience").notNull(),
  
  // Working Hours and Availability
  workingHours: jsonb("working_hours").notNull(), // Day-wise working hours {monday: {open: "09:00", close: "21:00", closed: false}}
  acceptsWalkinOrders: boolean("accepts_walkin_orders").notNull().default(true),
  isOnline: boolean("is_online").notNull().default(false),
  autoAvailability: boolean("auto_availability").notNull().default(true),
  
  // Admin and Status
  isApproved: boolean("is_approved").notNull().default(false),
  isPublic: boolean("is_public").notNull().default(true),
  status: text("status").default('active').$type<'active' | 'deactivated' | 'banned'>(),
  qrCode: text("qr_code"), // Generated QR code data
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalOrders: integer("total_orders").notNull().default(0),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => users.id),
  shopId: integer("shop_id").notNull().references(() => shops.id),
  type: text("type").notNull(), // 'upload' or 'walkin'
  title: text("title").notNull(),
  description: text("description"),
  specifications: jsonb("specifications"), // Print specs like copies, color, binding, etc.
  files: jsonb("files"), // Array of file metadata for upload orders
  status: text("status").notNull().default("new"), // 'new', 'processing', 'ready', 'completed'
  isUrgent: boolean("is_urgent").notNull().default(false),
  estimatedPages: integer("estimated_pages"),
  estimatedBudget: decimal("estimated_budget", { precision: 10, scale: 2 }),
  finalAmount: decimal("final_amount", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Chat messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: text("message_type").notNull().default("text"), // 'text', 'file', 'system'
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Shop applications table (for pending approvals)
export const shopApplications = pgTable("shop_applications", {
  id: serial("id").primaryKey(),
  applicantId: integer("applicant_id").notNull().references(() => users.id),
  
  // Public Information
  publicShopName: text("public_shop_name").notNull(),
  publicOwnerName: text("public_owner_name"),
  publicAddress: text("public_address").notNull(),
  publicContactNumber: text("public_contact_number"),
  
  // Internal Shop Details
  internalShopName: text("internal_shop_name").notNull(),
  ownerFullName: text("owner_full_name").notNull(),
  email: text("email").notNull(), // Login email
  phoneNumber: text("phone_number").notNull(), // Owner phone
  password: text("password").notNull(), // Shop owner login password
  completeAddress: text("complete_address").notNull(),
  
  // Location
  city: text("city").notNull(),
  state: text("state").notNull(),
  pinCode: text("pin_code").notNull(),
  
  // Business Details
  services: jsonb("services").notNull(),
  customServices: jsonb("custom_services").default([]),
  equipment: jsonb("equipment").notNull().default([]),
  customEquipment: jsonb("custom_equipment").default([]),
  yearsOfExperience: text("years_of_experience").notNull(),
  
  // Working Hours and Settings
  workingHours: jsonb("working_hours").notNull(), // Day-wise working hours
  acceptsWalkinOrders: boolean("accepts_walkin_orders").notNull().default(true),
  
  // Application Status
  shopSlug: text("shop_slug").notNull(), // Proposed URL slug
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  adminNotes: text("admin_notes"),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'order_update', 'system', 'chat'
  relatedId: integer("related_id"), // Order ID or other related entity
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  ownedShops: many(shops),
  orders: many(orders),
  messages: many(messages),
  notifications: many(notifications),
  applications: many(shopApplications),
}));

export const shopsRelations = relations(shops, ({ one, many }) => ({
  owner: one(users, {
    fields: [shops.ownerId],
    references: [users.id],
  }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(users, {
    fields: [orders.customerId],
    references: [users.id],
  }),
  shop: one(shops, {
    fields: [orders.shopId],
    references: [shops.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  order: one(orders, {
    fields: [messages.orderId],
    references: [orders.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const shopApplicationsRelations = relations(shopApplications, ({ one }) => ({
  applicant: one(users, {
    fields: [shopApplications.applicantId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  phone: true,
  name: true,
  email: true,
  role: true,
});

export const insertShopSchema = createInsertSchema(shops).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  rating: true,
  totalOrders: true,
  qrCode: true,
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  customerId: true,
  shopId: true,
  type: true,
  title: true,
  description: true,
  specifications: true,
  files: true,
  isUrgent: true,
  estimatedPages: true,
  estimatedBudget: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  orderId: true,
  senderId: true,
  content: true,
  messageType: true,
  fileUrl: true,
  fileName: true,
});

export const insertShopApplicationSchema = createInsertSchema(shopApplications).pick({
  applicantId: true,
  publicShopName: true,
  publicOwnerName: true,
  publicAddress: true,
  publicContactNumber: true,
  internalShopName: true,
  ownerFullName: true,
  email: true,
  phoneNumber: true,
  password: true,
  completeAddress: true,
  city: true,
  state: true,
  pinCode: true,
  services: true,
  equipment: true,
  yearsOfExperience: true,
  workingHours: true,
  acceptsWalkinOrders: true,
  shopSlug: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Shop = typeof shops.$inferSelect;
export type InsertShop = z.infer<typeof insertShopSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type ShopApplication = typeof shopApplications.$inferSelect;
export type InsertShopApplication = z.infer<typeof insertShopApplicationSchema>;
export type Notification = typeof notifications.$inferSelect;
