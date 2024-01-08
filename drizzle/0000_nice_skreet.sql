CREATE TABLE `states` (
	`id` text PRIMARY KEY NOT NULL,
	`projectName` text NOT NULL,
	`state` text NOT NULL,
	`username` text NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`description` text,
	`userId` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`expiresAt` integer,
	`permissions` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`createdAt` integer NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`admin` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX `projectName_idx` ON `states` (`projectName`);--> statement-breakpoint
CREATE INDEX `token_idx` ON `tokens` (`id`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `tokens` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `username_idx` ON `users` (`username`);