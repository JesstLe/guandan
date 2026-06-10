import { describe, it, expect } from 'vitest';
import { createAPIRouter } from './routes';

describe('API Routes', () => {
  describe('createAPIRouter', () => {
    it('should create router without errors', () => {
      const router = createAPIRouter();
      expect(router).toBeDefined();
    });
  });
});
