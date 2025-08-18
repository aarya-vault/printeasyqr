// DRIZZLE SCHEMA - PrintEasy QR Platform Database Schema
import { pgTable, text, integer, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table
export const users = pgTable('users', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  username: text('username').unique().notNull(),
  email: text('email').unique().notNull(),
  password_hash: text('password_hash').notNull(),
  phone: text('phone'),
  role: text('role').notNull().default('customer'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Shops table
export const shops = pgTable('shops', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  description: text('description'),
  address: text('address'),
  phone: text('phone'),
  owner_phone: text('owner_phone'),
  email: text('email'),
  owner_id: integer('owner_id').references(() => users.id),
  working_hours: jsonb('working_hours'),
  status: text('status').notNull().default('active'),
  is_online: boolean('is_online').default(true),
  google_maps_url: text('google_maps_url'),
  google_place_id: text('google_place_id'),
  location: jsonb('location'),
  pricing: jsonb('pricing'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Orders table
export const orders = pgTable('orders', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  public_id: text('public_id').unique().notNull(),
  customer_id: integer('customer_id').references(() => users.id),
  shop_id: integer('shop_id').references(() => shops.id),
  queue_number: integer('queue_number'),
  order_type: text('order_type').notNull().default('digital'),
  status: text('status').notNull().default('pending'),
  details: jsonb('details'),
  files: jsonb('files'),
  total_amount: integer('total_amount'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Messages table
export const messages = pgTable('messages', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  order_id: integer('order_id').references(() => orders.id),
  sender_id: integer('sender_id').references(() => users.id),
  content: text('content'),
  message_type: text('message_type').default('text'),
  file_url: text('file_url'),
  created_at: timestamp('created_at').defaultNow()
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  user_id: integer('user_id').references(() => users.id),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').default('info'),
  is_read: boolean('is_read').default(false),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at').defaultNow()
});

// QR Scans table
export const qrScans = pgTable('qr_scans', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  shop_id: integer('shop_id').references(() => shops.id),
  customer_id: integer('customer_id').references(() => users.id),
  scanned_at: timestamp('scanned_at').defaultNow(),
  ip_address: text('ip_address'),
  user_agent: text('user_agent')
});

// Shop Applications table
export const shopApplications = pgTable('shop_applications', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  applicant_id: integer('applicant_id').references(() => users.id),
  shop_name: text('shop_name').notNull(),
  shop_address: text('shop_address').notNull(),
  shop_phone: text('shop_phone').notNull(),
  status: text('status').notNull().default('pending'),
  admin_notes: text('admin_notes'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  shops: many(shops),
  orders: many(orders),
  messages: many(messages),
  notifications: many(notifications),
  qrScans: many(qrScans),
  shopApplications: many(shopApplications)
}));

export const shopsRelations = relations(shops, ({ many, one }) => ({
  owner: one(users, {
    fields: [shops.owner_id],
    references: [users.id]
  }),
  orders: many(orders),
  qrScans: many(qrScans)
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  customer: one(users, {
    fields: [orders.customer_id],
    references: [users.id]
  }),
  shop: one(shops, {
    fields: [orders.shop_id],
    references: [shops.id]
  }),
  messages: many(messages)
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  order: one(orders, {
    fields: [messages.order_id],
    references: [orders.id]
  }),
  sender: one(users, {
    fields: [messages.sender_id],
    references: [users.id]
  })
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.user_id],
    references: [users.id]
  })
}));

export const qrScansRelations = relations(qrScans, ({ one }) => ({
  shop: one(shops, {
    fields: [qrScans.shop_id],
    references: [shops.id]
  }),
  customer: one(users, {
    fields: [qrScans.customer_id],
    references: [users.id]
  })
}));

export const shopApplicationsRelations = relations(shopApplications, ({ one }) => ({
  applicant: one(users, {
    fields: [shopApplications.applicant_id],
    references: [users.id]
  })
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertShopSchema = createInsertSchema(shops).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  created_at: true
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  created_at: true
});

export const insertQrScanSchema = createInsertSchema(qrScans).omit({
  id: true,
  scanned_at: true
});

export const insertShopApplicationSchema = createInsertSchema(shopApplications).omit({
  id: true,
  created_at: true,
  updated_at: true
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

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type QrScan = typeof qrScans.$inferSelect;
export type InsertQrScan = z.infer<typeof insertQrScanSchema>;

export type ShopApplication = typeof shopApplications.$inferSelect;
export type InsertShopApplication = z.infer<typeof insertShopApplicationSchema>;