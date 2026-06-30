import Favorite from '@models/Favorite.js'
import Place from '@models/Place.js'
import User from '@models/User.js'
import Guest from '@models/Guest.js'
import createFavorite from '@spec/factories/FavoriteFactory.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import createUser from '@spec/factories/UserFactory.js'
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/authentication.js'

describe('V1/Guest/FavoritesController', () => {
  let request: SpecRequestType
  let user: User
  let guest: Guest

  beforeEach(async () => {
    user = await createUser()
    guest = await user.associationQuery('guest').firstOrFail()
    request = await session(user)
  })

  describe('GET index', () => {
    const index = async <StatusCode extends 200 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.get('/v1/guest/favorites', expectedStatus)
    }

    it('returns the index of Favorites', async () => {
      const favorite = await createFavorite({ guest })

      const { body } = await index(200)

      expect(body.results).toEqual([
        expect.objectContaining({
          id: favorite.id,
          placeId: favorite.placeId,
        }),
      ])
    })

    context('Favorites created by another Guest', () => {
      it('are omitted', async () => {
        await createFavorite()

        const { body } = await index(200)

        expect(body.results).toEqual([])
      })
    })
  })

  describe('POST create', () => {
    let place: Place

    beforeEach(async () => {
      place = await createPlace()
    })

    const create = async <StatusCode extends 201 | 400 | 404>(
      data: RequestBody<'post', '/v1/guest/favorites'>,
      expectedStatus: StatusCode,
    ) => {
      return request.post('/v1/guest/favorites', expectedStatus, {
        data,
      })
    }

    it('creates a Favorite for this Guest', async () => {
      const { body } = await create({ placeId: place.id }, 201)

      const favorite = await guest.associationQuery('favorites').firstOrFail()

      expect(body).toEqual(
        expect.objectContaining({
          id: favorite.id,
          placeId: place.id,
        }),
      )
    })

    it('returns the existing active Favorite for this Guest and Place', async () => {
      const favorite = await createFavorite({ guest, place })

      const { body } = await create({ placeId: place.id }, 201)

      expect(body).toEqual(
        expect.objectContaining({
          id: favorite.id,
          placeId: place.id,
        }),
      )
      expect(await guest.associationQuery('favorites').where({ placeId: place.id }).count()).toEqual(1)
    })
  })

  describe('DELETE destroy', () => {
    const destroy = async <StatusCode extends 204 | 400 | 404>(
      favorite: Favorite,
      expectedStatus: StatusCode,
    ) => {
      return request.delete('/v1/guest/favorites/{id}', expectedStatus, {
        id: favorite.id,
      })
    }

    it('deletes the Favorite', async () => {
      const favorite = await createFavorite({ guest })

      await destroy(favorite, 204)

      expect(await Favorite.find(favorite.id)).toBeNull()
    })

    context('a Favorite created by another Guest', () => {
      it('is not deleted', async () => {
        const favorite = await createFavorite()

        await destroy(favorite, 404)

        expect(await Favorite.find(favorite.id)).toMatchDreamModel(favorite)
      })
    })
  })
})
