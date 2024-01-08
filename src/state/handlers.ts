// All handlers for the remote state backend
import { LockInfo, DefinedContext } from '../types';
import { eq, desc } from 'drizzle-orm';
import { states } from '../db';
import { HTTPException } from 'hono/http-exception';

/**
 * Returns the current remote state from the durable storage. Doesn't support locking
 * GET /states/:projectName
 * https://github.com/hashicorp/terraform/blob/cb340207d8840f3d2bc5dab100a5813d1ea3122b/internal/backend/remote-state/http/client.go#L144
 * @param request
 * @param env
 */
export const getStateHandler = async (c: DefinedContext) => {
	const { projectName } = c.req.param();
	if (!projectName || projectName === '') throw new HTTPException(400, { message: 'No project name specified.' });
	const db = c.get('db');
	const result = await db.select().from(states).where(eq(states.projectName, projectName)).orderBy(desc(states.createdAt)).limit(1);
	if (result.length === 0) return new Response(null, { status: 204 });
	const state: R2ObjectBody | null = await c.env.TFSTATE_BUCKET.get(result[0].state);
	if (state === null) return new Response(null, { status: 204 });
	return new Response(await state?.arrayBuffer(), { headers: { 'content-type': 'application/json' } });
};

/**
 * Updates the remote state in the durable storage. Supports locking.
 * POST /states/:projectName?ID=<lockID>
 * https://github.com/hashicorp/terraform/blob/cb340207d8840f3d2bc5dab100a5813d1ea3122b/internal/backend/remote-state/http/client.go#L203
 * @param request
 * @param env
 */
export const putStateHandler = async (c: DefinedContext) => {
	const { projectName } = c.req.param();
	if (!projectName || projectName === '') throw new HTTPException(400, { message: 'No project name specified.' });

	const id = c.env.TFSTATE_LOCK.idFromName(projectName);
	const lock = c.env.TFSTATE_LOCK.get(id);
	const lockResp = await lock.fetch(`http://lock.do/state/${projectName}/lock`);
	const lockInfo = (await lockResp.json()) as LockInfo;

	// Lock present, ensure the update request has the correct lock ID
	if (lockInfo.ID) {
		const lockId = c.req.query('ID');
		if (lockInfo.ID !== lockId) return Response.json(lockInfo, { status: 423 });
	}
	const stateName = `${projectName}/${crypto.randomUUID()}.tfstate`;

	await c.env.TFSTATE_BUCKET.put(stateName, await c.req.arrayBuffer());
	const db = c.get('db');
	await db.insert(states).values({
		id: crypto.randomUUID(),
		projectName: projectName,
		state: stateName,
		createdAt: new Date(),
		username: c.get('user'),
	});
	return new Response();
};

/**
 * Deletes the remote state in the durable storage.
 * Does not support/honor locking.
 * DELETE /states/:projectName
 * https://github.com/hashicorp/terraform/blob/cb340207d8840f3d2bc5dab100a5813d1ea3122b/internal/backend/remote-state/http/client.go#L241
 * @param request
 * @param env
 */
export const deleteStateHandler = async (c: DefinedContext) => {
	const { projectName } = c.req.param();
	if (!projectName || projectName === '') throw new HTTPException(400, { message: 'No project name specified.' });

	const id = c.env.TFSTATE_LOCK.idFromName(projectName);
	const lock = c.env.TFSTATE_LOCK.get(id);
	const lockResp = await lock.fetch(`http://lock.do/state/${projectName}/lock`);
	const lockInfo = (await lockResp.json()) as LockInfo;

	// Lock present, prevent delete entirely.
	if (lockInfo.ID) return c.json(lockInfo, { status: 423 });
	const db = c.get('db');
	const result = await db.select().from(states).where(eq(states.projectName, projectName)).orderBy(desc(states.createdAt)).limit(1);
	if (result.length === 0) return new Response(null, { status: 204 });
	await db.delete(states).where(eq(states.state, result[0].state));

	await c.env.TFSTATE_BUCKET.delete(result[0].state);
	return new Response();
};

/**
 * Lock or Unlock the remote state for edits.
 * PUT/DELETE /states/:projectName/lock
 * @param request
 */
export const lockStateHandler = async (c: DefinedContext) => {
	const { projectName } = c.req.param();
	if (!projectName || projectName === '') throw new HTTPException(400, { message: 'No project name specified.' });
	const id = c.env.TFSTATE_LOCK.idFromName(projectName);
	const lock = c.env.TFSTATE_LOCK.get(id);
	return lock.fetch(c.req.raw);
};
