import { FactItem, SNNote, FileItem } from '@standardnotes/models'

export interface ItemViewControllerInterface {
  item: SNNote | FileItem | FactItem

  deinit: () => void
  initialize(addTagHierarchy?: boolean): Promise<void>
}
