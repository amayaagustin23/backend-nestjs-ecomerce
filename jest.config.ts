import { pathsToModuleNameMapper } from 'ts-jest';
import tsconfig from './tsconfig.json';
const { compilerOptions } = tsconfig;

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths || {}, {
    prefix: '<rootDir>/',
  }),
  rootDir: '.',
  testMatch: ['**/?(*.)+(spec|test).ts'],
};
