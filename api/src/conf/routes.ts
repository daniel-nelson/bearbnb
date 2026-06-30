import adminRoutes from '@conf/routes.admin.js'
import internalRoutes from '@conf/routes.internal.js'
import StatusController from '@controllers/StatusController.js'
import VisitorMeController from '@controllers/Visitor/V1/MeController.js'
import VisitorSignUpController from '@controllers/Visitor/V1/SignUpController.js'
import VisitorPlacesController from '@controllers/Visitor/V1/PlacesController.js'
import { PsychicRouter } from '@rvoh/psychic'

export default function routes(r: PsychicRouter) {
  r.get('status', StatusController, 'show')

  r.namespace('v1', r => {
    r.namespace('guest', r => {
      r.resources('bookings', { only: ['index', 'create', 'update', 'destroy'] })

      r.resources('favorites', { only: ['index', 'create', 'destroy'] })
    })

    r.get('me', VisitorMeController, 'show')
    r.post('sign-up', VisitorSignUpController, 'create')

    r.namespace('visitor', r => {
      r.get('places', VisitorPlacesController, 'index')
      r.get('places/:id/availability', VisitorPlacesController, 'availability')
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
