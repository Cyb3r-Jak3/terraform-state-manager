import { InitEndpoint } from './api';
import { GetUserEndpoint, ChangePasswordEndpoint } from './user/user';
import { CreateTokenEndpoint, DeleteTokenEndpoint, GetTokenEndpoint, ListTokensEndpoint, UpdateTokenEndpoint } from './token';
import { Env, RequestVariables } from './types';
import { Hono } from 'hono';
import { createTokenValidator, updatePasswordValidator, initValidator } from './db';
import { zValidator } from '@hono/zod-validator';
import { RequirePermission } from './middleware';
export { DurableLock } from './state/durableLock';
import { HTTPException } from 'hono/http-exception';
import { stateRouter } from './state';
import { userRouter } from './user';
import { GetProjectEndpoint, ListProjectsEndpoint } from './projects';

const apiRouter = new Hono<{ Bindings: Env }>();

apiRouter.get('/me', RequirePermission('user:read'), GetUserEndpoint);
apiRouter.post('/me/password', zValidator('json', updatePasswordValidator), RequirePermission('user:write', true), ChangePasswordEndpoint);

apiRouter.get('/token', RequirePermission('user:read'), ListTokensEndpoint);
apiRouter.get('/token/:token_id', RequirePermission('user:read'), GetTokenEndpoint);
apiRouter.post('/token', zValidator('json', createTokenValidator), RequirePermission('user:write'), CreateTokenEndpoint);
apiRouter.put('/token/:token_id', zValidator('json', createTokenValidator), RequirePermission('user:write'), UpdateTokenEndpoint);
apiRouter.delete('/token/:token_id', RequirePermission('user:write'), DeleteTokenEndpoint);

apiRouter.post('/init', zValidator('json', initValidator), InitEndpoint);
apiRouter.get('project', RequirePermission('admin:read'), ListProjectsEndpoint);
apiRouter.get('project/:projectName', RequirePermission('admin:read'), GetProjectEndpoint);

const app = new Hono<{ Bindings: Env; Variables: RequestVariables }>();

app.route('/user', userRouter);
app.route('/state', stateRouter);
app.route('/api', apiRouter);

app.all('*', async (c) => {
	return c.text(c.req.url, 404);
});

app.onError((err, c) => {
	if (err instanceof HTTPException) {
		return c.json({ success: false, message: err.message }, err.status);
	}
	console.error(err);
	return c.json({ success: false, message: 'Internal Server Error', extra: err }, 500);
});

export default {
	fetch: app.fetch,
};
