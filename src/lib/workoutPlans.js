import { supabase } from './supabase';
import { planToWorkout } from '../utils/workoutPlanner';

export const plannerNeedsSetup = (error) => ['42P01', 'PGRST205', 'PGRST202', '42883'].includes(error?.code);

export const workoutPlansDB = {
  async list(userId) {
    const { data, error } = await supabase.from('workout_plans').select('id, payload').eq('user_id', userId).order('date');
    if (error) throw error;
    return (data || []).map((row) => ({ ...row.payload, id: row.id }));
  },
  async put(userId, plan) {
    const { error } = await supabase.from('workout_plans').upsert({ id: plan.id, user_id: userId, date: plan.date, title: plan.title, payload: plan });
    if (error) throw error;
  },
  async remove(userId, id) {
    const { error } = await supabase.from('workout_plans').delete().eq('user_id', userId).eq('id', id);
    if (error) throw error;
  },
  async finish(plan) {
    const { error } = await supabase.rpc('save_planned_workout', {
      p_plan_id: plan.id, p_payload: plan, p_workout: planToWorkout(plan),
    });
    if (error) throw error;
  },
};
