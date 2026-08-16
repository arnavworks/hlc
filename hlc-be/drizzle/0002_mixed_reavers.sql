CREATE TABLE `repair_updates` (
	`id` text PRIMARY KEY NOT NULL,
	`repair_id` text NOT NULL,
	`status` text NOT NULL,
	`title` text NOT NULL,
	`message` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`repair_id`) REFERENCES `repairs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `repair_updates_repair_id_idx` ON `repair_updates` (`repair_id`);--> statement-breakpoint
CREATE INDEX `repair_updates_created_at_idx` ON `repair_updates` (`created_at`);--> statement-breakpoint
CREATE TABLE `repairs` (
	`id` text PRIMARY KEY NOT NULL,
	`tracking_number` text NOT NULL,
	`device_name` text,
	`service` text,
	`location` text,
	`status` text DEFAULT 'received' NOT NULL,
	`status_message` text,
	`received_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`estimated_completion` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `repairs_tracking_number_unique` ON `repairs` (`tracking_number`);--> statement-breakpoint
CREATE INDEX `repairs_status_idx` ON `repairs` (`status`);--> statement-breakpoint
CREATE INDEX `repairs_updated_at_idx` ON `repairs` (`updated_at`);