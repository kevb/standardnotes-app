import { DecryptedItem } from '../../Abstract/Item/Implementations/DecryptedItem'
import { ItemInterface } from '../../Abstract/Item/Interfaces/ItemInterface'
import { DecryptedPayloadInterface } from '../../Abstract/Payload/Interfaces/DecryptedPayload'
import { FactContent, FactContentSpecialized, FactKind } from './FactContent'
import { FactContentType } from './FactContentType'

export const isFact = (x: ItemInterface): x is FactItem => x.content_type === FactContentType

export class FactItem extends DecryptedItem<FactContent> implements FactContentSpecialized {
  public readonly title: string
  public readonly value: string
  public readonly kind?: FactKind
  public readonly notes?: string
  public readonly text: string

  constructor(payload: DecryptedPayloadInterface<FactContent>) {
    super(payload)

    this.title = String(this.payload.content.title || '')
    this.value = String(this.payload.content.value || '')
    this.kind = this.payload.content.kind
    this.notes = this.payload.content.notes ? String(this.payload.content.notes) : undefined
    this.text = [this.value, this.notes].filter(Boolean).join('\n')
  }
}
