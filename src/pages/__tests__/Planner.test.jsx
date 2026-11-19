import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import Planner from '../Planner';
import { WorkoutPlannerProvider } from '../../context/WorkoutPlannerContext';
import { getLocalDateInputValue } from '../../utils/date';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const mock = vi.hoisted(() => ({
  remote: new Map(), workouts: [], setup: false,
  list: vi.fn(), put: vi.fn(), remove: vi.fn(), finish: vi.fn(),
}));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'planner-test-user' } }) }));
vi.mock('../../context/WorkoutContext', () => ({ useWorkouts: () => ({ workouts: mock.workouts, refreshWorkouts: async () => {} }) }));
vi.mock('../../context/TemplateContext', () => ({ useTemplates: () => ({ templates: [], saveTemplate: vi.fn() }) }));
vi.mock('../../hooks/useGymSession', () => ({ useGymSession: () => ({ isActive: false, isCompleted: false, markSessionWorkoutLogged: vi.fn() }) }));
vi.mock('../../lib/workoutPlans', () => ({ workoutPlansDB: { list: (...args) => mock.list(...args), put: (...args) => mock.put(...args), remove: (...args) => mock.remove(...args), finish: (...args) => mock.finish(...args) }, plannerNeedsSetup: (error) => error?.code === '42P01' }));

let container, root;
const settle = async () => { await act(async () => { await new Promise((resolve) => setTimeout(resolve, 25)); }); };
const click = async (element) => { expect(element).toBeTruthy(); await act(async () => element.click()); };
const button = (text) => [...container.querySelectorAll('button')].find((node) => node.textContent.trim() === text);
const fill = async (element, value) => {
  expect(element).toBeTruthy();
  await act(async () => {
    const proto = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
};
const mount = async () => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => root.render(<MemoryRouter><WorkoutPlannerProvider><Planner /></WorkoutPlannerProvider></MemoryRouter>));
  await settle();
};
const unmount = async () => { if (root) { await act(async () => root.unmount()); root = null; container.remove(); } };

beforeEach(() => {
  localStorage.clear(); mock.remote.clear(); mock.workouts.length = 0; mock.setup = false;
  mock.list.mockReset().mockImplementation(async () => { if (mock.setup) throw { code: '42P01' }; return [...mock.remote.values()]; });
  mock.put.mockReset().mockImplementation(async (_user, plan) => { mock.remote.set(plan.id, structuredClone(plan)); });
  mock.remove.mockReset().mockImplementation(async (_user, id) => mock.remote.delete(id));
  mock.finish.mockReset().mockImplementation(async (plan) => {
    mock.remote.set(plan.id, structuredClone(plan));
    if (!mock.workouts.some((workout) => workout.id === plan.id)) mock.workouts.push({ id: plan.id, date: `${plan.date}T12:00:00`, exercises: [] });
  });
});
afterEach(unmount);

describe('Planner user flow', () => {
  it('creates Arms Day, pastes a routine, logs sets, checks exercises, and updates one history entry', async () => {
    await mount();
    expect(container.querySelector('[aria-label="Planner date"]').value).toBe(getLocalDateInputValue());
    await click(button('Plan workout'));
    await fill(container.querySelector('input[placeholder="Arms Day"]'), 'Arms Day');
    await act(async () => container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await click(button('Paste a list'));
    await fill(container.querySelector('textarea[placeholder^="Standing"]'), 'Standing Dumbbell Bicep Curl\nSuperset\nRope Hammer Curl\nRope Triceps Pushdown\nCool-down\nBiceps Stretch');
    await click(button('Add 4 exercises'));
    await click(button('Done · 4 added'));
    await click([...container.querySelectorAll('button[aria-expanded]')].find((node) => node.textContent.includes('Standing Dumbbell')));
    await click(button('Add set'));
    await fill(container.querySelector('[aria-label="Reps"]'), '12');
    await fill(container.querySelector('[aria-label="Weight (kg)"]'), '10');
    await click(container.querySelector('[aria-label="Complete Standing Dumbbell Bicep Curl"]'));
    expect(container.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('25');
    await click(button('Finish & save'));
    expect(mock.finish).toHaveBeenCalledTimes(1);
    const first = mock.finish.mock.calls[0][0];
    expect(first.exercises[0]).toMatchObject({ completed: true, sets: [{ reps: 12, weight: 10 }] });
    expect(first.exercises[1].completed).toBe(false);
    await click(container.querySelector('[aria-label="Complete Rope Hammer Curl"]'));
    await click(button('Update History'));
    expect(mock.finish).toHaveBeenCalledTimes(2);
    expect(mock.finish.mock.calls[1][0].id).toBe(first.id);
    expect(mock.workouts).toHaveLength(1);
    await unmount();
    await mount();
    expect(container.querySelector('[aria-label="Workout title"]').value).toBe('Arms Day');
    expect(container.querySelector('[aria-label="Complete Rope Hammer Curl"]').checked).toBe(true);
  });

  it('keeps local drafts usable when the cloud migration is missing', async () => {
    mock.setup = true;
    await mount();
    expect(container.textContent).toContain('cloud setup needed');
    await click(button('Plan workout'));
    await fill(container.querySelector('input[placeholder="Arms Day"]'), 'Offline Arms Day');
    await act(async () => container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await click(button('Paste a list'));
    await fill(container.querySelector('textarea[placeholder^="Standing"]'), 'Biceps Stretch');
    await click(button('Add 1 exercise'));
    await click(button('Done · 1 added'));
    await click(container.querySelector('[aria-label="Complete Biceps Stretch"]'));
    await unmount();
    await mount();
    expect(container.querySelector('[aria-label="Workout title"]').value).toBe('Offline Arms Day');
    expect(container.querySelector('[aria-label="Complete Biceps Stretch"]').checked).toBe(true);
    expect(mock.put).not.toHaveBeenCalled();
  });
});
