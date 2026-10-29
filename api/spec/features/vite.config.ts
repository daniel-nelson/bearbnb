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
    dir: './spec/features',
    globals: true,
    setupFiles: ['luxon-jest-matchers', './spec/features/setup/hooks.js'],
    fileParallelism: false,
    maxConcurrency: 1,
    maxWorkers: 1,
    watch: false,
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    printConsoleTrace: true,
    retry: 2,
    hookTimeout: 20000,
    testTimeout: process.env.HEADLESS === '0' ? 40000 : 20000,

    globalSetup: './spec/features/setup/globalSetup.js',
  },
})
