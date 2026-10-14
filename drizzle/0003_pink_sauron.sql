CREATE TABLE `appointments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`request_id` text,
	`title` text NOT NULL,
	`starts_at` integer NOT NULL,
	`location` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`address` text NOT NULL,
	`owner_name` text DEFAULT '' NOT NULL,
	`owner_email` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `request_quotes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`request_id` text NOT NULL,
	`supplier` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL
);
