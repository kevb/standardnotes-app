import {
  DecryptedPayload,
  FactContent,
  FactContentType,
  FactItem,
  FillItemContent,
  PayloadSource,
  PayloadTimestampDefaults,
} from '@standardnotes/snjs'
import { createRoot, Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { PaneLayout } from '@/Controllers/PaneController/PaneLayout'
import { FactsController } from '@/Controllers/FactsController'
import FactListItem from './FactListItem'

const setPaneLayout = jest.fn()

jest.mock('@/Components/Icon/Icon', () => ({
  __esModule: true,
  default: () => <span />,
}))

jest.mock('@/Components/Popover/Popover', () => ({
  __esModule: true,
  default: ({ children, open }: { children: JSX.Element; open: boolean }) => (open ? <div>{children}</div> : null),
}))

jest.mock('../Panes/ResponsivePaneProvider', () => ({
  useResponsiveAppPane: () => ({
    setPaneLayout,
  }),
}))

beforeAll(() => {
  ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

const createFact = (): FactItem => {
  return new FactItem(
    new DecryptedPayload(
      {
        uuid: 'fact-uuid',
        content_type: FactContentType,
        content: FillItemContent<FactContent>({
          title: 'Store card',
          value: 'ABC123',
          kind: 'card',
        }),
        ...PayloadTimestampDefaults(),
      },
      PayloadSource.Constructor,
    ),
  )
}

describe('FactListItem', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    setPaneLayout.mockClear()
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
  })

  it('renders a compact two-line title and value preview without modified metadata', () => {
    const fact = createFact()
    const factsController = {
      isAuthorizedToRenderValue: jest.fn().mockReturnValue(true),
      openFact: jest.fn(),
      copyFactValue: jest.fn(),
    } as unknown as FactsController

    act(() => {
      root.render(<FactListItem fact={fact} factsController={factsController} selected={false} />)
    })

    expect(container.textContent).toContain('Store card')
    expect(container.textContent).toContain('ABC123')
    expect(container.textContent).not.toContain('Modified')
  })

  it('opens the fact detail pane when tapped', async () => {
    const fact = createFact()
    const factsController = {
      isAuthorizedToRenderValue: jest.fn().mockReturnValue(true),
      openFact: jest.fn().mockResolvedValue(undefined),
      copyFactValue: jest.fn(),
      deleteFact: jest.fn(),
    } as unknown as FactsController

    await act(async () => {
      root.render(<FactListItem fact={fact} factsController={factsController} selected={false} />)
    })

    const row = container.querySelector(`#${fact.uuid}`)
    expect(row).not.toBeNull()

    await act(async () => {
      row?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(factsController.openFact).toHaveBeenCalledWith(fact)
    expect(setPaneLayout).toHaveBeenCalledWith(PaneLayout.Editing)
  })

  it('deletes from the row action without opening the fact', async () => {
    const fact = createFact()
    const factsController = {
      isAuthorizedToRenderValue: jest.fn().mockReturnValue(true),
      openFact: jest.fn(),
      copyFactValue: jest.fn(),
      deleteFact: jest.fn().mockResolvedValue(undefined),
    } as unknown as FactsController

    await act(async () => {
      root.render(<FactListItem fact={fact} factsController={factsController} selected={false} />)
    })

    const deleteButton = container.querySelector('button[aria-label="Delete fact"]')
    expect(deleteButton).not.toBeNull()

    await act(async () => {
      deleteButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(factsController.deleteFact).toHaveBeenCalledWith(fact)
    expect(factsController.openFact).not.toHaveBeenCalled()
  })
})
