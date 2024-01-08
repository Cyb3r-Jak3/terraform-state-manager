type Permission = {
	scope: permissionsScope;
	read: boolean;
	write: boolean;
};
export const permissions: Record<permissionsChoice, Permission> = {
	'project:read': { scope: 'project', read: true, write: false },
	'project:write': { scope: 'project', read: true, write: true },
	'user:read': { scope: 'user', read: true, write: false },
	'user:write': { scope: 'user', read: true, write: true },
	'admin:read': { scope: 'admin', read: true, write: true },
	'admin:write': { scope: 'admin', read: true, write: true },
	'*': { scope: 'user', read: true, write: true },
};

export type permissionsChoice = 'project:read' | 'project:write' | 'user:read' | 'user:write' | 'admin:read' | 'admin:write' | '*';
export type permissionsScope = 'project' | 'user' | 'admin' | '*';

export type PermissionColumn = {
	id: permissionsChoice;
	scope: permissionsScope;
};
