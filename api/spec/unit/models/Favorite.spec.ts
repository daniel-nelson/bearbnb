import createFavorite from '@spec/factories/FavoriteFactory.js'

describe('Favorite', () => {
  it('belongs to a Guest and a Place', async () => {
    const favorite = await createFavorite()

    await expect(favorite.associationQuery('guest').first()).resolves.toMatchDreamModel(favorite.guest)
    await expect(favorite.associationQuery('place').first()).resolves.toMatchDreamModel(favorite.place)
  })
})
