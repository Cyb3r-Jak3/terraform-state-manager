import type { DefinedContext } from './types';
import { states } from './db/states';
import { HTTPException } from 'hono/http-exception';
import { eq } from 'drizzle-orm';

export async function ListProjectsEndpoint(c: DefinedContext) {
	const db = c.get('db');
	const results = await db.selectDistinct({ projectName: states.projectName }).from(states);
	return c.json(results.map((r) => r.projectName));
}

export async function GetProjectEndpoint(c: DefinedContext) {
	const db = c.get('db');
	const { projectName } = c.req.param();
	if (!projectName) throw new HTTPException(400, { message: 'No project name specified' });
	const results = await db.select().from(states).where(eq(states.projectName, projectName));
	return c.json({ states: results });
}
