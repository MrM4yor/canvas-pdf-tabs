---
doc: scope
status: approved
---

# Canvas PDF Tabs (working title)

A Chrome extension that opens University of Utah Canvas PDFs in separate reading tabs without saving duplicate files to Downloads.

## The Unique Kernel

Keep Canvas as the easy place to find coursework, while replacing its PDF preview/download detour with a direct click-to-reading-tab experience. Preserve the reading functionality the learner gets from downloaded PDFs. This is a focused workflow improvement, not a claim that the underlying idea has never existed.

## Who It's For

The learner, a University of Utah student using desktop Chrome. They repeatedly find PDFs through Canvas assignments and the Files page, download them to escape the embedded preview, and accumulate duplicate assignment files.

## The Core Loop

Click a PDF in Canvas, read it in a separate tab, and return to Canvas to find another document. Multiple different PDFs remain open in their own tabs as the learner navigates between Canvas pages.

## Inspiration & Identity

A familiar, unobtrusive document-reading experience. Acrobat for Chrome is the learner's current satisfactory reading reference, but a separate viewer is explicitly acceptable. Required capabilities are sharp zoom, easy page scrolling, typed page-number navigation, clickable PDF links, and find/search. No other aesthetic preferences are established.

Research references (not runtime verification):
- Canvas file API: https://developerdocs.instructure.com/services/canvas/resources/files
- Chrome extension networking: https://developer.chrome.com/docs/extensions/develop/concepts/network-requests

## Why This Matters to the Learner

Avoid having "a million copies of every assignment" in Downloads while keeping the convenience of finding documents through Canvas. Practice planning, reviewing, and verifying work with an agent so the process can be reused on future projects.

## What "Working" Looks Like

On the learner's signed-in University of Utah Canvas, click a PDF from an assignment and another from the Files page. Each opens in a separate tab, and navigating elsewhere in Canvas leaves both documents available. No file is created in Downloads by these actions. Demonstrate sharp zoom, page scrolling, entering a page number, following a PDF link, and searching selectable text using suitable test documents.

The proof is a short screen demonstration showing the reading experience and the absence of new downloaded files. The curriculum submission also requires a short demo video and public GitHub repository; deployment/store publication is optional.

## The POC Boundary

- Desktop Chrome and University of Utah Canvas only.
- PDF opening from assignments and the Files page, plus the shared PDF-link handling needed for those entry points.
- Separate, persistent reading tabs for different PDFs.
- The five agreed reading capabilities, without requiring Acrobat integration.
- No automatic file saving to Downloads. Fetching PDF bytes to display them is still necessary.

Live authenticated Canvas access, file-serving behavior, and interaction with the installed Acrobat extension remain unverified technical risks. Support for other attachment locations is not yet guaranteed; inventory relevant link forms during requirements and implementation.

## Later

Possible ideas raised earlier, not required or committed: reusing a tab when reopening the same PDF and remembering the last page/zoom. Broader institution/browser support can be considered after the personal workflow works.

## Explicitly Cut

- PDF editing and annotation: the learner only reads, views, and finds information.
- Requiring Acrobat for Chrome: the learner accepts a separate viewer meeting the reading requirements.
- Other schools and browsers: University of Utah Canvas in Chrome is sufficient for this project.
- The screenshot-to-MATLAB tool: a separate idea, not needed to prove this workflow.
