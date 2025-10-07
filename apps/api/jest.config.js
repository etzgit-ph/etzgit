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
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
};
