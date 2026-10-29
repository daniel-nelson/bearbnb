import '../../src/conf/loadEnv.js'

import babel, { defineRolldownBabelPreset } from '@rolldown/plugin-babel'
import { defineConfig, type ViteUserConfig } from 'vitest/config'

const decorators = defineRolldownBabelPreset({
  preset: () => ({
    plugins: [['@babel/plugin-proposal-decorators', { version: '2023-11' }]],
  }),
  rolldown: { filter: { code: '@' } },
})

const babelOptions = { presets: [decorators] } as Parameters<typeof babel>[0]
const babelPlugin = (await babel(babelOptions)) as unknown as NonNullable<ViteUserConfig['plugins']>[number]

export default defineConfig({
  plugins: [babelPlugin],
  test: {
    dir: './spec/unit',
    globals: true,
    setupFiles: ['luxon-jest-matchers', './spec/unit/setup/hooks.js'],
    fileParallelism: true,
    maxConcurrency: parseInt(process.env.DREAM_PARALLEL_TESTS || '1'),
    maxWorkers: parseInt(process.env.DREAM_PARALLEL_TESTS || '1'),
    watch: false,
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    printConsoleTrace: true,
    hookTimeout: 20000,
    testTimeout: 20000,

    globalSetup: './spec/unit/setup/globalSetup.js',
  },
})
