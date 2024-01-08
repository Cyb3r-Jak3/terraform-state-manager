import type { Context } from 'hono';
import { PermissionColumn } from './permissions';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
export type DefinedContext = Context<{ Bindings: Env; Variables: RequestVariables }>;

export type Env = {
	TFSTATE_BUCKET: R2Bucket;
	TFSTATE_LOCK: DurableObjectNamespace;
	TFSTATE_DB: D1Database;
	INIT_ENABLED: boolean;
	INIT_PASSWORD: string?;
	TOKEN_SALT: string?;
};

export type UserInfo = {
	username: string;
	namespaceId?: string;
};

export type RequestVariables = {
	user_id: number;
	user: string;
	permissions: PermissionColumn[];
	auth_type: 'password' | 'token';
	token_id: string;
	db: DrizzleD1Database<Record<string, never>>;
};
