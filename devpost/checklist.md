---
doc: checklist
status: approved
---

# Build Checklist

Build mode: learn

Git: learner approved initialization and slice checkpoints. Existing ignore rules exclude the learner profile and local credentials. Slice 1 committed as 8f59ed9 after learner verification. Project-local author identity configured with learner-provided details.

Current progress: learner confirmed named bookmarks, positioned notes and highlights work as intended. Slice 4 verified. Learner requested a further refinement: note styles/presets, resizing, tabbed sidebar, compact annotation table, toolbar icons and highlight shortcut.

## Slices

- [x] **1. Open a real Canvas PDF in an independent reading tab**
  Becomes usable: A locally loaded extension opens actual assignment and Files-page PDFs in viewer tabs without saving them to Downloads.
  Why now: Proves the core idea and risky authenticated access before viewer polish. Bootstrapping is included in this working path.
  PRD ref: `prd.md > The Core Journey`, `prd.md > PDF Opening and Tab Lifetime`
  Spec ref: `spec.md > Canvas Listener`, `spec.md > Tab Coordinator`, `spec.md > Authorized File Loader`, `spec.md > Where It Runs and How Someone Tries It`
  Build: Install and pin PDF.js; implement the package/build pipeline, narrow MV3 manifest, validated request descriptors, Canvas link handling and basic PDF rendering. Preserve foreground/background clicks and independent tabs. Inspect actual Utah Canvas links and redirects; test existing-session access with no new account/token. Provide visible loading/failure messages and do not silently download.
  Verify (mechanical): Run package/build and focused link/contract tests; load the extension and inspect a synthetic fixture for packaging/render errors. Then observe actual assignment and Files-page opening in authorized Chrome, foreground/background behavior, independence from Canvas navigation and absence of download-history entries. Record unobserved live checks as pending, never passed. Pause if live testing requires learner interaction.
  Learner check: Load dist in Chrome Developer mode, refresh signed-in Canvas, normal-click an assignment PDF and Ctrl+click a Files PDF. Navigate Canvas and confirm both documents remain available and Downloads stays unchanged. Report what happened.
  Commit: `Open Canvas PDFs in independent viewer tabs`

- [x] **2. Read and navigate PDFs with the agreed controls**
  Becomes usable: Sharp zoom, fit modes, page entry/arrows, internal/external links, cross-page search and one/two-page reading layouts.
  Why now: Builds on proven file access and completes the useful reading experience rather than cosmetic scaffolding.
  PRD ref: `prd.md > Zoom and Page Layout`, `prd.md > Page Navigation and PDF Links`, `prd.md > Text Search`, `prd.md > Screens and Layout`
  Spec ref: `spec.md > PDF Reader and Controls`, `spec.md > Look and Feel`
  Build: Integrate PDF.js viewer components/text/link layers and compact toolbar. Add zoom percentage/buttons, touchpad pinch, Ctrl+0, fitting, bounded page navigation, spread toggle, and Ctrl+F search with counts/results/Escape. Keep original document colors.
  Verify (mechanical): Build and run focused control tests; inspect synthetic multipage PDFs with known search terms, internal/external links and odd page counts. Verify search/no-match states, navigation bounds, sharp rendering and keyboard shortcuts. Observe pinch behavior on the learner's physical touchpad before declaring it passed.
  Learner check: On a coursework PDF, zoom with the touchpad and buttons, reset with Ctrl+0, jump pages, change layouts, search and follow a link. Compare the reading experience with the agreed Acrobat reference.
  Commit: `Add PDF reading and navigation controls`

- [x] **3. Finish themes, intentional download and recovery**
  Becomes usable: The reader supports light/dark/system appearance, explicitly downloading the original, and useful recovery from login/file/network failures.
  Why now: Completes the end-to-end product after access and reading are established.
  PRD ref: `prd.md > Theme and Explicit Download`, `prd.md > States and Boundaries`, `prd.md > Look and Feel`
  Spec ref: `spec.md > Error and Return Flow`, `spec.md > Authorized File Loader`, `spec.md > Verification and Build Order`
  Build: Add themes and source-color preservation, original-byte Download, Retry and Back to Canvas. Distinguish confirmed session expiry from file denial; refresh/activate only a still-valid Canvas source tab. Handle source closure/navigation and missing request context safely. Complete README and attribution.
  Verify (mechanical): Run build and all focused tests; test error classification with labeled simulated cases and safe live access checks where possible. Verify themes, explicit download content/name, no automatic download on errors and correct source-tab behavior. Repeat the full real Canvas PRD journey and report any unverified cases.
  Learner check: Try themes and deliberate Download; exercise the agreed recovery cases with guidance, then freely use the extension on coursework and report anything broken or confusing.
  Commit: `Finish viewer themes download and recovery`

- [x] **4. Keep page bookmarks and notes across reopenings**
  Becomes usable: Saved page bookmarks and editable notes return with the same Canvas PDF and jump directly to their pages.
  Why now: Learner explicitly requested the previously deferred addition after the core reader passed testing.
  PRD ref: `prd.md > Saved Page Bookmarks and Notes — Added After Reader Verification`
  Spec ref: `spec.md > Local Annotation Store and Sidebar`, `spec.md > Data Model`
  Build: Add local per-entry storage, content-version identity, bookmark toggle, sidebar, autosaving page-note editor, jump buttons, Remove/Undo and cross-tab updates. Preserve the reader and original-PDF download.
  Verify (mechanical): Test persistence after reopening, file/version isolation, unrelated concurrent writes, save ordering, removal/Undo, validation and recovery after storage failures. Run all tests and build. Label live checks pending until learner feedback.
  Learner check: Bookmark and note a page, close and reopen the same PDF from Canvas, jump to entries and edit. Try another PDF and another tab, removal/Undo, and normal reader controls with the sidebar open.
  Commit: `Persist local PDF bookmarks and page notes`
## Hands-on Checkpoints

- [x] Early usable behavior explored — after slice 1, real Canvas PDF access and click/tab behavior
- [ ] Final kick-the-tires exploration and feedback completed — after slice 3

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — follow one actual Canvas click through the listener, coordinator and viewer, connecting the risk-first checkpoint to reusable agentic workflow
- [ ] Optional edit and transfer reflection addressed — offer once after revisions
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: not yet performed
Route and stops: to be recorded from actual finished code
Edit outcome: not yet offered
Reflection: not yet offered; personal responses belong in the ignored learner profile
Activity mode: not yet established

## Revisions

- Learner tested local saved items and requested bookmark names, draggable on-page text boxes and highlights. Extended slice 4, PRD and spec accordingly. Added page-relative coordinates and selection rectangles to individually keyed records without changing existing identities; existing notes receive default positions. Original-PDF Download remains unchanged.

- Learner explicitly promoted local bookmarks and page notes after confirming the core reader works. Added slice 4 and updated scope/PRD/spec. The original Download behavior is unchanged; local notes use per-entry records and content-version separation.

- Slice 2 learner check: all reader controls worked, but opening fit-width was inconvenient and search/link overlays were offset. Changed initial scale to 100% and scoped our border-box CSS to interface controls; the global rule was shrinking PDF.js page canvases relative to their overlay coordinate system. Awaiting confirmation of overlay alignment before committing slice 2.

- Learner confirmed slice 1 works on live Canvas. Per request, restricted injection to /courses/* and made existing listeners inert off course pages to isolate dashboard slowdown. Cause of slowdown remains unverified.

- First learner test confirmed assignment/home-page foreground and background tab opening, but the reader remained on Loading and Files-folder links bypassed it. Fixed a PDF.js integration error (the container must be a DIV), added guarded startup error reporting, and expanded file-preview parsing to folder paths. Replaced whole-page mutation scanning with link-local hover/focus checks to eliminate unnecessary dashboard scans and prefetches. Nine tests now cover the loader, contracts, actual folder-click handler, no startup scans, and required viewer markup; live retry remains pending.
