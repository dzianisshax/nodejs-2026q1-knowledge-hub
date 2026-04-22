import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.unit.spec.ts', 'src/__tests__/unit/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts',
        'src/**/*.module.ts',
        'src/**/*.dto.ts',
        'src/**/*.entity.ts',
        'src/**/*.filter.ts',
        'src/**/*.factory.ts',
        'src/**/*.interface.ts',
        'src/**/*.controller.ts',
        'src/**/*.repository.ts',
        'src/**/*.interceptor.ts',
        'src/config/**',
        'src/utils/**',
        'src/common/errors',
        'auth/decorators',
        'src/auth/strategies',
        'src/prisma/**',
        'generated/**',
      ],
      thresholds: {
        lines: 90,
        branches: 85,
      },
    },
  },
});
