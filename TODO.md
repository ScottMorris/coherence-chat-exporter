# Future Features TODO

- [ ] **Deduplication/Incremental Export**: Check if a conversation has already been exported to avoid overwriting or processing duplicates.
- [x] **Stats Dashboard**: A view to show stats about the exported conversations (total count, messages, top tags, etc.).
- [ ] **Search**: Ability to search for conversations by keyword before exporting.

## Full Review Findings (Review 1)

### Gaps & Missing Features
- [x] **Export Preview**: The `ExportPreview.tsx` component defined in SPEC is missing. Users transition directly from selection to export.
- [ ] **Claude Metadata**: `memories.json` and `users.json` are not parsed or included in the export data model.
- [x] **Tagging UI**: The `TaggingSetup` screen does not implement the explicit model download flow ("Download now? y/n") described in SPEC.
- [ ] **Test Fixes**:
  - [x] `src/providers/samples.test.ts` fails due to `ReferenceError: __dirname is not defined` (ESM issue).
  - [ ] `src/tagging/tagging.test.ts` is currently skipped (`it.skip`).
- [ ] **UI Testing**: Add tests for `TaggingSetup`, `Settings`, and `App` navigation flow.

### Refactoring Opportunities
- [x] **App.tsx Logic**: The `App` component is a "God Object". Refactor routing and state into `AppRouter` or custom hooks (e.g., `useAppFlow`).
- [x] **CLI Duplication**: `src/cli.ts` duplicates export pipeline logic from `App.tsx`. Extract a shared `ExportManager` or service.

### Discrepancies
- **Export Flow**: The explicit "Review" step (ExportPreview) before export is skipped in the current implementation.
