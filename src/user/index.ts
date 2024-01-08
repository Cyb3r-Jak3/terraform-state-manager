import { Hono } from 'hono';
import { Env } from '../types';
import { RequirePermission } from '../middleware';
import { createUserValidator, updateUserValidator, updatePasswordValidator } from '../db';
import { zValidator } from '@hono/zod-validator';
import {
	ListUsersEndpoint,
	GetUserEndpoint,
	CreateUserEndpoint,
	UpdateUserEndpoint,
	ChangePasswordEndpoint,
	DeleteUserEndpoint,
} from './user';
export const userRouter = new Hono<{ Bindings: Env }>();

userRouter.get('/user', RequirePermission('admin:read'), ListUsersEndpoint);
userRouter.get('/user/:username', RequirePermission('admin:read'), GetUserEndpoint);
userRouter.post('/user', zValidator('json', createUserValidator), RequirePermission('admin:write'), CreateUserEndpoint);
userRouter.put('/user/:username', zValidator('json', updateUserValidator), RequirePermission('admin:write'), UpdateUserEndpoint);
userRouter.post(
	'/user/:username/password',
	zValidator('json', updatePasswordValidator),
	RequirePermission('admin:write'),
	ChangePasswordEndpoint,
);
userRouter.delete('/user/:username', RequirePermission('admin:write'), DeleteUserEndpoint);
