# Shipping status and recording checklist

Repository: https://github.com/MrM4yor/canvas-pdf-tabs

Release: https://github.com/MrM4yor/canvas-pdf-tabs/releases/tag/v0.1.0 . Repository, planning documents, MIT license, privacy page and release ZIP were verified over unauthenticated HTTPS on October 15, 2026. Download SHA-256: `3ad0c04e26813850dac543b6e6729524aea516a4f4a100a4ae527103f3151ca1`.

Demo video: not recorded or uploaded yet. Store listing: not submitted yet. Devpost: not submitted.

## Demo: before and after, approximately 2 minutes 30 seconds

This is a shot/action checklist, not narration. Use your own words. The official rules ask for a demo under three minutes, visible working software, and a publicly viewable YouTube or Vimeo video: https://learn-ai-basics.devpost.com/rules . Check the signed-in submission form for its exact fields.

Prepare a readable PDF you own or have permission to show; avoid student names, grades and private course material. Keep the same browser size throughout. Hide unrelated tabs/bookmarks and notifications. No music is needed. The rules restrict unlicensed third-party material, including trademarks; check the before segment's visible material before publishing.

1. **0:00–0:20 — existing Canvas preview.** Disable Canvas PDF Tabs, refresh Canvas, click a PDF and show the limited viewing space. Keep this brief.
2. **0:20–0:40 — download workaround.** Download that same permitted PDF, open it through the normal Acrobat workflow, and show the extra steps/clutter that actually appear. Do not manufacture popups. Avoid exposing the rest of Downloads; use a tightly framed view or a prepared demonstration folder.
3. **0:40–1:05 — direct tabs.** Enable the extension, refresh Canvas, normal-click one PDF, then Ctrl+click another. Switch among the two reader tabs and navigate Canvas to show they stay open. Avoid filming extension setup if it makes the demonstration drag.
4. **1:05–1:35 — reading.** Zoom/reset, scroll, enter a page number, search a term and follow a permitted link. Show one/two-page layout or theme briefly if time allows. Show the absence of automatic new downloads in a clean, nonprivate view.
5. **1:35–2:15 — saved work.** Add a short note, name a bookmark, select text and highlight with Ctrl+Shift+H. Wait for the saved status. Close the reader, reopen the same PDF from Canvas, and click the sidebar entries to show persistence and precise navigation. Keep note-style presets out of the main sequence unless there is spare time.
6. **2:15–2:30 — availability.** Show the public repository and explain the tested Utah Canvas/desktop Chrome scope in your own words. Do not claim Web Store availability until a listing is actually approved and published.

On current Windows 11, Win+Shift+R opens Snipping Tool video capture. Select the browser area and enable microphone if narrating. Make a short test clip first to confirm audio/readability, then save the full recording. Trim pauses in Clipchamp if needed. Microsoft instructions: https://support.microsoft.com/en-au/windows/apps/use-snipping-tool-to-capture-screenshots .

Review the finished video for readability, sound, saved-annotation restoration and private material. Upload to YouTube or Vimeo with public viewing as the rules require, then check its link while signed out. Record the verified URL here; a local MP4 is not the submission link.

## Chrome Web Store checklist

1. Maintainer registers at https://chrome.google.com/webstore/devconsole and handles the one-time registration payment and account verification. No payment is made by the agent.
2. Run `npm ci`, `npm test`, `npm run package`. Upload `release/canvas-pdf-tabs-0.1.0.zip`; it contains manifest at archive root, local code/assets, PDF.js and the synthetic reviewer fixture, without personal files or node_modules.
3. Supply the listing name, your own description, icon and genuine screenshots. Clearly state University of Utah Canvas only; this extension is independent of the university, Canvas and Adobe. Do not imply endorsement.
4. Fill the single-purpose and privacy fields from actual behavior in `PRIVACY.md`. Declare local document/annotation access accurately even though there is no developer-operated collection. `storage` saves local annotations/presets and temporary request descriptors; the Utah host permission fetches authorized metadata/PDFs. Code is bundled; no remote executable code is used.
5. Use the public `PRIVACY.md` repository URL as the privacy-policy link and the issue tracker as support. Review those URLs after the push.
6. Provide test instructions: real interception requires an authorized Utah Canvas account. Do not share your campus password. The fixture at `chrome-extension://EXTENSION_ID/src/viewer/viewer.html?fixture=1` exercises reader/annotations without a campus account, but does not prove live interception. Include the recorded live demo; Google may still require a suitable test arrangement.
7. Confirm required image sizes/fields in the current dashboard, submit for review, and retain the item URL/status here. Uploading is not approval. Review may take days or weeks.

Store documentation: https://developer.chrome.com/docs/webstore/register/ ; https://developer.chrome.com/docs/webstore/publish ; https://developer.chrome.com/docs/webstore/review-process .

## Devpost handoff

- [x] Public repository link verified without sign-in, including scope/PRD/spec and MIT license.
- [ ] Accessible public demo video, showing the real working workflow, linked here.
- [ ] Learner-written project name, description and required submission answers.
- [ ] Learner exit-survey responses and any required eligibility/skill-use fields completed in the actual form.
- [ ] Submitted by the learner or with explicit authorization.

Store publication is optional and does not replace the video. The learner writes the public submission answers and narration; agent help is limited to technical mechanics and spelling/grammar corrections to learner-written copy.
