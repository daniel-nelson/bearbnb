import adminRoutes from '@conf/routes.admin.js'
import internalRoutes from '@conf/routes.internal.js'
import StatusController from '@controllers/StatusController.js'
import V1MeController from '@controllers/V1/MeController.js'
import V1GuestPlacesController from '@controllers/V1/Guest/PlacesController.js'
import { PsychicRouter } from '@rvoh/psychic'

export default function routes(r: PsychicRouter) {
  r.get('status', StatusController, 'show')

  r.namespace('v1', r => {
    r.get('me', V1MeController, 'show')

    r.namespace('guest', r => {
      r.resources('bookings', { only: ['create'] })
      r.resources('places', { only: ['index', 'show'] }, r => {
        r.get('availability', V1GuestPlacesController, 'availability')
        r.resources('reviews', { only: ['index'] })
      })
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
