import { Decorators, SoftDelete } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
import ApplicationModel from '@models/ApplicationModel.js'
import Guest from '@models/Guest.js'
import Place from '@models/Place.js'

const deco = new Decorators<typeof Favorite>()

@SoftDelete()
export default class Favorite extends ApplicationModel {
  public override get table() {
    return 'favorites' as const
  }

  public get serializers(): DreamSerializers<Favorite> {
    return {
      default: 'FavoriteSerializer',
      summary: 'FavoriteSummarySerializer',
    }
  }

  public id: DreamColumn<Favorite, 'id'>
  public createdAt: DreamColumn<Favorite, 'createdAt'>
  public updatedAt: DreamColumn<Favorite, 'updatedAt'>
  public deletedAt: DreamColumn<Favorite, 'deletedAt'>

  @deco.BelongsTo('Guest', { on: 'guestId' })
  public guest: Guest
  public guestId: DreamColumn<Favorite, 'guestId'>

  @deco.BelongsTo('Place', { on: 'placeId' })
  public place: Place
  public placeId: DreamColumn<Favorite, 'placeId'>
}
