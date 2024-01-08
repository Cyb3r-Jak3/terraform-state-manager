// All Endpoints for user management
import { users, tokens } from '../db';
import { DefinedContext } from '../types';
import { HTTPException } from 'hono/http-exception';
import { hashSync } from 'bcryptjs';
import { eq, SQL } from 'drizzle-orm';

export async function GetUserEndpoint(c: DefinedContext): Promise<Response> {
	const db = c.get('db');
	let whereClause: SQL | undefined = undefined;
	let includeAuthType = false;
	if (c.req.path === '/api/me') {
		const userID = c.get('user_id');
		if (!userID) throw new HTTPException(400, { message: 'No user id specified' });
		whereClause = eq(users.id, userID);
		includeAuthType = true;
	} else if (c.req.path.startsWith('/api/user')) {
		const user = c.req.param('username');
		if (!user) throw new HTTPException(400, { message: 'No username specified' });
		whereClause = eq(users.username, user);
	} else {
		throw new HTTPException(500, { message: 'Should never reach this part' });
	}
	if (!whereClause) throw new HTTPException(500, { message: 'Should never reach this part' });
	const result = await db
		.select({
			id: users.id,
			username: users.username,
			enabled: users.enabled,
			createdAt: users.createdAt,
			admin: users.admin,
		})
		.from(users)
		.where(whereClause);
	if (result.length === 0) throw new HTTPException(404, { message: 'User not found' });
	if (!includeAuthType) return c.json(result[0]);
	return c.json({ ...result[0], auth_type: c.get('auth_type') });
}

export async function CreateUserEndpoint(c: DefinedContext): Promise<Response> {
	// @ts-expect-error: See https://github.com/honojs/middleware/issues/154 for more info
	const { username, password, enabled, admin } = c.req.valid('json');
	const db = c.get('db');
	try {
		await db.insert(users).values({
			username,
			password: hashSync(password),
			enabled,
			createdAt: new Date(),
			admin,
		});
		return c.json({
			username,
		});
	} catch (e: unknown) {
		if (!(e instanceof Error)) {
			throw new HTTPException(500, { message: 'Unknown error: ' + JSON.stringify(e) });
		}
		if (e.message.includes('UNIQUE constraint failed')) {
			throw new HTTPException(400, { message: 'User already exists' });
		}
		return c.text(e.message, 400);
	}
}

export async function ListUsersEndpoint(c: DefinedContext): Promise<Response> {
	const db = c.get('db');
	const query = await db
		.select({
			id: users.id,
			username: users.username,
			enabled: users.enabled,
			createdAt: users.createdAt,
			admin: users.admin,
		})
		.from(users);
	return c.json(query);
}

export async function DeleteUserEndpoint(c: DefinedContext): Promise<Response> {
	const db = c.get('db');
	const username = c.req.param('username');
	if (!username) throw new HTTPException(400, { message: 'No username specified' });
	const userID = await db.select({ id: users.id }).from(users).where(eq(users.username, username));
	if (userID.length === 0) throw new HTTPException(404, { message: 'User not found' });
	const userIDValue = userID[0].id;
	await db.delete(users).where(eq(users.id, userIDValue));
	await db.delete(tokens).where(eq(tokens.userId, userIDValue));
	return c.json({ success: true });
}

export async function UpdateUserEndpoint(c: DefinedContext): Promise<Response> {
	const user = c.req.param('username');
	if (!user) throw new HTTPException(400, { message: 'No username specified' });
	const db = c.get('db');
	// @ts-expect-error: See https://github.com/honojs/middleware/issues/154 for more info
	const { enabled, admin } = c.req.valid('json');
	await db
		.update(users)
		.set({
			enabled: enabled,
			admin: admin,
		})
		.where(eq(users.username, user));
	return c.json({ success: true });
}

export async function ChangePasswordEndpoint(c: DefinedContext): Promise<Response> {
	const db = c.get('db');
	let whereClause: SQL | undefined = undefined;
	if (c.req.path === '/api/me/password') {
		const userID = c.get('user_id');
		if (!userID) throw new HTTPException(400, { message: 'No user id specified' });
		whereClause = eq(users.id, userID);
	} else if (c.req.path.startsWith('/api/user/password')) {
		const user = c.req.param('username');
		if (!user) throw new HTTPException(400, { message: 'No username specified' });
		whereClause = eq(users.username, user);
	} else {
		return c.text('Should never reach this part', 500);
	}
	// @ts-expect-error: See https://github.com/honojs/middleware/issues/154 for more info
	const { password } = c.req.valid('json');
	await db
		.update(users)
		.set({ password: hashSync(password) })
		.where(whereClause);
	return c.json({ success: true });
}
