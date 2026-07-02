import { OpenAPI } from '@rvoh/psychic'
import { DreamParamSafeColumnNames } from '@rvoh/dream/types'
import ApplicationModel from '@models/ApplicationModel.js'
import Bathroom from '@models/Room/Bathroom.js'
import Bedroom from '@models/Room/Bedroom.js'
import Den from '@models/Room/Den.js'
import Kitchen from '@models/Room/Kitchen.js'
import LivingRoom from '@models/Room/LivingRoom.js'
import LocalizedText from '@models/LocalizedText.js'
import {
  DEFAULT_LOCALE,
  localizedTextParams,
  reconcileLocalizedTexts,
} from '@src/app/services/LocalizedTextReconciler.js'
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

const localizedTextsRequestBody = {
  localizedTexts: {
    type: 'array' as const,
    items: OpenAPI.forDream(LocalizedText, {
      params: localizedTextParams,
      required: localizedTextParams,
    }),
  },
}

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
    description: 'Fetch a Room, with localized text rows for editing/display',
    serializerKey: 'forHost',
    fastJsonStringify: true,
  })
  public async show() {
    const room = await this.currentPlace
      .associationQuery('rooms')
      .preloadFor('forHost')
      .findOrFail(this.castParam('id', 'uuid'))
    this.ok(room)
  }

  @OpenAPI(Room, {
    status: 201,
    tags: openApiTags,
    description: 'Create a Room, with multi-locale localized text',
    fastJsonStringify: true,
    requestBody: {
      params: paramSafeColumns,
      including: ['type'],
      combining: localizedTextsRequestBody,
    },
    responses: {
      422: { description: `Missing ${DEFAULT_LOCALE} title and description` },
    },
  })
  public async create() {
    const roomType = this.castParam('type', 'string', { enum: RoomTypesEnumValues })
    const roomParams = this.extractParams(Room, paramSafeColumns)
    const localizedTexts = this.extractLocalizedTexts()

    const defaultText = localizedTexts.find(text => text.locale === DEFAULT_LOCALE)
    if (!defaultText?.title || !defaultText?.markdown)
      return this.unprocessableContent({
        errors: { localizedTexts: [`must include a ${DEFAULT_LOCALE} title and description`] },
      })

    let room = await ApplicationModel.transaction(async txn => {
      let room: Room

      switch (roomType) {
        case 'Bathroom':
          room = await Bathroom.txn(txn).create({ place: this.currentPlace, ...roomParams })
          break
        case 'Bedroom':
          room = await Bedroom.txn(txn).create({ place: this.currentPlace, ...roomParams })
          break
        case 'Den':
          room = await Den.txn(txn).create({ place: this.currentPlace, ...roomParams })
          break
        case 'Kitchen':
          room = await Kitchen.txn(txn).create({ place: this.currentPlace, ...roomParams })
          break
        case 'LivingRoom':
          room = await LivingRoom.txn(txn).create({ place: this.currentPlace, ...roomParams })
          break
        default: {
          const _never: never = roomType
          throw new Error(`Unhandled RoomTypesEnum: ${String(_never)}`)
        }
      }

      await reconcileLocalizedTexts(room, localizedTexts, txn)
      return room
    })

    room = await room.loadFor('default').execute()
    this.created(room)
  }

  @OpenAPI(Room, {
    status: 204,
    tags: openApiTags,
    description: 'Update a Room, with multi-locale localized text. The Room type is fixed after creation.',
    fastJsonStringify: true,
    requestBody: {
      params: paramSafeColumns,
      combining: localizedTextsRequestBody,
    },
    responses: {
      422: { description: `Missing ${DEFAULT_LOCALE} title and description` },
    },
  })
  public async update() {
    const roomParams = this.extractParams(Room, paramSafeColumns)
    const localizedTexts = this.extractLocalizedTexts()

    const defaultText = localizedTexts.find(text => text.locale === DEFAULT_LOCALE)
    if (!defaultText?.title || !defaultText?.markdown)
      return this.unprocessableContent({
        errors: { localizedTexts: [`must include a ${DEFAULT_LOCALE} title and description`] },
      })

    const room = await this.room()
    await ApplicationModel.transaction(async txn => {
      await room.txn(txn).update(roomParams)
      await reconcileLocalizedTexts(room, localizedTexts, txn, { removeMissing: true })
    })

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

  private extractLocalizedTexts() {
    return this.extractParams(LocalizedText, localizedTextParams, {
      key: 'localizedTexts',
      array: true,
    })
  }

  private async room() {
    return await this.currentPlace
      .associationQuery('rooms')
      .preloadFor('default')
      .findOrFail(this.castParam('id', 'uuid'))
  }
}
