import test from 'node:test';
import assert from 'node:assert/strict';
import { parsedPage, pinchScaleFactor, wireReaderControls } from '../src/viewer/reader-controls.js';

test('page entry rejects invalid and out-of-range values without rounding', () => {
  for (const value of ['', '0', '-1', '2.5', '1e2', '11', 'hello']) assert.equal(parsedPage(value, 10), null);
  assert.equal(parsedPage(' 10 ', 10), 10);
});

function setup() {
  class Element {
    handlers = {}; value = ''; hidden = true; attrs = {};
    addEventListener(name, handler) { this.handlers[name] = handler; }
    setAttribute(name, value) { this.attrs[name] = value; }
    focus() {} select() {}
  }
  const nodes = new Map();
  const dom = new Element();
  dom.getElementById = id => { if (!nodes.has(id)) nodes.set(id,new Element()); return nodes.get(id); };
  const listeners = {}, events = [];
  const eventBus = { on: (name, handler) => { listeners[name] = handler; }, dispatch: (name, value) => events.push({name,value}) };
  const viewer = { currentPageNumber:1, pagesCount:3, currentScale:1, currentScaleValue:'page-width', increaseScale(){}, decreaseScale(){}, updateScale(options){ this.lastScale = options; } };
  const container = new Element();
  wireReaderControls({ viewer,eventBus,container,document:dom });
  listeners.pagesinit();
  return { viewer,dom,listeners,events,container,$:dom.getElementById };
}

test('reader handlers navigate bounded pages, reset zoom and switch spreads', () => {
  const a = setup();
  a.$('pageNumber').value = '3'; a.$('pageNumber').handlers.change();
  assert.equal(a.viewer.currentPageNumber,3);
  a.$('nextPage').handlers.click(); assert.equal(a.viewer.currentPageNumber,3);
  a.$('pageNumber').value = '999'; a.$('pageNumber').handlers.change();
  assert.equal(a.$('pageNumber').value,'3');
  a.$('twoPages').handlers.click(); assert.equal(a.viewer.spreadMode,1);
  a.$('onePage').handlers.click(); assert.equal(a.viewer.spreadMode,0);
  a.viewer.currentScale=2;
  a.dom.handlers.keydown({ctrlKey:true,key:'0',preventDefault(){}});
  assert.equal(a.viewer.currentScale,1);
});

test('search opens by keyboard, moves backward and reports no matches', () => {
  const a = setup();
  a.dom.handlers.keydown({ctrlKey:true,key:'f',preventDefault(){}});
  assert.equal(a.$('findBar').hidden,false);
  a.$('findInput').value='copper lantern'; a.$('findPrevious').handlers.click();
  assert.equal(a.events.at(-1).value.findPrevious,true);
  a.listeners.updatefindcontrolstate({state:1,matchesCount:{current:0,total:0}});
  assert.equal(a.$('findCount').textContent,'No matches');
  a.dom.handlers.keydown({key:'Escape',preventDefault(){}});
  assert.equal(a.$('findBar').hidden,true);
});

test('pinch consumes browser zoom events but ordinary scrolling stays untouched', () => {
  const a = setup(); let prevented = false;
  a.container.handlers.wheel({ctrlKey:false,preventDefault(){prevented=true;}});
  assert.equal(prevented,false);
  a.container.handlers.wheel({ctrlKey:true,deltaY:-20,deltaMode:0,clientX:100,clientY:150,preventDefault(){prevented=true;}});
  assert.equal(prevented,true); assert.ok(a.viewer.lastScale.scaleFactor>1);
  assert.ok(pinchScaleFactor(99999)>0); assert.ok(pinchScaleFactor(-99999)<3);
});
