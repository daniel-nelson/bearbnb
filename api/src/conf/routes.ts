import adminRoutes from '#conf/routes.admin.js'
import internalRoutes from '#conf/routes.internal.js'
import { PsychicRouter } from '@rvoh/psychic'

export default function routes(r: PsychicRouter) {
  r.namespace('v1', r => {
    r.namespace('host', r => {
      r.resources('places', r => {
        r.resources('rooms')

      })
    })
  })

  // Health check for the web server. Orchestrators / load balancers probe this
  // for liveness. It is already excluded from request logging via
  // `ignoredRoutes: ['/health_check']` in conf/app.ts. Uncomment and adjust the
  // path/body to what your infra expects, and keep it in sync with the websocket
  // server's health check (conf/initializers/websockets.ts):
  //
  // r.get('health_check', ctx => {
  //   ctx.status = 200
  //   ctx.body = { ok: true }
  // })

  adminRoutes(r)
  internalRoutes(r)
  // add routes here, perhaps by running `pnpm psy g:resource v1/pets Pet name:citext birthdate:date species:enum:pet_species:dog,cat,fish`
}
