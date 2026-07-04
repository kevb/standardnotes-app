import { WebApplication } from '@/Application/WebApplication'
import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import ProtectedItemOverlay from '@/Components/ProtectedItemOverlay/ProtectedItemOverlay'
import { FactItem, FactKind } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'

type Props = {
  application: WebApplication
  fact: FactItem
}

const factKinds: FactKind[] = ['plain', 'phone', 'card', 'account', 'id', 'code', 'address']

const FactView = ({ application, fact }: Props) => {
  const factsController = application.factsController
  const [title, setTitle] = useState(fact.title)
  const [value, setValue] = useState(fact.value)
  const [kind, setKind] = useState<FactKind>(fact.kind || 'plain')
  const [notes, setNotes] = useState(fact.notes || '')
  const [saving, setSaving] = useState(false)
  const showProtectedOverlay = !factsController.isAuthorizedToRenderValue(fact)

  useEffect(() => {
    setTitle(fact.title)
    setValue(fact.value)
    setKind(fact.kind || 'plain')
    setNotes(fact.notes || '')
  }, [factsController, fact])

  const hasChanges = useMemo(
    () =>
      title !== fact.title || value !== fact.value || kind !== (fact.kind || 'plain') || notes !== (fact.notes || ''),
    [fact, kind, notes, title, value],
  )

  const onReveal = useCallback(async () => {
    await factsController.revealFact(fact)
  }, [factsController, fact])

  const onSave = useCallback(async () => {
    setSaving(true)
    try {
      await factsController.updateFact(fact, { title, value, kind, notes })
    } finally {
      setSaving(false)
    }
  }, [factsController, fact, kind, notes, title, value])

  const onProtectionChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      factsController.setFactProtection(fact, event.target.checked).catch(console.error)
    },
    [factsController, fact],
  )

  if (showProtectedOverlay) {
    return (
      <ProtectedItemOverlay
        showAccountMenu={application.showAccountMenu}
        hasProtectionSources={application.hasProtectionSources()}
        onViewItem={onReveal}
        itemType="fact"
      />
    )
  }

  return (
    <div className="section editor sn-component flex h-full flex-col overflow-y-auto p-5 pt-safe-top">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Icon type="details-block" className="flex-shrink-0 text-info" />
            <input
              className="w-full min-w-0 border-0 bg-transparent text-2xl font-semibold text-text focus:shadow-none focus:outline-none md:text-xl"
              value={title}
              placeholder="Untitled fact"
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <Button small onClick={() => factsController.copyFactValue(fact).catch(console.error)}>
            Copy
          </Button>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-passive-0">Value</span>
          <textarea
            className="min-h-[5rem] resize-y rounded border border-border bg-default p-3 text-base text-text focus:outline-none focus:ring-2 focus:ring-info lg:text-sm"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Fact value"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-passive-0">Kind</span>
          <select
            className="rounded border border-border bg-default p-2 text-base text-text focus:outline-none focus:ring-2 focus:ring-info lg:text-sm"
            value={kind}
            onChange={(event) => setKind(event.target.value as FactKind)}
          >
            {factKinds.map((factKind) => (
              <option key={factKind} value={factKind}>
                {factKind}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-passive-0">Notes</span>
          <textarea
            className="min-h-[7rem] resize-y rounded border border-border bg-default p-3 text-base text-text focus:outline-none focus:ring-2 focus:ring-info lg:text-sm"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional context"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" checked={fact.protected} onChange={onProtectionChange} />
          Require authentication to view this fact
        </label>

        <div className="flex flex-wrap gap-3">
          <Button primary disabled={!hasChanges || saving} onClick={onSave}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
          <Button colorStyle="danger" onClick={() => factsController.deleteFact(fact).catch(console.error)}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

export default observer(FactView)
