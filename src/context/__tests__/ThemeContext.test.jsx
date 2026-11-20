import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider, useTheme } from '../ThemeContext';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>{theme}</button>;
}

describe('theme preferences', () => {
  let container;
  let root;
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    document.documentElement.className = '';
  });
  it('restores a saved theme and persists toggles', () => {
    localStorage.setItem('theme', 'dark');
    act(() => root.render(<ThemeProvider><ThemeSwitch /></ThemeProvider>));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    act(() => container.querySelector('button').click());
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('light');
  });
  it('uses the system preference when a saved value is invalid', () => {
    localStorage.setItem('theme', 'invalid');
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
    act(() => root.render(<ThemeProvider><ThemeSwitch /></ThemeProvider>));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    vi.unstubAllGlobals();
  });
  it('still switches themes when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    act(() => root.render(<ThemeProvider><ThemeSwitch /></ThemeProvider>));
    const before = container.textContent;
    act(() => container.querySelector('button').click());
    expect(container.textContent).not.toBe(before);
  });
});
