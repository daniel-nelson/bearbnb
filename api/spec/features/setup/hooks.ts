import '@conf/loadEnv.js'

import * as fs from 'node:fs'
import initializePsychicApp from '@conf/system/initializePsychicApp.js'
import { Dream, DreamApp } from '@rvoh/dream'
import { cleanTestDb, provideDreamViteMatchers } from '@rvoh/dream-spec-helpers'
import { PsychicServer } from '@rvoh/psychic'
import { providePuppeteerViteMatchers, resetBrowserState } from '@rvoh/psychic-spec-helpers'
import getPage from '@spec/features/setup/getPage.js'

provideDreamViteMatchers(Dream)
providePuppeteerViteMatchers()

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
;(global as any).context = describe

let server: PsychicServer

beforeAll(async () => {
  /*
   * initialize psychic
   *
   * provide your application code to psychic for initialization,
   * prior to launching your server.
   */
  await initializePsychicApp()

  /*
   * start api server
   *
   * start your api server, so that your frontend client can drive through
   * it at http://localhost:7778
   */
  server = new PsychicServer()
  await server.start(parseInt(process.env.DEV_SERVER_PORT || '7778'))

  /*
   * Launch a web browser
   *
   * User puppeteer to launch a headless (or not, if you specify HEADLESS=0)
   * browser to drive through your front end client applications.
   */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  if (!(global as any).page) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    ;(global as any).page = await getPage()
  }
})

beforeEach(async () => {
  await cleanTestDb(DreamApp)
})

// CI uploads this directory as an artifact when a feature-spec job fails (see
// .github/workflows/ci.yml).
const SCREENSHOT_DIR = '/tmp/screenshots'

afterEach(async ctx => {
  // Capture the page before resetBrowserState wipes it, so a red spec on CI
  // comes with a picture of what the browser was showing.
  if (ctx.task.result?.state === 'fail') {
    const name = `${ctx.task.file.name}-${ctx.task.name}`.replace(/[^a-zA-Z0-9]+/g, '-')
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
    await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png`, fullPage: true })
  }

  // Reset the shared browser between specs: clears localStorage/cookies for
  // real isolation, and the about:blank navigation releases any pooled DB
  // client held by in-flight requests so server teardown isn't blocked.
  await resetBrowserState()
})

afterAll(async () => {
  await server.stop()
})
