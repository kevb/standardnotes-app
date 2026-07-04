import { ItemContent } from '../../Abstract/Content/ItemContent'

export type FactKind = 'plain' | 'phone' | 'card' | 'account' | 'id' | 'code' | 'address'

export interface FactContentSpecialized {
  title: string
  value: string
  kind?: FactKind
  notes?: string
}

export type FactContent = FactContentSpecialized & ItemContent
