import type { MiddlewareHandler, HonoRequest } from 'hono';
import { DecodeBase64 } from '@cyb3r-jak3/workers-common';
import { drizzle } from 'drizzle-orm/d1';
import { users, tokens } from './db';
import { eq, and } from 'drizzle-orm';
import { permissionsChoice, DefinedContext } from './types/';
import { compareSync } from 'bcryptjs';
import { HTTPException } from 'hono/http-exception';
import { hashWithSalt } from './utils';

export const RequirePermission = (permission: permissionsChoice, requirePassword = false): MiddlewareHandler => {
	return async (c: DefinedContext, next) => {
		const requestUser = auth(c.req);
		if (requestUser) {
			const db = drizzle(c.env.TFSTATE_DB);
			c.set('db', db);
			const user = await db.select().from(users).where(eq(users.username, requestUser.username));
			if (user.length === 0) throw new HTTPException(401, { message: 'Invalid login' });
			const userInfo = user[0];
			if (!userInfo.enabled) throw new HTTPException(403, { message: `User is disabled` });
			if (!userInfo.admin && permission.includes('admin')) throw new HTTPException(403, { message: 'Invalid Permissions' });
			if (!compareSync(requestUser.password, userInfo.password)) {
				if (requirePassword) {
					throw new HTTPException(403, { message: 'Invalid Permissions. Endpoint requires use of password and not API token' });
				}
				const tokenQuery = await db
					.select()
					.from(tokens)
					.where(
						and(
							eq(tokens.userId, userInfo.id),
							eq(tokens.token, await hashWithSalt(requestUser.password, c.env.TOKEN_SALT ?? 'ChangeMySalt!')),
						),
					);
				if (tokenQuery.length === 0) throw new HTTPException(401, { message: 'Invalid login' });
				const token = tokenQuery[0];

				if (token.expiresAt && token.expiresAt < new Date()) {
					throw new HTTPException(401, { message: 'Token expired' });
				}
				if (!token.permissions.find((p) => p.id === permission || p.id === '*')) {
					throw new HTTPException(403, { message: 'Invalid Permissions' });
				}
				c.set('user_id', userInfo.id);
				c.set('user', userInfo.username);
				c.set('permissions', token.permissions);
				c.set('auth_type', 'token');
				c.set('token_id', token.id);
				await next();
				return;
			} else {
				c.set('user_id', userInfo.id);
				c.set('user', userInfo.username);
				c.set('permissions', [{ id: '*', scope: '*' }]);
				c.set('auth_type', 'password');
				await next();
				return;
			}
		}
		return new Response('Unauthorized', {
			status: 401,
			headers: {
				'WWW-Authenticate': 'Basic realm="Terraform State Manager"',
			},
		});
	};
};

// Copied from: https://github.com/honojs/hono/blob/b6c0e45d5f141f00578191f912d755230936eda2/src/middleware/basic-auth/index.ts

const CREDENTIALS_REGEXP = /^ *(?:[Bb][Aa][Ss][Ii][Cc]) +([A-Za-z0-9._~+/-]+=*) *$/;
const USER_PASS_REGEXP = /^([^:]*):(.*)$/;

export const auth = (req: HonoRequest) => {
	const match = CREDENTIALS_REGEXP.exec(req.header('Authorization') || '');
	if (!match) {
		return undefined;
	}
	const utf8Decoder = new TextDecoder();

	let userPass = undefined;
	// If an invalid string is passed to atob(), it throws a `DOMException`.
	try {
		userPass = USER_PASS_REGEXP.exec(utf8Decoder.decode(DecodeBase64(match[1])));
	} catch {
		return undefined;
	} // Do nothing

	if (!userPass) {
		return undefined;
	}

	return { username: userPass[1], password: userPass[2] };
};
