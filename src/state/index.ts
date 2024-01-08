import { deleteStateHandler, getStateHandler, lockStateHandler, putStateHandler } from './handlers';
import { Env } from '../types';
import { Hono } from 'hono';
import { RequirePermission } from '../middleware';
export const stateRouter = new Hono<{ Bindings: Env }>();

stateRouter.get('/:projectName', RequirePermission('project:read'), getStateHandler);
stateRouter.post('/:projectName', RequirePermission('project:write'), putStateHandler);
stateRouter.delete('/:projectName', RequirePermission('project:write'), deleteStateHandler);
stateRouter.all('/:projectName/lock', RequirePermission('project:read'), lockStateHandler);
stateRouter.all('*', async (c) => {
	return c.notFound();
});
