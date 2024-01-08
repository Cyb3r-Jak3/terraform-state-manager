import { Hono, Context } from 'hono';
import { Env, LockInfo } from '../types';

export class DurableLock {
	private state: DurableObjectState;
	private lockInfo: LockInfo | null;
	app = new Hono<{ Bindings: Env }>();

	constructor(state: DurableObjectState) {
		this.state = state;
		this.lockInfo = null;
		this.state.blockConcurrencyWhile(async () => {
			this.lockInfo = (await this.state.storage.get('_lock')) || null;
		});
		this.app.get('/state/:projectName/lock', this.currentLockInfo.bind(this));

		// Lock
		this.app.put('/state/:projectName/lock', this.lock.bind(this));
		this.app.on('LOCK', '/state/:projectName/lock', this.lock.bind(this));

		// Unlock
		this.app.delete('/state/:projectName/lock', this.unlock.bind(this));
		this.app.on('UNLOCK', '/state/:projectName/lock', this.unlock.bind(this));
		this.app.on('PURGE', '/state/:projectName', this.purge.bind(this));

		this.app.all('*', async (c) => {
			return c.text(c.req.url, 404);
		});
	}

	async fetch(request: Request): Promise<Response> {
		return this.app.fetch(request);
	}

	private async lock(c: Context): Promise<Response> {
		if (this.lockInfo !== null) return c.json(this.lockInfo, { status: 423 });
		const lockInfo = (await c.req.json()) as LockInfo;
		await this.state.storage.put('_lock', lockInfo);
		this.lockInfo = lockInfo;
		return new Response();
	}

	private async unlock(c: Context): Promise<Response> {
		const lockInfo = (await c.req.json()) as LockInfo;
		if (!lockInfo.ID) return new Response('Missing ID for unlock state request', { status: 400 });
		if (this.lockInfo?.ID !== lockInfo.ID) return Response.json(this.lockInfo, { status: 423 });
		await this.state.storage.delete('_lock');
		this.lockInfo = null;
		return new Response();
	}

	private async currentLockInfo(c: Context): Promise<Response> {
		return c.json(this.lockInfo || {});
	}

	private async purge(c: Context): Promise<Response> {
		this.state.storage.deleteAll();
		this.lockInfo = null;
		return c.json({ success: true });
	}
}
