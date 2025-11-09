import { pgTable, uuid, varchar, boolean, timestamp, text, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Tenants table
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  apiKey: varchar('api_key', { length: 255 }).notNull().unique(),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }),
  phoneNumber: varchar('phone_number', { length: 50 }),
  locale: varchar('locale', { length: 10 }).notNull().default('en-US'),
  timezone: varchar('timezone', { length: 50 }),
  apnsDeviceToken: text('apns_device_token'),
  fcmDeviceToken: text('fcm_device_token'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  tenantIdIdx: index('idx_users_tenant_id').on(table.tenantId),
  emailIdx: index('idx_users_email').on(table.email),
  phoneNumberIdx: index('idx_users_phone_number').on(table.phoneNumber),
  tenantEmailUnique: uniqueIndex('users_tenant_id_email_key').on(table.tenantId, table.email),
  tenantPhoneUnique: uniqueIndex('users_tenant_id_phone_number_key').on(table.tenantId, table.phoneNumber),
}));

// Notification templates table
export const notificationTemplates = pgTable('notification_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  key: varchar('key', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  channels: jsonb('channels').notNull().default(sql`'[]'`),
  translations: jsonb('translations').notNull().default(sql`'{}'`),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  tenantIdIdx: index('idx_templates_tenant_id').on(table.tenantId),
  keyIdx: index('idx_templates_key').on(table.key),
  tenantKeyUnique: uniqueIndex('notification_templates_tenant_id_key_key').on(table.tenantId, table.key),
}));

// User subscriptions table
export const userSubscriptions = pgTable('user_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  templateKey: varchar('template_key', { length: 255 }).notNull(),
  channels: jsonb('channels').notNull().default(sql`'{}'`),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_subscriptions_user_id').on(table.userId),
  templateKeyIdx: index('idx_subscriptions_template_key').on(table.templateKey),
  userTemplateUnique: uniqueIndex('user_subscriptions_user_id_template_key_key').on(table.userId, table.templateKey),
}));

// Notifications table
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  templateKey: varchar('template_key', { length: 255 }).notNull(),
  channel: varchar('channel', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('PENDING'),
  variables: jsonb('variables'),
  renderedContent: jsonb('rendered_content'),
  error: text('error'),
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  tenantIdIdx: index('idx_notifications_tenant_id').on(table.tenantId),
  userIdIdx: index('idx_notifications_user_id').on(table.userId),
  statusIdx: index('idx_notifications_status').on(table.status),
  createdAtIdx: index('idx_notifications_created_at').on(table.createdAt),
}));
