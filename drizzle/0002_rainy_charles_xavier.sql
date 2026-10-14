CREATE TABLE `request_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`request_id` text NOT NULL,
	`at` integer NOT NULL,
	`kind` text NOT NULL,
	`text` text NOT NULL,
	`actor` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `request_participants` (
	`user_id` text NOT NULL,
	`request_id` text NOT NULL,
	`role` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	PRIMARY KEY(`user_id`, `request_id`, `email`)
);
--> statement-breakpoint
ALTER TABLE `email_messages` ADD `to_emails` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `email_messages` ADD `request_id` text;--> statement-breakpoint
ALTER TABLE `repair_requests` ADD `ai_summary` text;--> statement-breakpoint
ALTER TABLE `repair_requests` ADD `ai_next_step` text;--> statement-breakpoint
ALTER TABLE `repair_requests` ADD `ai_column` text;--> statement-breakpoint
ALTER TABLE `repair_requests` ADD `ai_waiting_on` text;--> statement-breakpoint
ALTER TABLE `repair_requests` ADD `ai_updated_at` integer;