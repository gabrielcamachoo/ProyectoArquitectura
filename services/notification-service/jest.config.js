module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	moduleNameMapper: {
		'^@proyecto/shared-core$': '<rootDir>/../../packages/shared-core/src',
		'^@proyecto/shared-core/(.*)$': '<rootDir>/../../packages/shared-core/src/$1',
	}
};
