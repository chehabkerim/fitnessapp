import type { RepoCtx } from './context';
import { dataRepo } from './data';
import { exerciseRepo } from './exercises';
import { appStateRepo, settingsRepo } from './settings';
import { templateRepo } from './templates';
import { workoutRepo } from './workouts';

export function createRepos(ctx: RepoCtx) {
  return {
    settings: settingsRepo(ctx),
    appState: appStateRepo(ctx),
    exercises: exerciseRepo(ctx),
    templates: templateRepo(ctx),
    workouts: workoutRepo(ctx),
    data: dataRepo(ctx),
  };
}

export type Repos = ReturnType<typeof createRepos>;
export type { RepoCtx } from './context';
export { ActiveWorkoutExistsError } from './workouts';
export type { WorkoutDetail, WorkoutEntry, HistoryRow, Session, WorkoutSummary, StartOptions } from './workouts';
export type { LibraryGroup, ExerciseInput } from './exercises';
export type { TemplateDetail, TemplateItemInput } from './templates';
export { validateExport, ImportError, EXPORT_FORMAT, EXPORT_VERSION, type ExportFile } from './data';
