import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const projectRoot = new URL('../', import.meta.url);

async function loadBrowserClass(relativePath, className, globals = {}) {
  const source = await readFile(new URL(relativePath, projectRoot), 'utf8');
  const context = vm.createContext({ ...globals });
  vm.runInContext(`${source}\nglobalThis.ExportedClass = ${className};`, context);
  return context.ExportedClass;
}

function createClassList() {
  const values = new Set();
  return {
    add: value => values.add(value),
    remove: value => values.delete(value),
    contains: value => values.has(value),
  };
}

test('touchstart only starts newly changed touches', async () => {
  const listeners = new Map();
  const wrap = {
    addEventListener: (name, listener) => listeners.set(name, listener),
  };
  const started = [];
  const UnifiedInput = await loadBrowserClass(
    'public/assets/js/UnifiedInput.js',
    'UnifiedInput',
    { window: { addEventListener() {} } },
  );

  new UnifiedInput(wrap, id => started.push(id), () => {}, () => {});
  listeners.get('touchstart')({
    preventDefault() {},
    target: {},
    touches: [{ identifier: 1 }, { identifier: 2 }],
    changedTouches: [{ identifier: 2, clientX: 10, clientY: 20 }],
  });

  assert.deepEqual(started, [2]);
});

test('controller keeps simultaneous notes active and stops every note on lifecycle cleanup', async () => {
  const audioCalls = { play: 0, stop: 0 };
  const audioEngine = {
    BLOW_FREQS: Array(10).fill(440),
    DRAW_FREQS: Array(10).fill(440),
    playNote() {
      audioCalls.play += 1;
      return {};
    },
    stopNote() {
      audioCalls.stop += 1;
    },
    updatePitch() {},
  };
  const document = { getElementById: () => null };
  const HarmonicaController = await loadBrowserClass(
    'public/assets/js/HarmonicaController.js',
    'HarmonicaController',
    { audioEngine, document, window: {} },
  );
  const controller = Object.create(HarmonicaController.prototype);
  controller.activeTouches = new Map();
  controller.holeSkillMap = [{ blow: [{ semitones: 3 }], draw: [] }];

  const baseButton = {
    dataset: { hole: '1', type: 'blow', semitones: '0' },
    classList: createClassList(),
  };
  const skillButton = {
    dataset: { hole: '1', type: 'blow', semitones: '3' },
    classList: createClassList(),
  };
  const buttons = [baseButton, skillButton];
  const column = {
    querySelectorAll(selector) {
      return selector.includes('data-type')
        ? buttons.filter(button => button.dataset.type === 'blow')
        : buttons;
    },
  };
  baseButton.closest = selector => selector === '.hole-col' ? column : baseButton;

  controller.handleStart(1, 100, baseButton);
  controller.handleStart(1, 100, baseButton);
  assert.equal(audioCalls.play, 1, 'a repeated touch id must not start another oscillator');

  controller.activeTouches.get(1).currentSemitones = 0;
  controller.activeTouches.set(2, {
    type: 'blow', currentSemitones: 3, colEl: column, player: {},
  });
  controller.refreshColumnVisual(column);
  assert.equal(baseButton.classList.contains('active'), true);
  assert.equal(skillButton.classList.contains('active'), true);

  controller.stopAll();
  assert.equal(controller.activeTouches.size, 0);
  assert.equal(audioCalls.stop, 2);
});

test('standard C Richter skill map separates bends from overbends', async () => {
  const grid = { innerHTML: '', appendChild() {} };
  const createElement = () => ({
    className: '', dataset: {}, innerHTML: '',
    appendChild() {},
  });
  const document = {
    hidden: false,
    getElementById: id => id === 'keyboardGrid' ? grid : {},
    createElement,
    addEventListener() {},
  };
  const HarmonicaController = await loadBrowserClass(
    'public/assets/js/HarmonicaController.js',
    'HarmonicaController',
    {
      audioEngine: {},
      document,
      window: { addEventListener() {} },
      UnifiedInput: class {},
    },
  );

  const controller = new HarmonicaController();
  assert.deepEqual(
    Array.from(controller.holeSkillMap[2].draw, item => item.semitones),
    [-1, -2, -3],
  );
  assert.deepEqual(
    Array.from(controller.holeSkillMap[9].blow, item => item.semitones),
    [-1, -2],
  );
  assert.equal(controller.holeSkillMap[5].blow[0].label, '超吹');
  assert.equal(controller.holeSkillMap[6].draw[0].label, '超吸');
});
