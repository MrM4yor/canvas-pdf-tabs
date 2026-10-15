import { CANVAS, canvasUrl, validOpenMessage } from './shared/contracts.js';

const viewerPath = chrome.runtime.getURL('src/viewer/viewer.html');
const key = id => `request:${id}`;

async function route(message, sender) {
  if (validOpenMessage(message)) {
    if (!canvasUrl(sender.url) || !sender.tab?.id) throw new Error('Invalid Canvas request.');
    const id = crypto.randomUUID();
    const descriptor = {
      fileId: message.fileId, sourceTabId: sender.tab.id,
      sourceCanvasUrl: sender.url, createdAt: Date.now()
    };
    await chrome.storage.session.set({ [key(id)]: descriptor });
    const tab = await chrome.tabs.create({ url: `${viewerPath}?request=${id}`, active: !message.background });
    await chrome.storage.session.set({ [key(id)]: { ...descriptor, viewerTabId: tab.id } });
    return { ok: true };
  }
  if (!sender.url?.startsWith(`${viewerPath}?`) || !sender.tab?.id ||
      typeof message?.requestId !== 'string' || !/^[\da-f-]{36}$/.test(message.requestId)) {
    throw new Error('Invalid viewer request.');
  }
  const descriptor = (await chrome.storage.session.get(key(message.requestId)))[key(message.requestId)];
  if (!descriptor || (descriptor.viewerTabId && descriptor.viewerTabId !== sender.tab.id)) {
    throw new Error('This reading session is no longer available. Open the PDF from Canvas again.');
  }
  if (message.type === 'GET_REQUEST') return { ok: true, descriptor };
  if (message.type === 'BACK_TO_CANVAS') {
    const tab = await chrome.tabs.get(descriptor.sourceTabId).catch(() => null);
    if (tab && canvasUrl(tab.url)) await chrome.tabs.update(tab.id, { active: true });
    else await chrome.tabs.create({ url: canvasUrl(descriptor.sourceCanvasUrl)?.href || CANVAS, active: true });
    return { ok: true };
  }
  throw new Error('Unknown viewer request.');
}

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  route(message, sender).then(respond, () => respond({ ok: false, error: 'Could not open this reading session. Return to Canvas and click the PDF again.' }));
  return true;
});

chrome.tabs.onRemoved.addListener(async tabId => {
  const requests = await chrome.storage.session.get(null);
  const expired = Object.entries(requests).filter(([name, value]) => name.startsWith('request:') && value.viewerTabId === tabId).map(([name]) => name);
  if (expired.length) await chrome.storage.session.remove(expired);
});
