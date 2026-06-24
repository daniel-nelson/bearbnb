import { DreamSerializer } from '@rvoh/dream'
import Favorite from '@models/Favorite.js'

export const FavoriteSummarySerializer = (favorite: Favorite) =>
  DreamSerializer(Favorite, favorite)
    .attribute('id')
    .attribute('placeId')

export const FavoriteSerializer = (favorite: Favorite) =>
  FavoriteSummarySerializer(favorite)
