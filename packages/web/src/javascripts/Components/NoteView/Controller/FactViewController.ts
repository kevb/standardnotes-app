import { FactContentType, FactItem, ItemManagerInterface } from '@standardnotes/snjs'
import { ItemViewControllerInterface } from './ItemViewControllerInterface'

export class FactViewController implements ItemViewControllerInterface {
  public dealloced = false
  private removeStreamObserver?: () => void
  public runtimeId = `${Math.random()}`

  constructor(
    public item: FactItem,
    private items: ItemManagerInterface,
  ) {}

  deinit() {
    this.dealloced = true
    this.removeStreamObserver?.()
    ;(this.removeStreamObserver as unknown) = undefined
    ;(this.item as unknown) = undefined
  }

  async initialize() {
    this.streamItems()
  }

  private streamItems() {
    this.removeStreamObserver = this.items.streamItems<FactItem>(FactContentType, ({ changed, inserted }) => {
      if (this.dealloced) {
        return
      }

      const facts = changed.concat(inserted)
      const matchingFact = facts.find((item) => item.uuid === this.item.uuid)

      if (matchingFact) {
        this.item = matchingFact
      }
    })
  }
}
