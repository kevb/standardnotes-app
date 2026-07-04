import Icon from '@/Components/Icon/Icon'
import Menu from '@/Components/Menu/Menu'
import MenuItem from '@/Components/Menu/MenuItem'
import Popover from '@/Components/Popover/Popover'
import { PaneLayout } from '@/Controllers/PaneController/PaneLayout'
import { FactsController } from '@/Controllers/FactsController'
import { useContextMenuEvent } from '@/Hooks/useContextMenuEvent'
import { FactItem } from '@standardnotes/snjs'
import { classNames } from '@standardnotes/utils'
import { observer } from 'mobx-react-lite'
import { MouseEvent, useCallback, useRef, useState } from 'react'
import { useResponsiveAppPane } from '../Panes/ResponsivePaneProvider'

type Props = {
  fact: FactItem
  factsController: FactsController
  selected: boolean
}

const FactListItem = ({ fact, factsController, selected }: Props) => {
  const listItemRef = useRef<HTMLDivElement>(null)
  const { setPaneLayout } = useResponsiveAppPane()
  const [contextMenuLocation, setContextMenuLocation] = useState({ x: 0, y: 0 })
  const [showContextMenu, setShowContextMenu] = useState(false)
  const canRenderValue = factsController.isAuthorizedToRenderValue(fact)
  const valuePreview = canRenderValue ? fact.value || 'No value' : 'Protected'

  const onOpen = useCallback(async () => {
    await factsController.openFact(fact)
    setPaneLayout(PaneLayout.Editing)
  }, [factsController, fact, setPaneLayout])

  const onCopy = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation()
      factsController.copyFactValue(fact).catch(console.error)
    },
    [factsController, fact],
  )

  const onDelete = useCallback(
    (event?: MouseEvent) => {
      event?.stopPropagation()
      setShowContextMenu(false)
      factsController.deleteFact(fact).catch(console.error)
    },
    [factsController, fact],
  )

  const onContextMenu = useCallback((posX: number, posY: number) => {
    setContextMenuLocation({ x: posX, y: posY })
    setShowContextMenu(true)
  }, [])

  useContextMenuEvent(listItemRef, onContextMenu)

  return (
    <>
      <div
        ref={listItemRef}
        role="button"
        className={classNames(
          'content-list-item flex w-full cursor-pointer items-stretch border-l-2 text-text',
          selected ? 'selected border-info' : 'border-transparent',
        )}
        id={fact.uuid}
        onClick={() => onOpen().catch(console.error)}
      >
        <div className="mr-0 flex flex-col items-center justify-start p-3.5 pr-4">
          <Icon type="details-block" className={selected ? 'text-info' : 'text-neutral'} />
        </div>
        <div className="min-w-0 flex-grow border-b border-solid border-border px-0 py-3">
          <div className="overflow-hidden text-ellipsis whitespace-nowrap text-base font-semibold lg:text-sm">
            {fact.title || 'Untitled fact'}
          </div>
          <div
            className={classNames(
              'mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-base lg:text-sm',
              canRenderValue ? 'text-text opacity-80' : 'text-passive-0',
            )}
          >
            {valuePreview}
          </div>
        </div>
        <button
          className="flex items-center border-b border-solid border-border p-4 text-neutral hover:text-info"
          title="Copy fact value"
          aria-label="Copy fact value"
          onClick={onCopy}
        >
          <Icon type="copy" />
        </button>
        <button
          className="flex items-center border-b border-solid border-border p-4 pl-2 text-neutral hover:text-danger"
          title="Delete fact"
          aria-label="Delete fact"
          onClick={onDelete}
        >
          <Icon type="trash" />
        </button>
      </div>
      <Popover
        title="Fact options"
        align="start"
        anchorPoint={contextMenuLocation}
        open={showContextMenu}
        togglePopover={() => setShowContextMenu(false)}
      >
        <Menu a11yLabel="Fact context menu" className="select-none">
          <MenuItem icon="trash" iconClassName="mr-2 h-5 w-5 text-danger" onClick={onDelete}>
            Delete
          </MenuItem>
        </Menu>
      </Popover>
    </>
  )
}

export default observer(FactListItem)
