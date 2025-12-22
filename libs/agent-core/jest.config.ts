export default {
  displayName: 'agent-core',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/libs/agent-core',
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '^@ursly/(.*)$': '<rootDir>/../../libs/$1/src/index.ts',
  },
  transformIgnorePatterns: ['/node_modules/(?!(uuid)/)'],
};
