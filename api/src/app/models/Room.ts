import { Decorators, DreamConst, SoftDelete } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
import ApplicationModel from '@models/ApplicationModel.js'
import LocalizedText from '@models/LocalizedText.js'
import Place from '@models/Place.js'

const deco = new Decorators<typeof Room>()

@SoftDelete()
export default class Room extends ApplicationModel {
  public override get table() {
    return 'rooms' as const
  }

  public get serializers(): DreamSerializers<Room> {
    return {
      default: 'RoomSerializer',
      summary: 'RoomSummarySerializer',
      forHost: 'RoomForHostSerializer',
    }
  }

  public id: DreamColumn<Room, 'id'>
  public type: DreamColumn<Room, 'type'>

  @deco.Sortable({ scope: 'place' })
  public position: DreamColumn<Room, 'position'>

  public createdAt: DreamColumn<Room, 'createdAt'>
  public updatedAt: DreamColumn<Room, 'updatedAt'>
  public deletedAt: DreamColumn<Room, 'deletedAt'>

  @deco.BelongsTo('Place', { on: 'placeId' })
  public place: Place
  public placeId: DreamColumn<Room, 'placeId'>

  @deco.HasMany('LocalizedText', { polymorphic: true, on: 'localizableId', dependent: 'destroy' })
  public localizedTexts: LocalizedText[]

  @deco.AfterCreate()
  public async createDefaultLocalizedText(this: Room) {
    await this.createAssociation('localizedTexts', { locale: 'en-US' })
  }

  @deco.HasOne('LocalizedText', {
    polymorphic: true,
    on: 'localizableId',
    and: { locale: DreamConst.passthrough },
  })
  public currentLocalizedText: LocalizedText
}
