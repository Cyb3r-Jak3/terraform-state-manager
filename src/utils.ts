import { GenerateHash } from '@cyb3r-jak3/workers-common';

export const GenerateToken = async (): Promise<{ id: string; token: string }> => {
	const token = crypto.randomUUID();
	return { id: await GenerateHash(token, 'MD5'), token: await GenerateHash(token, 'SHA-256') };
};

export const hashWithSalt = async (password: string, salt = 'ChangeMySalt!'): Promise<string> => {
	return await GenerateHash(password + salt, 'SHA-256');
};
