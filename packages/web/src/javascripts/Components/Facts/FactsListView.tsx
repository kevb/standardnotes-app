import { FactsController } from '@/Controllers/FactsController'
import { ElementIds } from '@/Constants/ElementIDs'
import { WebApplication } from '@/Application/WebApplication'
import { isFact } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import FactListItem from './FactListItem'
import FactsSearchBar from './FactsSearchBar'

type Props = {
  application: WebApplication
}

const FactsListView = ({ application }: Props) => {
  const factsController = application.factsController
  const activeItem = application.itemControllerGroup.activeItemViewController?.item
  const activeFactUuid = activeItem && isFact(activeItem) ? activeItem.uuid : undefined
  const facts = factsController.filteredFacts

  return (
    <>
      <FactsSearchBar factsController={factsController} />
      {!facts.length ? (
        <p className="empty-items-list opacity-50">No facts.</p>
      ) : (
        <div
          className="infinite-scroll flex-grow overflow-y-auto overflow-x-hidden pb-2 focus:shadow-none focus:outline-none pointer-coarse:md:overflow-y-auto"
          id={ElementIds.ContentList}
        >
          {facts.map((fact) => (
            <FactListItem
              key={fact.uuid}
              fact={fact}
              factsController={factsController}
              selected={activeFactUuid === fact.uuid}
            />
          ))}
        </div>
      )}
    </>
  )
}

export default observer(FactsListView)
