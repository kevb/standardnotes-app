import Icon from '@/Components/Icon/Icon'
import { FactsController } from '@/Controllers/FactsController'
import { FactItem } from '@standardnotes/snjs'
import { classNames } from '@standardnotes/utils'
import { observer } from 'mobx-react-lite'
import { MouseEvent, useCallback } from 'react'

type Props = {
  fact: FactItem
  factsController: FactsController
  selected: boolean
}

const FactListItem = ({ fact, factsController, selected }: Props) => {
  const canRenderValue = factsController.isAuthorizedToRenderValue(fact)
  const valuePreview = canRenderValue ? fact.value || 'No value' : 'Protected'

  const onOpen = useCallback(() => {
    factsController.openFact(fact).catch(console.error)
  }, [factsController, fact])

  const onCopy = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation()
      factsController.copyFactValue(fact).catch(console.error)
    },
    [factsController, fact],
  )

  return (
    <div
      role="button"
      className={classNames(
        'content-list-item flex w-full cursor-pointer items-stretch border-l-2 text-text',
        selected ? 'selected border-info' : 'border-transparent',
      )}
      id={fact.uuid}
      onClick={onOpen}
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
    </div>
  )
}

export default observer(FactListItem)
