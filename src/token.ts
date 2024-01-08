// All Endpoints for token management
import { tokens, users } from './db';
import { GenerateToken, hashWithSalt } from './utils';
import { eq } from 'drizzle-orm';
import { DefinedContext } from './types';
import { HTTPException } from 'hono/http-exception';

export async function CreateTokenEndpoint(c: DefinedContext): Promise<Response> {
	// @ts-expect-error: See https://github.com/honojs/middleware/issues/154 for more info
	const { description, expiresAt, permissions } = c.req.valid('json');
	const userID = c.get('user_id');
	const db = c.get('db');

	const userQuery = await db.select({ admin: users.admin }).from(users).where(eq(users.id, userID));
	// @ts-expect-error: See https://github.com/honojs/middleware/issues/154 for more info
	for (const permission of permissions) {
		if (permission.id.includes('admin') && !userQuery[0].admin) throw new HTTPException(400, { message: 'Unable to create admin token' });
	}

	const { id, token } = await GenerateToken();
	await db.insert(tokens).values({
		id: id,
		token: await hashWithSalt(token, c.env.TOKEN_SALT ?? 'ChangeMySalt!'),
		description: description,
		userId: userID,
		expiresAt,
		permissions,
		createdAt: new Date(),
		version: 1,
	});
	return c.json({ id, description, expiresAt, permissions, token: token });
}

export async function ListTokensEndpoint(c: DefinedContext): Promise<Response> {
	const db = c.get('db');
	const query = await db
		.select({
			id: tokens.id,
			description: tokens.description,
			createdAt: tokens.createdAt,
			expiresAt: tokens.expiresAt,
			permissions: tokens.permissions,
		})
		.from(tokens)
		.where(eq(tokens.userId, c.get('user_id')));
	return c.json(query);
}

export async function GetTokenEndpoint(c: DefinedContext): Promise<Response> {
	const db = c.get('db');
	const tokenID = c.get('token_id');
	if (!tokenID) throw new HTTPException(400, { message: 'No token id specified' });
	const result = await db
		.select({
			id: tokens.id,
			description: tokens.description,
			createdAt: tokens.createdAt,
			expiresAt: tokens.expiresAt,
			permissions: tokens.permissions,
		})
		.from(tokens)
		.where(eq(tokens.token, tokenID));
	return c.json(result);
}

export async function UpdateTokenEndpoint(c: DefinedContext): Promise<Response> {
	const tokenID = c.get('token_id');
	const db = c.get('db');

	if (!tokenID) throw new HTTPException(400, { message: 'No token id specified' });
	// @ts-expect-error: See https://github.com/honojs/middleware/issues/154 for more info
	const { description, expiresAt, permissions } = c.req.valid('json');
	await db
		.update(tokens)
		.set({
			description: description,
			expiresAt: expiresAt,
			permissions: permissions,
		})
		.where(eq(tokens.id, tokenID));
	return c.json({ description, expiresAt, permissions });
}

export async function DeleteTokenEndpoint(c: DefinedContext): Promise<Response> {
	const tokenID = c.get('token_id');
	if (!tokenID) throw new HTTPException(400, { message: 'No token id specified' });
	const db = c.get('db');
	await db.delete(tokens).where(eq(tokens.id, tokenID));
	return c.json({ success: true });
}
