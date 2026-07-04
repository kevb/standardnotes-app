import { FillItemContent } from '../../Abstract/Content/ItemContent'
import { MutationType } from '../../Abstract/Item'
import { DecryptedPayload, PayloadSource, PayloadTimestampDefaults } from '../../Abstract/Payload'
import { CreateDecryptedItemFromPayload, CreateDecryptedMutatorForItem } from '../../Utilities/Item/ItemGenerator'
import { FactContent } from './FactContent'
import { FactContentType } from './FactContentType'
import { FactItem, isFact } from './Fact'
import { FactMutator } from './FactMutator'

const createFact = (content: Partial<FactContent> = {}): FactItem => {
  return new FactItem(
    new DecryptedPayload(
      {
        uuid: 'fact-uuid',
        content_type: FactContentType,
        content: FillItemContent<FactContent>({
          title: 'Phone',
          value: '+1 555 0100',
          kind: 'phone',
          notes: 'Primary contact number',
          ...content,
        }),
        ...PayloadTimestampDefaults(),
      },
      PayloadSource.Constructor,
    ),
  )
}

describe('FactItem', () => {
  it('reads title, value, kind, notes, and searchable text', () => {
    const fact = createFact()

    expect(fact.title).toEqual('Phone')
    expect(fact.value).toEqual('+1 555 0100')
    expect(fact.kind).toEqual('phone')
    expect(fact.notes).toEqual('Primary contact number')
    expect(fact.text).toEqual('+1 555 0100\nPrimary contact number')
  })

  it('handles missing optional fields safely', () => {
    const fact = createFact({
      kind: undefined,
      notes: undefined,
    })

    expect(fact.kind).toBeUndefined()
    expect(fact.notes).toBeUndefined()
    expect(fact.text).toEqual('+1 555 0100')
  })

  it('identifies facts by content type', () => {
    expect(isFact(createFact())).toBe(true)
  })

  it('creates FactItem through item generator for SN|Fact', () => {
    const fact = createFact()
    const generated = CreateDecryptedItemFromPayload<FactContent, FactItem>(fact.payload)

    expect(generated).toBeInstanceOf(FactItem)
    expect(generated.value).toEqual('+1 555 0100')
  })
})

describe('FactMutator', () => {
  it('updates title, value, kind, and notes', () => {
    const fact = createFact()
    const mutator = new FactMutator(fact, MutationType.NoUpdateUserTimestamps)

    mutator.title = 'Store card'
    mutator.value = '123456'
    mutator.kind = 'card'
    mutator.notes = 'Use at checkout'

    const result = mutator.getResult()

    expect(result.content.title).toEqual('Store card')
    expect(result.content.value).toEqual('123456')
    expect(result.content.kind).toEqual('card')
    expect(result.content.notes).toEqual('Use at checkout')
  })

  it('creates FactMutator through item generator for SN|Fact', () => {
    const fact = createFact()
    const mutator = CreateDecryptedMutatorForItem(fact, MutationType.NoUpdateUserTimestamps)

    expect(mutator).toBeInstanceOf(FactMutator)
  })
})
