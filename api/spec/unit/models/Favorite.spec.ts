import Favorite from '@models/Favorite.js'
import createFavorite from '@spec/factories/FavoriteFactory.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import createUser from '@spec/factories/UserFactory.js'

describe('Favorite', () => {
  it('belongs to a Guest and Place', async () => {
    const guest = await (await createUser()).associationQuery('guest').firstOrFail()
    const place = await createPlace()

    const favorite = await createFavorite({ guest, place })

    expect(await favorite.associationQuery('guest').first()).toMatchDreamModel(guest)
    expect(await favorite.associationQuery('place').first()).toMatchDreamModel(place)
  })

  it('allows one active Favorite per Guest and Place', async () => {
    const guest = await (await createUser()).associationQuery('guest').firstOrFail()
    const place = await createPlace()

    await createFavorite({ guest, place })

    await expect(Favorite.create({ guest, place })).rejects.toThrow()
  })

  it('allows a Guest to favorite a Place again after destroying the active Favorite', async () => {
    const guest = await (await createUser()).associationQuery('guest').firstOrFail()
    const place = await createPlace()
    const favorite = await createFavorite({ guest, place })
    await favorite.destroy()

    await expect(Favorite.create({ guest, place })).resolves.toBeInstanceOf(Favorite)
  })
})
