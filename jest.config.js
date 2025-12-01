
export default {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\.tsx?$': 'ts-jest',
    '^.+\.jsx?$': 'babel-jest',
  },
  moduleNameMapper: {
    '\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
};
