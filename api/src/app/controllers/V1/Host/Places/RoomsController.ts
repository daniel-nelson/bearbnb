import { OpenAPI } from '@rvoh/psychic'
import { DreamParamSafeColumnNames } from '@rvoh/dream/types'
import Bathroom from '@models/Room/Bathroom.js'
import Bedroom from '@models/Room/Bedroom.js'
import Den from '@models/Room/Den.js'
import Kitchen from '@models/Room/Kitchen.js'
import LivingRoom from '@models/Room/LivingRoom.js'
import { RoomTypesEnumValues } from '@src/types/db.js'
import V1HostPlacesBaseController from './BaseController.js'
import Room from '@models/Room.js'

const openApiTags = ['rooms']

const paramSafeColumns: DreamParamSafeColumnNames<Room>[] = [
  'appliances',
  'bathOrShowerStyle',
  'bedTypes',
  'position',
]

export default class V1HostPlacesRoomsController extends V1HostPlacesBaseController {
  @OpenAPI(Room, {
    status: 200,
    tags: openApiTags,
    description: 'Paginated index of Rooms',
    cursorPaginate: true,
    serializerKey: 'summary',
    fastJsonStringify: true,
  })
  public async index() {
    const rooms = await this.currentPlace
      .associationQuery('rooms')
      .preloadFor('summary')
      .cursorPaginate({ cursor: this.castParam('cursor', 'string', { allowNull: true }) })
    this.ok(rooms)
  }

  @OpenAPI(Room, {
    status: 200,
    tags: openApiTags,
    description: 'Fetch a Room',
    fastJsonStringify: true,
  })
  public async show() {
    const room = await this.room()
    this.ok(room)
  }

  @OpenAPI(Room, {
    status: 201,
    tags: openApiTags,
    description: 'Create a Room',
    fastJsonStringify: true,
    requestBody: {
      only: paramSafeColumns,
      including: ['type'],
    },
  })
  public async create() {
    let room: Room
    const roomType = this.castParam('type', 'string', { enum: RoomTypesEnumValues })
    const roomParams = this.extractParams(Room, paramSafeColumns)

    switch (roomType) {
      case 'Bathroom':
        room = await Bathroom.create({ place: this.currentPlace, ...roomParams })
        break
      case 'Bedroom':
        room = await Bedroom.create({ place: this.currentPlace, ...roomParams })
        break
      case 'Den':
        room = await Den.create({ place: this.currentPlace, ...roomParams })
        break
      case 'Kitchen':
        room = await Kitchen.create({ place: this.currentPlace, ...roomParams })
        break
      case 'LivingRoom':
        room = await LivingRoom.create({ place: this.currentPlace, ...roomParams })
        break
      default: {
        const _never: never = roomType
        throw new Error(`Unhandled RoomTypesEnum: ${String(_never)}`)
      }
    }

    if (room.isPersisted) room = await room.loadFor('default').execute()
    this.created(room)
  }

  @OpenAPI(Room, {
    status: 204,
    tags: openApiTags,
    description: 'Update a Room',
    fastJsonStringify: true,
    requestBody: {
      only: paramSafeColumns,
    },
  })
  public async update() {
    const room = await this.room()
    await room.update(this.extractParams(Room, paramSafeColumns))
    this.noContent()
  }

  @OpenAPI({
    status: 204,
    tags: openApiTags,
    description: 'Destroy a Room',
    fastJsonStringify: true,
  })
  public async destroy() {
    const room = await this.room()
    await room.destroy()
    this.noContent()
  }

  private async room() {
    return await this.currentPlace
      .associationQuery('rooms')
      .preloadFor('default')
      .findOrFail(this.castParam('id', 'uuid'))
  }
}
