import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock lucide-react to avoid SVG rendering issues in tests
vi.mock('lucide-react', () => ({
  Bot: () => null,
  User: () => null,
  Send: () => null,
  Paperclip: () => null,
  LogOut: () => null,
  Settings: () => null,
  Plus: () => null,
  Trash2: () => null,
  MessageSquare: () => null,
  ChevronLeft: () => null,
  ChevronRight: () => null,
  X: () => null,
  Check: () => null,
  AlertCircle: () => null,
  Eye: () => null,
  EyeOff: () => null,
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
