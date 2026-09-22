import { beforeEach, afterEach, vi } from 'vitest';

// Clear localStorage before each test run
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

afterEach(() => {
  localStorage.clear();
});
