import Favorite from '@models/Favorite.js'
import Guest from '@models/Guest.js'
import User from '@models/User.js'
import createFavorite from '@spec/factories/FavoriteFactory.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import createUser from '@spec/factories/UserFactory.js'
import { PsychicServer } from '@rvoh/psychic'
import { OpenapiSpecRequest } from '@rvoh/psychic-spec-helpers'
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/authentication.js'
import { paths as OpenapiPaths } from '@src/types/openapi/tests.openapi.js'

describe('V1/Guest/FavoritesController', () => {
  let request: SpecRequestType
  let user: User
  let guest: Guest

  beforeEach(async () => {
    user = await createUser()
    guest = await user.associationQuery('guest').firstOrFail()
    request = await session(user)
  })

  describe('POST create', () => {
    const create = async <StatusCode extends 201 | 400 | 401 | 404>(
      data: RequestBody<'post', '/v1/guest/favorites'>,
      expectedStatus: StatusCode,
    ) => {
      return request.post('/v1/guest/favorites', expectedStatus, {
        data,
      })
    }

    it('creates a Favorite for this Guest', async () => {
      const place = await createPlace()

      const { body } = await create(
        {
          placeId: place.id,
        },
        201,
      )

      const favorite = await guest.associationQuery('favorites').firstOrFail()

      expect(body).toEqual(
        expect.objectContaining({
          id: favorite.id,
          placeId: place.id,
        }),
      )
    })

    it('returns the existing Favorite when the Guest already favorited the Place', async () => {
      const favorite = await createFavorite({ guest })

      const { body } = await create({ placeId: favorite.placeId }, 201)

      expect(body).toEqual(
        expect.objectContaining({
          id: favorite.id,
          placeId: favorite.placeId,
        }),
      )
      expect(await Favorite.query().count()).toEqual(1)
    })

    it('requires authentication', async () => {
      request = new OpenapiSpecRequest<OpenapiPaths>()
      await request.init(PsychicServer)

      await create({ placeId: (await createPlace()).id }, 401)
    })
  })

  describe('DELETE destroy', () => {
    const destroy = async <StatusCode extends 204 | 400 | 401 | 404>(
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

    context('a Favorite created by another User', () => {
      it('is not deleted', async () => {
        const favorite = await createFavorite()

        await destroy(favorite, 404)

        expect(await Favorite.find(favorite.id)).toMatchDreamModel(favorite)
      })
    })

    it('requires authentication', async () => {
      request = new OpenapiSpecRequest<OpenapiPaths>()
      await request.init(PsychicServer)
      const favorite = await createFavorite()

      await destroy(favorite, 401)

      expect(await Favorite.find(favorite.id)).toMatchDreamModel(favorite)
    })
  })
})
