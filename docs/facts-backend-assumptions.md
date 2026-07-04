# Facts Backend Assumption Checks

The client fork will introduce a new encrypted sync item type:

```ts
content_type: 'SN|Fact'
```

Expected encrypted item behavior:

- Facts sync through the existing `/v1/items` sync flow.
- The backend should treat `content` as opaque encrypted text.
- No backend field-level parsing of title/value/kind/notes is required or possible.
- Facts should use the same conflict, deletion, revision, and sync-token behavior as notes.
- Facts are normal items-key encrypted items, not root-key encrypted items.
- Facts do not use Files, valet tokens, or file byte storage.

Backend checks requested:

- Confirm the Go backend accepts `content_type: "SN|Fact"` and does not whitelist only current Standard Notes built-ins.
- Confirm item storage, revision storage, backup/export/import, and conflict handling preserve `SN|Fact`.
- Confirm sync responses return Facts unchanged in `retrieved_items` and `saved_items`.
- Confirm deleted Facts use the existing deleted item path.
- Confirm no server-side validation assumes notes/files/tags only.

Immutability note:

- V1 immutability is client-enforced through UX warnings and authorization before editing.
- Server-side semantic immutability is not planned for v1 because Fact content is encrypted and opaque to the backend.
- If stronger immutability is desired later, use an append-only client model or a separate encrypted version item pattern.
