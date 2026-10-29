import adminRoutes from '#conf/routes.admin.js'
import internalRoutes from '#conf/routes.internal.js'
import StatusController from '#controllers/StatusController.js'
import VisitorV1MeController from '#controllers/Visitor/V1/MeController.js'
import VisitorV1SignUpController from '#controllers/Visitor/V1/SignUpController.js'
import VisitorV1PlacesController from '#controllers/Visitor/V1/PlacesController.js'
import { PsychicRouter } from '@rvoh/psychic'

export default function routes(r: PsychicRouter) {
  r.get('status', StatusController, 'show')

  r.namespace('v1', r => {
    r.get('me', VisitorV1MeController, 'show')
    r.post('sign-up', VisitorV1SignUpController, 'create')

    // Visitor/V1 controllers are maybe-authed, so they sit outside the authed V1/ controller tree
    // and are routed here with an explicit controller to keep "visitor" out of the URL
    r.resources('places', { only: ['index', 'show'], controller: VisitorV1PlacesController })

    r.namespace('host', r => {
      r.resources('localized-texts', { only: ['update', 'destroy'] })

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
