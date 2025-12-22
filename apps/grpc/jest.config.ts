export default {
  displayName: 'grpc',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/grpc',
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '^@ursly/(.*)$': '<rootDir>/../../libs/$1/src/index.ts',
  },
};
