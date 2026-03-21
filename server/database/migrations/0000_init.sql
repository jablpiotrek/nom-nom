CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`sex` text NOT NULL,
	`pin_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `names` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sex` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `swipes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`game_id` text NOT NULL,
	`name_id` integer NOT NULL,
	`parent` text NOT NULL,
	`action` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`name_id`) REFERENCES `names`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_swipe` ON `swipes` (`game_id`,`name_id`,`parent`);