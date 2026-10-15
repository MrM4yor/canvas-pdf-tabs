---
doc: prd
status: approved
---

# Canvas PDF Tabs — Product Requirements

Working title: Canvas PDF Tabs. A desktop Chrome extension for reading University of Utah Canvas PDFs in separate tabs without automatic Downloads-folder copies.

## The Core Journey

Source: scope.md > The Core Loop; What "Working" Looks Like.

1. With the extension enabled, find a PDF on a signed-in University of Utah Canvas assignment or Files page.
2. Normal-click the PDF to open and activate its viewer tab. Ctrl+click opens the viewer in the background, leaving Canvas active.
3. Read, zoom, navigate pages, follow links, and search text in the viewer.
4. Open other PDFs and continue navigating Canvas; existing PDF tabs remain open and usable.
5. No file is automatically saved to Downloads. An explicit Download action remains available.

## Screens and Layout

Source: scope.md > Inspiration & Identity; The POC Boundary.

- Canvas remains the entry point; no separate dashboard is required.
- Viewer: one compact top toolbar and a large centered document area, with no sidebar open by default.
- Top left: filename, truncated when necessary with full name on hover.
- Top center-left: previous page, editable page number / total pages, next page.
- Top center-right: minus, current zoom percentage, plus, Fit width, Fit page.
- Top right: Find, Download, Theme (Light / Dark / System).
- Bottom right: compact One page / Two pages control, available without covering document content.
- Find opens a small bar below the toolbar on the right: query, match count, previous/next result, close.

## Look and Feel

Acrobat for Chrome is the agreed reference for familiar reading controls. Remove its promotional panels, tool rails, popups, and editing functionality. Keep controls compact and the document prominent. Support light, dark, and system-matching viewer themes; PDF pages retain original colors in each theme so diagrams remain accurate. No additional typography or branding preferences were established.

## Features and Behavior

### PDF Opening and Tab Lifetime

Source: scope.md > The Core Loop; The POC Boundary.

- Handle supported PDF links on assignments and the Files page, replacing the Canvas preview/download detour.
- Normal click opens an active viewer tab; Ctrl+click opens a background viewer tab.
- Multiple different PDFs can remain open independently of Canvas navigation.
- Preserve access restrictions: opening a viewer does not grant access to an unauthorized document.
- Do not automatically save a PDF as a local download, including on failure.
- Non-PDF interactions are outside interception's intended scope and retain their normal behavior.

Acceptance: open one assignment PDF and one Files-page PDF, verify foreground/background behavior, navigate Canvas, and confirm both PDFs remain usable with no new downloaded files.

### Zoom and Page Layout

Source: scope.md > Inspiration & Identity; What "Working" Looks Like.

- Text and vector content remain sharp after zoom rendering settles; image detail remains limited by the source PDF.
- Support laptop touchpad pinch zoom within the document, toolbar plus/minus, and visible current percentage.
- Ctrl+0 resets document zoom to 100%; Fit width and Fit page provide separate fitting actions.
- New PDF tabs start at 100% zoom, as requested during hands-on testing.
- Continuous vertical scrolling works in one-page and two-page layouts. Two-page layout displays consecutive pages side by side, with an unpaired final page still readable.

Acceptance: pinch and use buttons to change document scale, confirm percentage updates and sharp rendering, reset to 100%, and switch layouts while retaining access to every page.

### Page Navigation and PDF Links

Source: scope.md > Inspiration & Identity.

- Display current page and total count. Enter a valid page number and press Enter to navigate.
- Previous/next controls navigate pages and stop at document boundaries.
- Invalid page input must not leave the viewer unusable or navigate beyond the document.
- Support ordinary web links and internal page destinations embedded in the PDF. Handle external links without replacing the source Canvas tab.

Acceptance: jump to a specified page, navigate in both directions, verify bounds, and follow an internal destination and an external web link in suitable test PDFs.

### Text Search

Source: scope.md > Inspiration & Identity.

- Find and Ctrl+F open the document search bar. Escape closes it.
- Show and navigate matches in selectable PDF text, including across pages, and visibly indicate no matches.
- OCR for scanned/image-only pages is not included.

Acceptance: search a known phrase, confirm match indication/navigation, test an absent phrase, and close the bar with Escape.

### Theme and Explicit Download

Source: scope.md > Inspiration & Identity; The POC Boundary. The user explicitly added an intentional Download action during product discovery.

- Light, Dark, and System affect viewer chrome while preserving document colors.
- Download intentionally saves the original PDF through Chrome's normal download behavior. It is the only agreed automatic-download exception because it is directly requested by the reader.

Acceptance: demonstrate all theme modes and a user-initiated download. Opening and reading alone must not generate a download.

## States and Boundaries

- Loading: the viewer visibly indicates that the document is opening; no silent download fallback.
- Ready: document and available reading controls are shown.
- Expired Canvas session: refresh the originating Canvas tab and bring it forward so the learner can sign in. Authentication expiry must be distinguished from an ordinary access-denied file. If a viewer already opened, it shows a brief sign-in message. After login, the learner clicks the PDF again; no automatic reopening.
- Other errors (network interruption, removed/locked file, invalid PDF): keep the viewer tab with a plain explanation, Retry, and Back to Canvas. Do not refresh Canvas merely because a file is inaccessible.
- No search results: show a clear zero-results state.
- Reading tabs remain available during Canvas navigation. Persistence through closing tabs, browser restart, logout, or loss of file access is not promised.

## Product Decisions

- University of Utah Canvas in desktop Chrome is sufficient.
- A separate viewer is acceptable; Acrobat integration is unnecessary.
- Preserve normal-click foreground and Ctrl+click background behavior.
- Use the compact agreed layout with no promotional popups or default sidebars.
- Preserve original PDF page colors even in dark theme.
- Download remains an explicit optional action, rather than a side effect of reading.
- After verifying the core reader, the learner explicitly requested locally saved page bookmarks and editable page notes across reopenings.
- On expired login, return to refreshed Canvas; on other errors, offer Retry and Back to Canvas.

## What We're Building

The Canvas link-to-tab workflow, five core reading capabilities, agreed viewer layout, one/two-page modes, theme selection, explicit download, and actionable loading/error states. Demonstrate with a short video and provide a public GitHub repository as required by the curriculum. Store publication is optional.

## Deferred From the POC

Bookmarks and page notes were explicitly promoted into the build after reader verification. Their implementation is defined below. Existing notes must not be silently applied to replacement document contents.

Tab reuse for repeated clicks on the same PDF, remembered page/zoom, and broader Canvas link locations are not required for the first proof. Theme persistence between viewer sessions can be specified later and is not a success criterion here.

## Possible Later Enhancements

Cross-device synchronization and annotation export remain deferred. Download continues to mean the original PDF.

## Saved Page Bookmarks and Notes — Added After Reader Verification

Add a Bookmark page toggle beside page navigation and a Notes & bookmarks toolbar button opening a right sidebar. List saved bookmarks and plain-text page notes with page-jump buttons. Notes have an editor, automatic local saving while typing, visible save/error status and a retry-save action. Entries can be removed with Undo. Reopening the same Canvas PDF restores its entries, allowing page jumps and note edits.

Save in this Chrome profile under Canvas origin, file ID and content version, not filename. Other PDFs stay separate. Changed contents start a separate version; retain old-version entries and display a notice rather than silently attaching them to different pages. Multiple tabs share updates without overwriting unrelated entries. Page notes now also appear as draggable editable text boxes on their PDF page, with position retained across zoom and reopenings. Text selection highlights are included; freehand drawing and PDF content edits remain out. Uninstalling or clearing extension storage removes them.

Acceptance: bookmark and note a page, close and reopen its Canvas PDF, jump to saved entries and edit the note. Confirm another PDF is separate, saved changes appear in a second tab, and removal/Undo works. Download remains the original PDF without extension notes.

## Non-Goals

PDF content editing, freehand drawing, annotation export, OCR, Acrobat integration, other browsers/institutions, a cloud account system, and Chrome Web Store publication. These are not necessary to prove the learner's workflow.

## Open Questions

- Technical investigation for 4-spec/build: authenticated file access, PDF-serving redirects, installed Acrobat interaction, reliable expired-session detection, and supported attachment link forms. No live runtime test has yet occurred.
- Working title can remain Canvas PDF Tabs; no final branding is needed to test the product.
- No unresolved core product choices block technical planning. Detailed fit/navigation interactions can follow conventional reader behavior within these requirements.

### Named Bookmarks, Positioned Notes and Text Highlights — Learner Revision

Bookmarking a page immediately opens a name field; names autosave. Existing bookmarks can be renamed in the sidebar. Notes appear as editable text boxes on the page and can be moved by dragging their header; retain their page-relative location through zoom and reopening. Sidebar entries still jump to their pages and can edit/remove entries. Existing notes remain readable and receive a default position.

Select PDF text, then press Highlight to save translucent yellow highlights. Store per-line page-relative rectangles; no OCR for image-only scans. Highlights appear in the saved-items sidebar with page navigation and removal/Undo. They persist locally with the same file/version isolation as notes. Download still means the original, unmodified PDF. Acceptance includes naming/renaming, moving and reopening notes, highlighting selectable text, zooming with aligned highlights, and reopening the PDF to confirm all saved changes.
