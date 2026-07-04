import { ItemGroupController } from '@/Components/NoteView/Controller/ItemGroupController'
import { copyTextToClipboard } from '@/Utils/copyTextToClipboard'
import { addToast, ToastType } from '@standardnotes/toast'
import {
  AlertService,
  ApplicationEvent,
  ButtonType,
  ChallengeReason,
  FactContent,
  FactContentType,
  FactItem,
  FactKind,
  FactMutator,
  FillItemContent,
  InternalEventBusInterface,
  InternalEventHandlerInterface,
  InternalEventInterface,
  ItemManagerInterface,
  MutatorClientInterface,
  ProtectionsClientInterface,
  SyncServiceInterface,
} from '@standardnotes/snjs'
import { action, computed, makeObservable, observable, runInAction } from 'mobx'
import { AbstractViewController } from './Abstract/AbstractViewController'

export type FactDraft = {
  title: string
  value: string
  kind?: FactKind
  notes?: string
}

const FactEditWarning = 'Facts are meant to be stable. Changing this value may affect places you rely on it.'

export class FactsController extends AbstractViewController implements InternalEventHandlerInterface {
  facts: FactItem[] = []
  searchQuery = ''
  canRenderProtectedValues = false

  constructor(
    private items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private sync: SyncServiceInterface,
    private protections: ProtectionsClientInterface,
    private alerts: AlertService,
    private itemControllerGroup: ItemGroupController,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    this.canRenderProtectedValues = this.protections.hasUnprotectedAccessSession()

    makeObservable(this, {
      facts: observable,
      searchQuery: observable,
      canRenderProtectedValues: observable,
      setSearchQuery: action,
      refreshProtectedValueState: action,
      filteredFacts: computed,
    })

    this.streamFacts()

    eventBus.addEventHandler(this, ApplicationEvent.UnprotectedSessionBegan)
    eventBus.addEventHandler(this, ApplicationEvent.UnprotectedSessionExpired)
  }

  override deinit() {
    super.deinit()
    ;(this.items as unknown) = undefined
    ;(this.mutator as unknown) = undefined
    ;(this.sync as unknown) = undefined
    ;(this.protections as unknown) = undefined
    ;(this.alerts as unknown) = undefined
    ;(this.itemControllerGroup as unknown) = undefined
  }

  setSearchQuery = (query: string): void => {
    this.searchQuery = query
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (
      event.type === ApplicationEvent.UnprotectedSessionBegan ||
      event.type === ApplicationEvent.UnprotectedSessionExpired
    ) {
      this.refreshProtectedValueState()
    }
  }

  refreshProtectedValueState = (): void => {
    this.canRenderProtectedValues = this.protections.hasUnprotectedAccessSession()
  }

  get filteredFacts(): FactItem[] {
    const query = this.searchQuery.trim().toLowerCase()
    const facts = this.facts
      .filter((fact) => !fact.trashed && !fact.archived)
      .sort((a, b) => {
        if (a.pinned !== b.pinned) {
          return a.pinned ? -1 : 1
        }
        return a.title.localeCompare(b.title)
      })

    if (!query) {
      return facts
    }

    return facts.filter((fact) => {
      const value = this.isAuthorizedToRenderValue(fact) ? fact.value : ''
      return [fact.title, value, fact.notes, fact.kind].filter(Boolean).join(' ').toLowerCase().includes(query)
    })
  }

  isAuthorizedToRenderValue(fact: FactItem): boolean {
    return !fact.protected || this.canRenderProtectedValues
  }

  async createFact(draft: FactDraft): Promise<FactItem> {
    const fact = await this.mutator.createItem<FactItem, FactContent>(
      FactContentType,
      FillItemContent<FactContent>({
        title: draft.title,
        value: draft.value,
        kind: draft.kind || 'plain',
        notes: draft.notes,
      }),
      true,
    )
    await this.sync.sync()
    await this.openFact(fact)
    return fact
  }

  async updateFact(fact: FactItem, draft: FactDraft): Promise<void> {
    const didConfirm = await this.alerts.confirm(
      FactEditWarning,
      'Modify Fact',
      'Modify Fact',
      ButtonType.Danger,
      'Cancel',
    )

    if (!didConfirm) {
      return
    }

    if (fact.protected) {
      const authorized = await this.protections.authorizeItemAccess(fact)
      if (!authorized) {
        return
      }
    }

    await this.mutator.changeItem<FactMutator, FactItem>(fact, (mutator) => {
      mutator.title = draft.title
      mutator.value = draft.value
      mutator.kind = draft.kind || 'plain'
      mutator.notes = draft.notes
    })
    await this.sync.sync()
  }

  async deleteFact(fact: FactItem): Promise<void> {
    const confirmed = await this.alerts.confirm(
      `Delete "${fact.title || 'Untitled fact'}"?`,
      'Delete Fact',
      'Delete',
      ButtonType.Danger,
      'Cancel',
    )

    if (!confirmed) {
      return
    }

    await this.mutator.setItemToBeDeleted(fact)
    await this.sync.sync()
    this.itemControllerGroup.closeActiveItemController()
  }

  async setFactProtection(fact: FactItem, protectedValue: boolean): Promise<void> {
    if (protectedValue) {
      await this.protections.protectItems([fact])
    } else {
      await this.protections.unprotectItems([fact], ChallengeReason.UnprotectNote)
    }
    await this.sync.sync()
  }

  async revealFact(fact: FactItem): Promise<boolean> {
    if (this.isAuthorizedToRenderValue(fact)) {
      return true
    }

    const authorized = await this.protections.authorizeItemAccess(fact)
    this.refreshProtectedValueState()
    return authorized
  }

  async copyFactValue(fact: FactItem): Promise<void> {
    const canCopy = await this.revealFact(fact)
    if (!canCopy) {
      return
    }

    copyTextToClipboard(fact.value)
    addToast({ type: ToastType.Success, message: 'Copied fact value' })
  }

  async openFact(fact: FactItem): Promise<void> {
    await this.itemControllerGroup.createItemController({ fact })
  }

  private streamFacts(): void {
    this.disposers.push(
      this.items.streamItems<FactItem>(FactContentType, () => {
        runInAction(() => {
          this.facts = this.items.getItems<FactItem>(FactContentType)
        })
      }),
    )
  }
}
