CREATE TABLE `badges_earned` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`badge_id` text NOT NULL,
	`earned_at` integer NOT NULL,
	`workout_id` integer,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `badges_earned_badge_id_unique` ON `badges_earned` (`badge_id`);--> statement-breakpoint
ALTER TABLE `app_state` ADD `badges_version` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `app_state` ADD `badges_notice` integer;--> statement-breakpoint
ALTER TABLE `workout_exercises` ADD `planned_sets` integer;--> statement-breakpoint
ALTER TABLE `workouts` ADD `planned_sets` integer;