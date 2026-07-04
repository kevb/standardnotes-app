import ClearInputButton from '@/Components/ClearInputButton/ClearInputButton'
import Icon from '@/Components/Icon/Icon'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import { FactsController } from '@/Controllers/FactsController'
import { ElementIds } from '@/Constants/ElementIDs'
import { observer } from 'mobx-react-lite'
import { useCallback, useRef } from 'react'

type Props = {
  factsController: FactsController
}

const FactsSearchBar = ({ factsController }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const onClearSearch = useCallback(() => {
    factsController.setSearchQuery('')
    inputRef.current?.focus()
  }, [factsController])

  return (
    <div className="group pb-0.5 pt-3" role="search">
      <DecoratedInput
        autocomplete={false}
        id={ElementIds.SearchBar}
        className={{
          container: 'px-1',
          input: 'text-base placeholder:text-passive-0 lg:text-sm',
        }}
        placeholder="Search facts..."
        value={factsController.searchQuery}
        ref={inputRef}
        onChange={factsController.setSearchQuery}
        left={[<Icon type="search" className="mr-1 h-4.5 w-4.5 flex-shrink-0 text-passive-1" />]}
        right={[factsController.searchQuery && <ClearInputButton onClick={onClearSearch} />]}
        roundedFull
      />
    </div>
  )
}

export default observer(FactsSearchBar)
