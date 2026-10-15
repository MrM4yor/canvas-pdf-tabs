# Canvas PDF Tabs

An in-progress local Chrome extension for University of Utah Canvas. It opens PDF attachments in independent reading tabs without automatically saving files to Downloads.

## Current checkpoint

PDF opening and reading controls are learner-verified on live Utah Canvas, including assignments, class home pages and nested Files folders. The dashboard is excluded. Themes, intentional original-PDF Download and access recovery are implemented and awaiting final hands-on review. Bookmarks and notes are deferred.

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

Only Utah Canvas is permitted. Unexpected file-serving hosts currently produce an explanation rather than requesting all-sites access. Session access and Files-page markup need live verification. No PDF contents are sent to a service we operate. Bookmarks, notes, saved reading positions and other institutions are not implemented.

The extension uses bundled Mozilla PDF.js; see THIRD_PARTY_NOTICES.md.
