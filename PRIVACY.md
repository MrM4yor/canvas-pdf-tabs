# Canvas PDF Tabs: data handling

Effective October 15, 2026. Maintainer: Alon Meir. Questions: open an issue at https://github.com/MrM4yor/canvas-pdf-tabs/issues (do not attach private coursework, signed file URLs or credentials).

## Access and network requests

The extension operates on University of Utah Canvas course pages at utah.instructure.com. It reads supported file links and, where necessary, requests file metadata to determine whether the link is a PDF. When you open a PDF, it requests metadata and document bytes from Canvas using your existing browser session. It does not request your password, an API token, or permission to read cookies through the cookies API.

If file access fails, the extension may request the Canvas current-user profile endpoint and inspect the HTTP response status to distinguish an expired login from other access failures. It does not parse or store the profile response body. Canvas receives these requests and handles them under its own policies.

PDF rendering, text search, annotation positioning and document fingerprinting run locally using bundled PDF.js and browser APIs. The extension has no developer-operated server, advertising, analytics or telemetry. It does not send document contents, annotations or usage events to the maintainer or an analytics service. Clicking an external link inside a PDF opens the destination website normally.

## Local data

While a reader tab is open, PDF bytes and the file name are held in memory. Session storage retains temporary file ID, source Canvas URL, tab IDs and request context; reader-tab cleanup removes its request descriptor. These session records are not synchronized by the extension.

Chrome extension local storage retains saved bookmarks, names, note text and positions/styles, selected highlight text and rectangles, page numbers, timestamps, file ID and a SHA-256 document fingerprint. Defaults and named note-style presets are also local. The selected theme is held only for the current reader tab. The fingerprint separates replaced file versions; older annotations remain locally stored rather than being silently attached to a changed document.

These records stay in the current Chrome profile on this computer. The extension does not use Chrome sync storage or embed them into PDFs. Simultaneous edits to the same entry use last-writer behavior. Download explicitly saves the original PDF without extension annotations.

## Removal and control

Remove individual annotations in the sidebar and saved styles in Note settings. Uninstalling the extension or clearing its extension storage removes its local saved data; this does not delete PDFs you deliberately downloaded. Old-version records persist until extension storage is cleared. There is no cloud backup or annotation export in this release.

## Permissions

- `storage`: local annotations and presets, plus temporary reader request context.
- `https://utah.instructure.com/*`: authenticated Canvas metadata/PDF access; the content script is limited to `/courses/*` and does not run on the dashboard.

The extension requests no all-sites, cookies, history or downloads permission.
