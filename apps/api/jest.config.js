export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  moduleNameMapper: {
    '^@aca/(.*)$': '<rootDir>/../../../packages/$1/src',
  },
  testRegex: '.*.spec.ts$',
  transform: {
    '^.+.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    'openai/**/*.service.ts',
    'openai/**/*.controller.ts',
  ],
  coverageDirectory: '../coverage',
  coverageThreshold: {
    'openai/**/*.service.ts': {
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95,
    },
  },
};
