import { DecryptedItemMutator } from '../../Abstract/Item/Mutator/DecryptedItemMutator'
import { FactContent, FactKind } from './FactContent'

export class FactMutator extends DecryptedItemMutator<FactContent> {
  set title(title: string) {
    this.mutableContent.title = title
  }

  set value(value: string) {
    this.mutableContent.value = value
  }

  set kind(kind: FactKind | undefined) {
    this.mutableContent.kind = kind
  }

  set notes(notes: string | undefined) {
    this.mutableContent.notes = notes
  }
}
