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
import { FactsController } from '@/Controllers/FactsController'
import FactListItem from './FactListItem'

jest.mock('@/Components/Icon/Icon', () => ({
  __esModule: true,
  default: () => <span />,
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
})
