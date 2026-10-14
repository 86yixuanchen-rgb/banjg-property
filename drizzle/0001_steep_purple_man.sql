CREATE TABLE `email_messages` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`thread_id` text NOT NULL,
	`from_name` text NOT NULL,
	`from_email` text NOT NULL,
	`subject` text NOT NULL,
	`snippet` text NOT NULL,
	`body` text NOT NULL,
	`received_at` integer NOT NULL,
	`unread` integer NOT NULL,
	PRIMARY KEY(`user_id`, `id`)
);
--> statement-breakpoint
CREATE TABLE `gmail_accounts` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`refresh_token` text NOT NULL,
	`last_sync_at` integer
);
