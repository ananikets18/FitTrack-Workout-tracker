# Daily Workout Planner

Open **Planner** in the desktop navigation, **More → Daily Planner** on mobile, or the planner card on Home. Today is selected initially. The date strip and date input let you plan or revisit any day; the Wellness calendar also links to each day's plans.

Create a titled workout such as Arms Day. Add exercises from the existing library, enter a custom name, paste one exercise per line, or start from a template / previous workout. Optional pasted headings are Warm-up, Strength, Superset, Cardio, and Cool-down. Repeated exercise names remain independent checklist items, including occurrences within a superset.

Each checkbox is manual and independent of set entry. Expand an item to edit its name, section, tracking type, muscle group, notes, and sets. Strength uses reps and weight, cardio uses minutes (plus treadmill speed/incline), and stretches/holds use seconds. Barbell weight entry uses total kg, converted to the existing per-side storage convention. Changing an exercise's tracking type clears its set details.

Progress saves to a per-account localStorage cache immediately. Pending changes and deletions retry on reconnect and every minute while signed in. Draft caches survive logout and are not shown to another account. A visible status distinguishes device-only saving from cloud sync, and reports storage failures. Device storage can still be lost if browser data is cleared; apply the migration for cloud persistence.

## Database setup

For an existing Supabase project, execute **supabase/migrations/20261119_add_workout_planner.sql** in its SQL Editor. The base workout tables and earlier duration / treadmill migrations must already exist. Fresh installations include the same planner objects in **supabase/schema.sql**. No additional environment variables are needed.

The migration creates a `workout_plans` JSONB table with row-level security and a `save_planned_workout` transaction function. Until it is applied, checklist editing still works locally; cloud sync and Finish & save show a setup message. This repository change does not automatically modify the hosted Supabase database.

## History integration

**Finish & save** writes checked exercises only. Blank set rows are omitted; checklist-only exercises keep an empty set list rather than inventing weights, reps, or training volume. Unchecked items and their targets remain in the plan. Stretches are logged with category `mobility` and duration in seconds; cardio durations stay in minutes.

The database transaction uses the plan's UUID as its workout UUID. Saving again replaces that workout's exercise data atomically, so retries or later edits update one history record. Planner edits after finishing require **Update History** to change the logged result. Deleting a plan preserves an existing history record; deleting the history record allows the plan to be saved again.

For today's workout, Finish & save can take the duration from the existing gym session and ends the timer after a successful save. Past-date plans do not modify today's gym timer. Future plans cannot be finished through the UI.

**Copy to date** creates fresh plan, exercise, and set IDs with unchecked exercises and editable copied targets. **Save template** makes the routine reusable through the existing template system.
