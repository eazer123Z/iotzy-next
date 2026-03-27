import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global mocks untuk Prisma dan HTTP Cookies (Bawaan Next.js App Router)
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));
