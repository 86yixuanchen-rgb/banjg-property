CREATE TABLE `repair_requests` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`title` text NOT NULL,
	`address` text NOT NULL,
	`priority` text NOT NULL,
	`board_column` text NOT NULL,
	`status` text NOT NULL,
	`waiting_on` text NOT NULL,
	`next_action` text NOT NULL,
	`waiting` text NOT NULL,
	`last_update` text NOT NULL,
	`sort_order` integer NOT NULL,
	PRIMARY KEY(`user_id`, `id`)
);
