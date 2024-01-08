import { DefinedContext } from './types';
import { drizzle } from 'drizzle-orm/d1';
import { sql } from 'drizzle-orm';
import { hashSync } from 'bcryptjs';
import { users } from './db';
import { HTTPException } from 'hono/http-exception';

export async function InitEndpoint(c: DefinedContext): Promise<Response> {
	if (!c.env.INIT_ENABLED) throw new HTTPException(400, { message: 'Init is not enabled.' });
	if (!c.env.INIT_PASSWORD) throw new HTTPException(400, { message: 'No init password specified.' });

	const db = drizzle(c.env.TFSTATE_DB);
	if ((await db.select({ count: sql<number>`count(*)` }).from(users))[0].count > 0)
		throw new HTTPException(400, { message: 'Already initialized.' });

	const initToken = c.req.header('Authorization')?.match(/^Bearer (.*)$/)?.[1];
	if (!initToken) throw new HTTPException(400, { message: 'No init token specified.' });
	if (initToken !== c.env.INIT_PASSWORD) throw new HTTPException(400, { message: 'Invalid init token.' });

	// @ts-expect-error: See https://github.com/honojs/middleware/issues/154 for more info
	const { username, password } = c.req.valid('json');
	await db.insert(users).values({
		username,
		password: hashSync(password),
		admin: true,
		createdAt: new Date(),
		enabled: true,
	});
	return c.json({ success: true });
}
