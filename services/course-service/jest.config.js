module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	moduleNameMapper: {
		'^@proyecto/shared-core/(.*)$': '<rootDir>/../../packages/shared-core/src/$1',
		'^@proyecto/shared-core$': '<rootDir>/../../packages/shared-core/src',
	},
};
