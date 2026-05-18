import { SoftDelete } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
import ApplicationModel from '@models/ApplicationModel.js'

// Uncomment when adding decorators (@deco.BelongsTo, @deco.Validates, etc.):
// import { Decorators } from '@rvoh/dream'
// const deco = new Decorators<typeof LocalizedText>()

@SoftDelete()
export default class LocalizedText extends ApplicationModel {
  public override get table() {
    return 'localized_texts' as const
  }

  public get serializers(): DreamSerializers<LocalizedText> {
    return {
      default: 'LocalizedTextSerializer',
      summary: 'LocalizedTextSummarySerializer',
    }
  }

  public id: DreamColumn<LocalizedText, 'id'>
  public localizableType: DreamColumn<LocalizedText, 'localizableType'>
  public localizableId: DreamColumn<LocalizedText, 'localizableId'>
  public locale: DreamColumn<LocalizedText, 'locale'>
  public title: DreamColumn<LocalizedText, 'title'>
  public markdown: DreamColumn<LocalizedText, 'markdown'>
  public createdAt: DreamColumn<LocalizedText, 'createdAt'>
  public updatedAt: DreamColumn<LocalizedText, 'updatedAt'>
  public deletedAt: DreamColumn<LocalizedText, 'deletedAt'>
}
