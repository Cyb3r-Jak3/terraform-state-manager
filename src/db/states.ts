import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const states = sqliteTable(
	'states',
	{
		id: text('id').primaryKey().notNull(),
		projectName: text('projectName').notNull(),
		state: text('state').notNull(),
		username: text('username').notNull(),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull(),
	},
	(table) => {
		return {
			projectIDX: index('projectName_idx').on(table.projectName),
		};
	},
);
