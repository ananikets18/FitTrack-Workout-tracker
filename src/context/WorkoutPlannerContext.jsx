import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { workoutPlansDB, plannerNeedsSetup } from '../lib/workoutPlans';
import { PLANNER_STORAGE_PREFIX, readPlannerStore, mergeRemotePlans, revisePlan } from '../utils/workoutPlanner';
import { getLocalDateInputValue } from '../utils/date';

const PlannerContext = createContext(null);

function UserPlannerProvider({ userId, children }) {
  const [store, setStore] = useState(() => readPlannerStore(userId));
  const storeRef = useRef(store);
  const [syncStatus, setSyncStatus] = useState('loading');
  const [storageError, setStorageError] = useState(false);
  const busy = useRef(false);
  const alive = useRef(true);

  const commit = useCallback((next) => {
    if (!alive.current) return;
    storeRef.current = next;
    try {
      localStorage.setItem(`${PLANNER_STORAGE_PREFIX}${userId}`, JSON.stringify(next));
      setStorageError(false);
    } catch { setStorageError(true); }
    setStore(next);
  }, [userId]);

  const sync = useCallback(async () => {
    if (busy.current || !alive.current) return;
    if (!navigator.onLine) { setSyncStatus('offline'); return; }
    busy.current = true;
    setSyncStatus('saving');
    try {
      // Read first so a missing table never discards cached plans.
      const remote = await workoutPlansDB.list(userId);
      if (!alive.current) return;
      commit(mergeRemotePlans(storeRef.current, remote));
      for (const id of Object.keys(storeRef.current.deleted)) {
        await workoutPlansDB.remove(userId, id);
        if (!alive.current) return;
        const next = { ...storeRef.current, deleted: { ...storeRef.current.deleted } };
        delete next.deleted[id];
        commit(next);
      }
      for (const id of Object.keys(storeRef.current.pending)) {
        const plan = storeRef.current.plans.find((item) => item.id === id);
        if (!plan) continue;
        await workoutPlansDB.put(userId, plan);
        if (!alive.current) return;
        // Don't acknowledge edits made while this version was in flight.
        if (storeRef.current.pending[id] === plan.revision) {
          const next = { ...storeRef.current, pending: { ...storeRef.current.pending } };
          delete next.pending[id];
          commit(next);
        }
      }
      if (alive.current) setSyncStatus(Object.keys(storeRef.current.pending).length ? 'pending' : 'synced');
    } catch (error) {
      if (alive.current) setSyncStatus(plannerNeedsSetup(error) ? 'setup' : 'offline');
    } finally { busy.current = false; }
  }, [commit, userId]);

  useEffect(() => {
    alive.current = true;
    const timer = setTimeout(sync, 0);
    const interval = setInterval(sync, 60_000);
    const offline = () => setSyncStatus('offline');
    window.addEventListener('online', sync);
    window.addEventListener('offline', offline);
    return () => {
      alive.current = false;
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', offline);
    };
  }, [sync]);

  useEffect(() => {
    if (!Object.keys(store.pending).length && !Object.keys(store.deleted).length) return;
    if (['loading', 'saving', 'setup', 'offline'].includes(syncStatus)) return;
    const timer = setTimeout(sync, 900);
    return () => clearTimeout(timer);
  }, [store, sync, syncStatus]);

  const putPlan = (plan) => {
    const current = storeRef.current;
    commit({ ...current, plans: [...current.plans.filter((item) => item.id !== plan.id), plan], pending: { ...current.pending, [plan.id]: plan.revision } });
    if (syncStatus === 'synced') setSyncStatus('pending');
    return plan;
  };
  const updatePlan = (id, changes) => {
    const plan = storeRef.current.plans.find((item) => item.id === id);
    if (plan) return putPlan(revisePlan(plan, changes));
  };
  const deletePlan = (id) => {
    const current = storeRef.current;
    const pending = { ...current.pending };
    delete pending[id];
    commit({ ...current, plans: current.plans.filter((plan) => plan.id !== id), pending, deleted: { ...current.deleted, [id]: true } });
    if (syncStatus === 'synced') setSyncStatus('pending');
  };
  const finishPlan = async (id) => {
    // Serialize with an in-flight autosave to prevent an older payload replacing completion.
    const deadline = Date.now() + 15_000;
    while (busy.current && alive.current && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 50));
    if (!alive.current) throw new Error('The planner was closed before saving.');
    if (busy.current) throw new Error('Sync is taking longer than expected. Please try again.');
    const plan = storeRef.current.plans.find((item) => item.id === id);
    if (!plan?.exercises.some((exercise) => exercise.completed)) throw new Error('Check at least one completed exercise first.');
    if (plan.date > getLocalDateInputValue()) throw new Error('Choose today or a past date to save a finished workout.');
    busy.current = true;
    try {
      const saved = { ...plan, loggedAt: new Date().toISOString(), savedRevision: plan.revision };
      await workoutPlansDB.finish(saved);
      if (!alive.current) return;
      // UI is locked while finishing. Keep a newer local edit if one still occurred.
      const latest = storeRef.current.plans.find((item) => item.id === id);
      if (latest?.revision === plan.revision) {
        const next = { ...storeRef.current, plans: storeRef.current.plans.map((item) => item.id === id ? saved : item), pending: { ...storeRef.current.pending } };
        delete next.pending[id];
        commit(next);
      }
      setSyncStatus('synced');
    } catch (error) {
      if (plannerNeedsSetup(error)) { setSyncStatus('setup'); throw new Error('Cloud setup is needed to save to History. Your checklist is saved on this device.'); }
      throw error;
    } finally { busy.current = false; }
  };

  return <PlannerContext.Provider value={{ plans: store.plans, syncStatus, storageError, putPlan, updatePlan, deletePlan, finishPlan, retrySync: sync }}>{children}</PlannerContext.Provider>;
}

export function WorkoutPlannerProvider({ children }) {
  const { user } = useAuth();
  return <UserPlannerProvider key={user.id} userId={user.id}>{children}</UserPlannerProvider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useWorkoutPlanner = () => {
  const context = useContext(PlannerContext);
  if (!context) throw new Error('useWorkoutPlanner requires WorkoutPlannerProvider');
  return context;
};
