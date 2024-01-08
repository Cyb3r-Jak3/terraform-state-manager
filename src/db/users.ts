import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { createInsertSchema } from 'drizzle-zod';
import { PermissionColumn } from '../types/permissions';
export const users = sqliteTable(
	'users',
	{
		id: integer('id').primaryKey().notNull(),
		username: text('username').notNull().unique(),
		password: text('password').notNull(),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull(),
		enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
		admin: integer('admin', { mode: 'boolean' }).notNull().default(false),
	},
	(table) => {
		return {
			usernameIDX: index('username_idx').on(table.username),
		};
	},
);

export const createUserValidator = createInsertSchema(users).pick({ username: true, password: true, enabled: true, admin: true });
export const initValidator = createInsertSchema(users).pick({ username: true, password: true });
export const updateUserValidator = createInsertSchema(users).pick({ enabled: true, admin: true });
export const updatePasswordValidator = createInsertSchema(users).pick({ password: true });

export const tokens = sqliteTable(
	'tokens',
	{
		id: text('id').primaryKey().notNull(),
		token: text('token').notNull(),
		description: text('description'),
		userId: integer('userId')
			.notNull()
			.references(() => users.id),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull(),
		expiresAt: integer('expiresAt', { mode: 'timestamp_ms' }),
		permissions: text('permissions', { mode: 'json' }).notNull().$type<PermissionColumn[]>(),
		version: integer('version').notNull().default(1),
	},
	(table) => {
		return {
			tokenIdIDX: index('token_idx').on(table.id),
			userIdIDX: index('userId_idx').on(table.userId),
		};
	},
);

export const createTokenValidator = createInsertSchema(tokens).pick({ description: true, expiresAt: true, permissions: true });
