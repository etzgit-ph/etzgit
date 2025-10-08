import { Injectable } from '@nestjs/common';

@Injectable()
export class DiagnosticsService {
  // Return a mock list of failing test file paths
  getFailingTests(): string[] {
    return ['apps/api/src/some-test.spec.ts', 'apps/web/src/components/Widget.test.tsx'];
  }

  getMonorepoDependencies(): string[] {
    return ['next', 'nestjs', 'prisma', 'openai'];
  }
}
