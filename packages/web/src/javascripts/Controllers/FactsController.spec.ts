import {
  AlertService,
  ApplicationEvent,
  DecryptedPayload,
  FactContent,
  FactContentType,
  FactItem,
  FactMutator,
  FillItemContent,
  InternalEventBusInterface,
  ItemManagerInterface,
  MutationType,
  MutatorClientInterface,
  PayloadSource,
  PayloadTimestampDefaults,
  ProtectionsClientInterface,
  SyncServiceInterface,
} from '@standardnotes/snjs'
import { FactsController } from './FactsController'
import { ItemGroupController } from '@/Components/NoteView/Controller/ItemGroupController'
import { copyTextToClipboard } from '@/Utils/copyTextToClipboard'

jest.mock('@/Utils/copyTextToClipboard', () => ({
  copyTextToClipboard: jest.fn(),
}))

jest.mock('@standardnotes/toast', () => ({
  addToast: jest.fn(),
  ToastType: {
    Success: 'success',
  },
}))

const createFact = (
  content: Partial<FactContent> & Pick<FactContent, 'title' | 'value'>,
  uuid = content.title,
): FactItem => {
  return new FactItem(
    new DecryptedPayload(
      {
        uuid,
        content_type: FactContentType,
        content: FillItemContent<FactContent>(content),
        ...PayloadTimestampDefaults(),
      },
      PayloadSource.Constructor,
    ),
  )
}

describe('FactsController', () => {
  const createController = (facts: FactItem[], hasProtectedSession = false) => {
    const items = {
      getItems: jest.fn().mockReturnValue(facts),
      streamItems: jest.fn((_contentType, callback) => {
        callback({ inserted: facts, changed: [], removed: [] })
        return jest.fn()
      }),
    } as unknown as jest.Mocked<ItemManagerInterface>

    const mutator = {
      changeItem: jest.fn(async (fact: FactItem, callback: (mutator: FactMutator) => void) => {
        callback(new FactMutator(fact, MutationType.NoUpdateUserTimestamps))
      }),
      createItem: jest.fn(),
      setItemToBeDeleted: jest.fn(),
    } as unknown as jest.Mocked<MutatorClientInterface>

    const sync = {
      sync: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<SyncServiceInterface>

    const protections = {
      hasUnprotectedAccessSession: jest.fn().mockReturnValue(hasProtectedSession),
      authorizeItemAccess: jest.fn().mockResolvedValue(true),
      protectItems: jest.fn().mockResolvedValue([]),
      unprotectItems: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<ProtectionsClientInterface>

    const alerts = {
      confirm: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<AlertService>

    const itemControllerGroup = {
      createItemController: jest.fn().mockResolvedValue(undefined),
      closeActiveItemController: jest.fn(),
    } as unknown as jest.Mocked<ItemGroupController>

    const eventBus = {
      addEventHandler: jest.fn(),
      publish: jest.fn(),
      publishSync: jest.fn(),
      deinit: jest.fn(),
    } as unknown as jest.Mocked<InternalEventBusInterface>

    const controller = new FactsController(items, mutator, sync, protections, alerts, itemControllerGroup, eventBus)

    return {
      controller,
      alerts,
      mutator,
      protections,
      sync,
      itemControllerGroup,
    }
  }

  it('filters facts search without returning unrelated facts', () => {
    const phone = createFact({ title: 'Phone', value: '+1 555 0100', kind: 'phone' })
    const card = createFact({ title: 'Store card', value: 'ABC123', kind: 'card' })
    const { controller } = createController([phone, card])

    controller.setSearchQuery('phone')

    expect(controller.filteredFacts).toEqual([phone])
  })

  it('reuses an existing blank Fact instead of creating another blank Fact', async () => {
    const blankFact = createFact({ title: 'Untitled fact', value: '', kind: 'plain' })
    const { controller, mutator, itemControllerGroup } = createController([blankFact])

    await controller.createFact({ title: 'Untitled fact', value: '', kind: 'plain' })

    expect(mutator.createItem).not.toHaveBeenCalled()
    expect(itemControllerGroup.createItemController).toHaveBeenCalledWith({ fact: blankFact })
  })

  it('coalesces repeated in-flight blank Fact creates', async () => {
    const createdFact = createFact({ title: 'Untitled fact', value: '', kind: 'plain' })
    const { controller, mutator, sync } = createController([])

    let resolveCreate: (fact: FactItem) => void
    mutator.createItem.mockReturnValue(
      new Promise<FactItem>((resolve) => {
        resolveCreate = resolve
      }),
    )

    const firstCreate = controller.createFact({ title: 'Untitled fact', value: '', kind: 'plain' })
    const secondCreate = controller.createFact({ title: 'Untitled fact', value: '', kind: 'plain' })

    resolveCreate!(createdFact)

    await expect(firstCreate).resolves.toBe(createdFact)
    await expect(secondCreate).resolves.toBe(createdFact)

    expect(mutator.createItem).toHaveBeenCalledTimes(1)
    expect(sync.sync).toHaveBeenCalledTimes(1)
  })

  it('hides protected values from preview/search until an unprotected session is active', async () => {
    const fact = createFact({ title: 'Tax ID', value: 'SECRET', protected: true })
    const { controller, protections } = createController([fact])

    expect(controller.isAuthorizedToRenderValue(fact)).toBe(false)

    controller.setSearchQuery('secret')
    expect(controller.filteredFacts).toEqual([])

    protections.hasUnprotectedAccessSession.mockReturnValue(true)
    await controller.handleEvent({ type: ApplicationEvent.UnprotectedSessionBegan, payload: undefined })

    expect(controller.isAuthorizedToRenderValue(fact)).toBe(true)
    expect(controller.filteredFacts).toEqual([fact])
  })

  it('copies fact value after protected access is authorized', async () => {
    const fact = createFact({ title: 'Store card', value: 'ABC123', protected: true })
    const { controller, protections } = createController([fact])

    protections.hasUnprotectedAccessSession.mockReturnValue(true)

    await controller.copyFactValue(fact)

    expect(protections.authorizeItemAccess).toHaveBeenCalledWith(fact)
    expect(copyTextToClipboard).toHaveBeenCalledWith('ABC123')
  })

  it('shows the stability warning before updating a fact', async () => {
    const fact = createFact({ title: 'Store card', value: 'ABC123', kind: 'card' })
    const { controller, alerts, mutator, sync } = createController([fact])

    await controller.updateFact(fact, {
      title: 'Store card',
      value: 'XYZ789',
      kind: 'card',
      notes: 'Changed after reissue',
    })

    expect(alerts.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Facts are meant to be stable'),
      'Modify Fact',
      'Modify Fact',
      expect.anything(),
      'Cancel',
    )
    expect(mutator.changeItem).toHaveBeenCalled()
    expect(sync.sync).toHaveBeenCalled()
  })
})
