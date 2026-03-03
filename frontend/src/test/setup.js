import '@testing-library/jest-dom';
import { vi } from 'vitest';

// MUI's useMediaQuery relies on window.matchMedia which is absent in jsdom.
// Default all media queries to "not matching" (desktop layout).
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches:            false,
    media:              query,
    onchange:           null,
    addListener:        vi.fn(),
    removeListener:     vi.fn(),
    addEventListener:   vi.fn(),
    removeEventListener:vi.fn(),
    dispatchEvent:      vi.fn(),
  })),
});
