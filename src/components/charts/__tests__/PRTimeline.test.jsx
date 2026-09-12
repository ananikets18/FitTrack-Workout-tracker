import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import PRTimeline from '../PRTimeline';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('PRTimeline Component', () => {
  let container = null;
  let root = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root.unmount();
      });
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    container = null;
    root = null;
  });

  it('renders without throwing ReferenceError when workouts with PRs are passed', async () => {
    const mockWorkouts = [
      {
        id: '1',
        date: '2026-03-01T10:00:00.000Z',
        type: 'strength',
        exercises: [
          {
            name: 'Bench Press',
            isPR: true,
            sets: [{ weight: 80, reps: 5 }]
          }
        ]
      },
      {
        id: '2',
        date: '2026-03-10T10:00:00.000Z',
        type: 'strength',
        exercises: [
          {
            name: 'Bench Press',
            isPR: true,
            sets: [{ weight: 85, reps: 5 }]
          }
        ]
      }
    ];

    await act(async () => {
      root.render(<PRTimeline workouts={mockWorkouts} />);
    });

    expect(container.innerHTML).toContain('Bench Press');
    expect(container.innerHTML).toContain('Total PRs');
  });

  it('renders empty state when no workouts are provided', async () => {
    await act(async () => {
      root.render(<PRTimeline workouts={[]} />);
    });

    expect(container.innerHTML).toContain('No PRs Yet');
  });
});
