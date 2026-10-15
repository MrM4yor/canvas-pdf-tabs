# Canvas PDF Tabs

An in-progress local Chrome extension for University of Utah Canvas. It opens PDF attachments in independent reading tabs without automatically saving files to Downloads.

## Current checkpoint

PDF opening and reading controls are learner-verified on live Utah Canvas, including assignments, class home pages and nested Files folders. The dashboard is excluded. Themes, intentional original-PDF Download and access recovery are implemented and awaiting final hands-on review. Local bookmarks/page notes are implemented and awaiting a hands-on persistence check.

## Build and load

1. Install Node.js and Git, and use an up-to-date desktop Chrome (the bundled PDF.js modern build targets current browsers).
2. Run `npm ci`, then `npm run build` in this folder.
3. In Chrome open `chrome://extensions`, enable Developer mode and choose **Load unpacked**.
4. Select this project's `dist` folder.
5. Refresh your signed-in Utah Canvas page.

After code changes, build again, reload the extension in Chrome and refresh Canvas.

## First real test

Keep Acrobat installed. Normal-click a PDF attachment in an assignment: the new **Canvas PDF Tabs** reader should become active. Ctrl+click a PDF from Files: the reader should open in the background. Navigate Canvas, then return to both reader tabs and scroll. Check Chrome's download history and your Downloads folder: opening the documents should not have saved any new files.

If a Canvas file still opens in the original preview, report whether it was from an assignment or Files, and what you clicked. If our reader shows an error, report its visible wording. Do not send signed download URLs, cookies or passwords.

## Tests and limitations

`npm test` runs focused tests for URL/message validation and PDF fetching. `node scripts/create-fixture.mjs` regenerates a synthetic test PDF. A local render check is available by opening `chrome-extension://EXTENSION_ID/src/viewer/viewer.html?fixture=1` with the ID shown in Chrome's extension card. This proves rendering only, not authenticated Canvas access.

Only Utah Canvas is permitted. Unexpected file-serving hosts currently produce an explanation rather than requesting all-sites access. Session access and Files-page markup need live verification. No PDF contents are sent to a service we operate. Saved reading positions and other institutions are not implemented; local bookmarks/page notes are described below.

The extension uses bundled Mozilla PDF.js; see THIRD_PARTY_NOTICES.md.

## Local bookmarks and page notes

Bookmark toggles the current page. Notes & bookmarks opens a right sidebar with saved page-jump entries and an Add note button. Notes save as you type; wait for Saved locally before closing the tab. Save again retries a failed save. Remove offers Undo within the current viewer session.

Entries are saved in this extension's chrome.storage.local on this computer/profile, not synced to Google or embedded in the PDF. Reopen the same Canvas PDF to restore them. A SHA-256 content fingerprint separates replacement versions; old entries are retained with a notice rather than attached to potentially wrong pages. Different notes use separate keys so independent tabs do not overwrite one shared document record. Simultaneous edits of the same note use last-writer behavior. Uninstalling or clearing extension storage removes saved items. Download continues to save the original PDF without extension notes.

### Positioned notes and highlights

Bookmarking opens a name field; Rename in the sidebar changes it later. Add note creates an editable yellow box on the page; drag its header to reposition it. Select PDF text and press Highlight to save a yellow selection highlight. Entries, names, positions and highlights remain local and restore with the same PDF. Scanned pages without selectable text do not support highlighting. The sidebar lists/removes entries and offers Undo. Exporting annotations or freehand drawing is not implemented; Download saves the original PDF.

### Note appearance and navigation

The note toolbar icon creates a note and opens Note settings. Click a note to select it; adjust background color and transparency there. Drag the lower-right grip to resize. Set as default saves the selected note's size/color/transparency for new notes. Save style creates a named preset; choose one and Apply to reuse it. Defaults and presets are local to this Chrome profile across PDFs, and existing notes keep their own styles.

The list icon opens All annotations: a compact Name / Type / Page / # table with Rename and Remove icons. Find, Download, Note, Highlight and list icons show labels on hover. Highlight selected PDF text with Ctrl+Shift+H while the document has focus; Ctrl+H retains Chrome History. Original-PDF download and file-version separation are unchanged.

All annotations now opens on document load. Creating annotations does not reopen or switch the sidebar; use Note settings explicitly to change appearance. Bookmark naming uses a floating field (Enter/Escape closes it). The navigation table has no numbering column. Multiline saved highlights use one filled path per entry so nested selection rectangles do not darken middle lines.
