---
doc: spec
status: approved
---

# Canvas PDF Tabs — Technical Spec

## How This Works, In Plain Language

A small listener on University of Utah Canvas recognizes a PDF click. A tab coordinator opens our own reader, either in front or in the background. That reader obtains the PDF through the learner's existing authorized Canvas access and uses Mozilla's PDF.js to display it with our compact controls. Each reader keeps its document independent of later Canvas navigation.

Everything runs in Chrome on the learner's Windows laptop. No backend, new account, AI service, or hosted PDF viewer is needed. The document's bytes must be fetched to read it, but opening it will not create a file in Downloads. Only pressing Download requests that action.

## The Core Journey Through the System

Implements prd.md > The Core Journey; PDF Opening and Tab Lifetime.

1. A content script on https://utah.instructure.com/ inspects supported assignment/Files links and records the file ID and PDF evidence (metadata, type or filename).
2. On an eligible normal or Ctrl+click it cancels Canvas's default action synchronously, then sends a narrowly defined open-file message to the extension service worker. Ordinary non-PDF links retain normal behavior. File links lacking enough evidence require a metadata-resolution strategy verified in the first checkpoint, not guessing from any URL containing 'files'.
3. The worker validates the sender and file identity, records source-tab context, and opens an extension viewer URL containing an opaque request ID. It uses active:true for normal clicks and active:false for Ctrl+click. Reopening the same PDF may create another tab in this POC.
4. The viewer resolves the request, obtains file metadata and authorized PDF bytes, and hands the bytes to PDF.js. Signed URLs and authentication data are not placed in viewer URL parameters or public logs.
5. PDF.js owns page rendering, text/search and annotation link layers; our controls operate its viewer components. The full document stays in the viewer's memory so source-tab navigation does not interrupt reading.
6. On explicit Download, save a Blob of the original bytes using a temporary download link and a sanitized original filename. Revoke temporary Blob URLs when no longer needed. Do not auto-trigger a download on fetch/render failure.

## Stack

- Chrome Manifest V3, a module service worker, content script, and extension viewer page. Accepted by the learner as the recommended local extension architecture.
- Plain JavaScript modules, HTML, and CSS. No UI framework or backend; minimizes unfamiliar tools and setup.
- Mozilla PDF.js: pin the exact compatible release and matching worker/viewer assets during the first build. Official getting-started page currently lists 6.4.299; verify package availability and browser support before locking. Use its viewer components rather than implementing PDF parsing, search or link navigation from scratch. Bundle required worker, fonts, character maps and other assets locally, retaining license notices.
- Node/npm are development tools for dependency installation, packaging, and focused tests. Runtime requires only Chrome. No API keys are planned.

Docs: https://mozilla.github.io/pdf.js/getting_started/ ; https://github.com/mozilla/pdf.js ; https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3

## Where It Runs and How Someone Tries It

Build output is planned as dist/ at the project root. The build will supply npm scripts: `npm ci`, `npm run build`, and `npm test`. These are planned commands, not implemented or executed yet.

In desktop Chrome, open chrome://extensions, enable Developer mode, click Load unpacked, and select dist/. Sign in to https://utah.instructure.com/ in the same Chrome profile. Reload Canvas after installing/reloading the extension. Test a PDF link from an assignment and the Files page. After extension changes, rebuild, reload the extension, and refresh affected tabs.

The learner explicitly agreed to enabling Developer mode and loading the local extension. No Web Store publication or hosting is required. A short demo video and public GitHub repository remain curriculum deliverables. Use synthetic/public fixtures for repository tests; do not commit course PDFs, account details or signed links.

## Look and Feel

Implements prd.md > Screens and Layout; Look and Feel.

Compact neutral toolbar, system sans-serif font, document-centered canvas and accessible labeled buttons. Filename left; page controls center-left; zoom/fitting center-right; Find, Download and Theme right. One/two-page toggle bottom-right without covering content. Search bar below toolbar on right. No tool rails, marketing, popups or open-by-default sidebar.

CSS variables implement light/dark palettes; System follows prefers-color-scheme and changes live. PDF pages retain source colors. Default theme is System; any selection is held for the current viewer session. Persisting theme preferences is not a POC requirement.

## Components

### Canvas Listener

Implements prd.md > PDF Opening and Tab Lifetime.

Use capture-phase delegated click handling so dynamically inserted Canvas links work. Scope content-script matches to the Utah Canvas host. Confirm actual assignment and Files DOM/link forms at checkpoint one. Intercept normal and Ctrl+left clicks only; do not invent alternate-click behavior. Metadata lookup must not allow an async race to invoke Canvas's original PDF handler. Leave non-PDF links and explicit Canvas download controls alone. Avoid reading or modifying assignment submissions.

### Tab Coordinator

Implements prd.md > PDF Opening and Tab Lifetime; States and Boundaries.

Module service worker validates message shape, sender host/tab, file ID and permitted URL paths. It stores only small request descriptors in chrome.storage.session so worker suspension does not lose an open request. Viewer messages must originate from this extension's viewer. Open, activate, or reload tabs using chrome.tabs; no broad browsing-history access is needed. Clean descriptors on viewer closure and expire stale entries. Never rely solely on in-memory worker globals.

Docs: https://developer.chrome.com/docs/extensions/reference/api/tabs ; https://developer.chrome.com/docs/extensions/reference/api/storage

### Authorized File Loader

Implements prd.md > PDF Opening and Tab Lifetime; States and Boundaries.

Read file metadata through GET /api/v1/files/:id and fetch its returned authorized file URL or verified Canvas file route. Expected metadata fields include id, display_name/filename, content-type and url; confirm actual response at checkpoint one. Perform credentialed session access without extracting cookies, storing passwords, or requesting a personal access token. Test whether extension-origin requests work; same-origin Canvas-side metadata retrieval via the listener is a bounded alternative if necessary. Never bridge arbitrary caller-supplied URLs.

Fetch PDF bytes from the viewer, not through a long-running worker or JSON message carrying the full document. Initially request only https://utah.instructure.com/* plus storage; add only verified file-serving origins if redirects require them. Host permission enables network access, not authorization. Do not request all-sites, cookies, downloads, or network interception permissions without demonstrated need and an updated explanation.

Use AbortController and explicit loading/error states. Validate actual content (including PDF header), not just a .pdf filename. HTML login responses, 401s, and 403s need classification: confirm expired session separately before refreshing Canvas. An inaccessible file with an otherwise live session is not login expiry. Do not send Canvas credentials to unrelated origins or implement authentication-page scraping.

Docs: https://developerdocs.instructure.com/services/canvas/resources/files ; https://developer.chrome.com/docs/extensions/develop/concepts/network-requests

### PDF Reader and Controls

Implements prd.md > Zoom and Page Layout; Page Navigation and PDF Links; Text Search; Theme and Explicit Download.

Use bundled PDF.js PDFViewer, EventBus, PDFLinkService and PDFFindController, with matching worker and styles. Adapt the viewer UI to the agreed toolbar. Lazy render visible/nearby pages, include text and annotation layers, and update current page/zoom from viewer events. Render at appropriate device pixel ratio; rerender after zoom settles rather than stretching a low-resolution canvas permanently.

Wire minus/plus, percentage, fit-page/fit-width, bounded integer page entry, previous/next, single/two-page spread, continuous scrolling, and search result count/navigation. Ctrl+F opens our search; Escape closes it; Ctrl+0 resets PDF zoom to 100%. Handle supported Chrome touchpad pinch events with a non-passive scoped listener and test on the learner's physical touchpad to avoid double browser/document scaling. Maintain the visible reading position through scale changes where supported.

External ordinary http/https links open separately with opener protection; internal PDF destinations use the reader link service. Do not execute embedded PDF scripts or arbitrary action URLs. Scanned documents without text do not acquire OCR search.

### Error and Return Flow

Implements prd.md > States and Boundaries.

Confirmed session expiry: show sign-in message, validate that the recorded originating tab still belongs to Utah Canvas, then refresh and activate it once per failed attempt. Do not reload another site if that tab navigated away. If the source tab is closed or no longer Canvas, show a return link to the recorded Canvas page rather than modifying an unrelated tab. User clicks the PDF again after login; no automatic reopening loop.

Other failures: show a plain message plus Retry and Back to Canvas. Retry re-resolves metadata/URLs rather than reusing potentially expired signed links. Back to Canvas activates the still-valid source tab or opens the recorded Utah Canvas page. Missing request context after extension reload shows a recoverable return-to-Canvas error.

## Data Model

- Request descriptor in chrome.storage.session: requestId, fileId, sourceTabId, sourceCanvasUrl, createdAt, optional displayName, viewerTabId. Only trusted extension contexts access this store. No PDF bytes, cookies or permanent signed URLs are stored here.
- Metadata/download URL: transient viewer memory; refreshed on retry. No logging of tokens or query-string signatures.
- Original PDF bytes and PDF.js document: viewer memory until tab closes; rendering caches are managed by PDF.js. Browser networking may cache responses normally; this is not an extension Downloads-folder save.
- Viewer settings: page, scale, spread, search query, theme and status in that viewer's memory. Source Canvas navigation does not reset them. Browser restart/tab-close persistence is not guaranteed.
- No bookmark/note database in this build. Future work can use chrome.storage.local keyed by Canvas origin/file ID with a file-replacement policy.

## File Structure

```text
project/
  manifest.json               # MV3 registration and narrow permissions
  package.json                # Pinned dependencies and build/test commands
  package-lock.json           # Reproducible dependency resolution
  src/
    canvas-listener.js        # Canvas links and click handling
    background.js             # Request descriptors and tab coordination
    file-loader.js            # Metadata, bytes and error classification
    shared/
      contracts.js            # Validated messages, IDs, allowed origins
    viewer/
      viewer.html             # Reading toolbar, document and error surfaces
      viewer.js               # PDF.js integration and control wiring
      viewer.css              # Compact layout and three theme modes
  scripts/
    build.mjs                 # Copy/bundle source and matching PDF.js assets
  tests/
    links.test.js             # Supported links, non-PDF and modifier cases
    contracts.test.js         # Sender/input validation and origin restrictions
    errors.test.js            # Expiry versus forbidden/network classification
    fixtures/                 # Synthetic PDFs: links, search, odd page count
  dist/                       # Generated unpacked extension; not source
  devpost/                    # Canonical planning and later build checklist
  README.md                   # Load/reload, tests, limitations, demo steps
  THIRD_PARTY_NOTICES.md       # PDF.js attribution/license
  .gitignore                  # Preserve existing profile/credential exclusions
```

## External Services and Dependencies

Canvas is the only required live service. Calls are read-only GET requests for file metadata and file contents under the learner's existing permissions. No new paid API or hosting fee is planned; the learner already has institutional Canvas access. Rate limits/institutional policies are not verified: fetch on demand, avoid course-wide scans, and honor throttling responses rather than retrying rapidly.

Chrome APIs supply tab handling and transient request storage. PDF.js is an Apache-2.0 library bundled in the extension, not a remote viewer service. Keep its license and notices. No runtime CDN code or remote executable scripts, in keeping with Manifest V3 packaging.

## Verification and Build Order

1. Prove the risky vertical slice first: real assignment and Files links, authorized PDF retrieval, first-page rendering, foreground/background tabs, and no Downloads entry with Acrobat still installed. Record actual origins and session behavior without logging secrets. If session access is blocked, stop polishing and resolve the access design; simulated data cannot prove this kernel.
2. Complete the PDF.js reading surface with synthetic fixtures: sharp zoom, pinch, Ctrl+0, fitting, page/spread navigation, links and search including zero matches.
3. Add themes, explicit original-PDF download, error/retry/back behavior and closed/navigated source-tab handling. Test denial separately from expired login; mock failures for repeatability and label them as simulated, supplementing with a safe live session test where feasible.
4. Verify the full PRD journey on the learner's Canvas and touchpad. Use Chrome download history and the Downloads folder to confirm no saved files during passive reading; test intentional download separately. Non-PDF Canvas interactions must still work. Run focused unit tests for link recognition, contracts and error routing; manual Chrome testing is required for extension/Canvas integration.

## Important Failure Modes

Session probe implementation: after an access failure only, GET https://utah.instructure.com/api/v1/users/self/profile with existing session credentials. Inspect HTTP status only; do not parse, persist or log profile data. A 401 confirms unauthenticated API access; 403/network/unknown responses remain ordinary access failures and do not automatically refresh a tab. Endpoint docs: https://developerdocs.instructure.com/services/canvas/resources/users#get-user-profile

- Institution-specific auth/redirect restrictions: investigate before UI polish. Do not promise they are resolved. A materially broader permission or token-based approach needs an explained plan revision.
- Canvas DOM/link changes or uncertain file type: use verified metadata/link forms and avoid intercepting unrelated content. Record any unsupported required entry point as incomplete, not a silent success.
- PDF fetch/render or network failure: explanatory viewer state, Retry and Back to Canvas; never automatic download.
- Expired session versus locked file: only confirmed expiry triggers source refresh. Unknown classification gets a neutral access error and manual return.
- Touchpad/browser zoom interaction: real-device checkpoint; not assumed proven by button zoom tests.

## What Was Simplified and Why

One institution/browser, plain web files, an existing PDF engine, local loading and no backend keep the build focused. Bookmarks/notes, tab deduplication and cross-session reading restoration are deferred as agreed. No bespoke PDF parser, account system, database, hosted deployment or store release is needed to demonstrate the workflow.

## Decisions and Open Issues

Accepted consequential choices: JavaScript/HTML/CSS, bundled PDF.js, self-contained MV3 extension, no backend/new account, and local Developer mode installation. The learner reports limited web-development knowledge; the listener/coordinator/viewer roles were explained in plain language, and small checkpoints will connect requirements to evidence for the agentic-workflow learning goal.

Useful unknown: whether the viewer can obtain Canvas PDFs through the existing signed-in session. The agreed first investigation is a real authenticated PDF-opening test before polishing controls. This remains unresolved, not a proven capability.

Derived implementation defaults (not additional user commitments): System theme at opening, transient request storage, PDF.js viewer components, strict message validation and the file structure above. Build may adjust internal file boundaries while preserving behavior.

Remaining build investigations: actual assignment/Files DOM shapes, session credential behavior and redirect hosts, confirmed expiry detection, Acrobat coexistence, package compatibility and touchpad pinch. These are bounded early tests; any discovery requiring changed user behavior or broader data access must return for discussion before being treated as an accepted change.

### Dashboard exclusion (learner-requested refinement)
Inject the Canvas listener only on /courses/*, never the dashboard. Existing handlers check the current path before doing work if navigation occurs without a reload. This does not change PDF reading on assignments, course home pages or Files.
