import adminRoutes from '@conf/routes.admin.js'
import internalRoutes from '@conf/routes.internal.js'
import StatusController from '@controllers/StatusController.js'
import V1MeController from '@controllers/V1/MeController.js'
import V1SignUpController from '@controllers/V1/SignUpController.js'
import VisitorPlacesController from '@controllers/Visitor/PlacesController.js'
import { PsychicRouter } from '@rvoh/psychic'

export default function routes(r: PsychicRouter) {
  r.get('status', StatusController, 'show')

  r.namespace('v1', r => {
    r.namespace('guest', r => {
      r.resources('favorites', { only: ['index', 'create', 'destroy'] })
    })

    r.get('me', V1MeController, 'show')
    r.post('sign-up', V1SignUpController, 'create')

    r.namespace('visitor', r => {
      r.get('places', VisitorPlacesController, 'index')
      r.get('places/:id', VisitorPlacesController, 'show')
    })

    r.namespace('host', r => {
      r.resources('localized-texts', { only: ['update', 'destroy'] })

      r.resources('places', r => {
        r.resources('rooms')
      })
    })
  })

  adminRoutes(r)
  internalRoutes(r)
  // add routes here, perhaps by running `pnpm psy g:resource v1/pets Pet name:citext birthdate:date species:enum:pet_species:dog,cat,fish`
}
