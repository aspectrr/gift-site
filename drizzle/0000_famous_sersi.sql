CREATE TABLE `favorites` (
	`person_id` integer NOT NULL,
	`category` text NOT NULL,
	`value` text NOT NULL,
	PRIMARY KEY(`person_id`, `category`),
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `gift_ideas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`person_id` integer NOT NULL,
	`year` integer NOT NULL,
	`size` text DEFAULT 'small' NOT NULL,
	`title` text NOT NULL,
	`url` text,
	`note` text,
	`bought_at` integer,
	`bought_by_id` integer,
	`created_by_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `interests` (
	`person_id` integer NOT NULL,
	`year` integer NOT NULL,
	`value` text NOT NULL,
	PRIMARY KEY(`person_id`, `year`),
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `people` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`birthday` text,
	`is_kid` integer DEFAULT false NOT NULL,
	`color` text DEFAULT 'cranberry' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `people_name_unique` ON `people` (`name`);--> statement-breakpoint
CREATE TABLE `reminders_sent` (
	`key` text PRIMARY KEY NOT NULL,
	`sent_at` integer DEFAULT (unixepoch()) NOT NULL
);
