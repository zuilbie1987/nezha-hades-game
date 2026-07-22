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

test('standard C Richter draw notes use B on holes 3 and 7', async () => {
  const AudioEngine = await loadBrowserClass(
    'public/assets/js/AudioEngine.js',
    'AudioEngine',
  );
  const engine = new AudioEngine();
  const hole7Blow = engine.BLOW_FREQS[6];
  const hole7Draw = engine.DRAW_FREQS[6];

  assert.equal(engine.DRAW_FREQS[2], 493.88);
  assert.equal(hole7Draw, 987.77);
  assert.ok(Math.abs(hole7Blow / hole7Draw - Math.pow(2, 1 / 12)) < 0.0001);
});

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
  const reportedNotes = [];
  controller.onNoteStart = note => reportedNotes.push(note);

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
  assert.equal(reportedNotes.length, 1);
  assert.equal(reportedNotes[0].hole, 1);
  assert.equal(reportedNotes[0].type, 'blow');
  assert.equal(reportedNotes[0].semitones, 0);

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

test('practice catalog contains three blues exercises and one Irish folk exercise', async () => {
  const source = await readFile(new URL('public/assets/js/BluesPractice.js', projectRoot), 'utf8');
  const context = vm.createContext({
    performance: { now: () => 1000 },
    requestAnimationFrame: () => 1,
  });
  vm.runInContext(
    `${source}\nglobalThis.songs = BLUES_PRACTICE_SONGS; globalThis.Practice = BluesPractice; globalThis.makeSong = createPracticeSong;`,
    context,
  );
  const [song, classicSong, irishSong, westernSong] = context.songs;

  assert.equal(context.songs.length, 4);
  assert.equal(song.bpm, 84);
  assert.equal(song.notes.length, 48);
  assert.equal(new Set(Array.from(song.notes, note => note.bar)).size, 12);
  assert.equal(song.notes.every(note => note.lane >= 0 && note.lane < 7), true);
  assert.deepEqual(
    Array.from(song.lanes, lane => lane.note),
    ['G', 'Bb', 'C', 'Db', 'D', 'F', 'G'],
  );
  assert.equal(classicSong.id, 'st-louis-blues');
  assert.equal(classicSong.composer, 'W.C. Handy');
  assert.equal(classicSong.bpm, 88);
  assert.equal(classicSong.notes.length, 48);
  assert.equal(new Set(Array.from(classicSong.notes, note => note.bar)).size, 12);
  assert.equal(irishSong.id, 'salley-gardens');
  assert.equal(irishSong.category, 'folk');
  assert.equal(irishSong.composer, 'Traditional Irish');
  assert.equal(irishSong.bpm, 96);
  assert.equal(irishSong.totalBeats, 64);
  assert.equal(irishSong.pickupBeats, 1);
  assert.equal(irishSong.notes.length, 76);
  assert.equal(new Set(Array.from(irishSong.notes, note => note.bar)).size, 17);
  assert.equal(irishSong.lanes.length, 10);
  assert.deepEqual(
    Array.from(new Set(Array.from(irishSong.notes, note => note.durationBeats))).sort(),
    [0.5, 1, 1.5, 2, 3],
  );
  assert.deepEqual(
    Array.from(irishSong.notes.slice(0, 3), note => [note.tab, note.beat, note.durationBeats]),
    [['+4', 0, 0.5], ['-4', 0.5, 0.5], ['+5', 1, 1]],
  );
  assert.equal(westernSong.id, 'from-the-west-theme');
  assert.equal(westernSong.category, 'blues');
  assert.equal(westernSong.composer, 'Indiara Sfair');
  assert.equal(westernSong.bpm, 100);
  assert.equal(westernSong.totalBeats, 32);
  assert.equal(westernSong.notes.length, 44);
  assert.equal(new Set(Array.from(westernSong.notes, note => note.bar)).size, 8);
  assert.deepEqual(
    Array.from(new Set(Array.from(westernSong.notes, note => note.durationBeats))).sort(),
    [0.5, 0.75, 1, 1.5],
  );
  assert.equal(westernSong.notes.some((note, index, notes) => (
    index > 0 && note.beat > notes[index - 1].beat + notes[index - 1].durationBeats
  )), true);
  assert.deepEqual(
    Array.from(westernSong.notes.slice(0, 5), note => [note.tab, note.beat, note.durationBeats]),
    [['-4', 0, 0.5], ['-5', 0.5, 0.5], ['-6', 1, 1.5], ['-6′', 3, 0.5], ['-5', 3.5, 0.5]],
  );

  const restSong = context.makeSong({
    lanes: [{ tab: '+1', note: 'C', hole: 1, type: 'blow', semitones: 0 }],
    barChords: ['C'],
    events: [
      { tab: '+1', beat: 0, durationBeats: 1 },
      { tab: '+1', beat: 2, durationBeats: 1 },
    ],
    totalBeats: 4,
  });
  assert.equal(restSong.notes[1].beat - restSong.notes[0].durationBeats, 1);
  assert.equal(restSong.totalBeats, 4);

  const seekNotes = [0, 15.5, 16, 20].map(beat => ({
    beat,
    played: false,
    judged: false,
    el: { classList: createClassList() },
  }));
  const seekPractice = Object.create(context.Practice.prototype);
  Object.assign(seekPractice, {
    available: true,
    beatMs: 1000,
    mode: null,
    seekInputEl: { value: '16', max: '47' },
    seekValueEl: { innerHTML: '' },
    song: {
      leadInBeats: 4,
      beatsPerBar: 4,
      pickupBeats: 0,
      barChords: Array(12).fill('G7'),
      notes: seekNotes,
    },
    statusEl: { textContent: '' },
    stop() {},
    stopPreviewPlayers() {},
    updateScoreboard() {},
    setControls() {},
    updateFrame() {},
  });
  seekPractice.start('demo');
  assert.equal(seekPractice.startAt, -11000);
  assert.deepEqual(Array.from(seekNotes, note => note.played), [true, true, false, false]);

  seekPractice.seekToBeat(20);
  assert.equal(seekPractice.startAt, -19000);
  assert.equal(seekPractice.seekInputEl.value, 20);
  assert.equal(seekPractice.seekValueEl.innerHTML, '第 6 小节<br>00:20');

  const practice = Object.create(context.Practice.prototype);
  assert.equal(practice.gradeTiming(0.1), 'Perfect');
  assert.equal(practice.gradeTiming(0.3), 'Good');

  let scheduledDelay;
  const demoNote = {
    hole: 4,
    type: 'blow',
    semitones: 0,
    durationBeats: 1.5,
    el: { classList: createClassList() },
  };
  Object.assign(practice, {
    audioEngine: {
      BLOW_FREQS: Array(10).fill(440),
      DRAW_FREQS: Array(10).fill(440),
      playNote: () => ({}),
      stopNote() {},
    },
    beatMs: 1000,
    previewPlayers: new Set(),
    schedule(callback, delay) {
      scheduledDelay = delay;
    },
  });
  practice.playDemoNote(demoNote);
  assert.equal(scheduledDelay, 1380);

  const note = {
    hole: 2,
    type: 'draw',
    semitones: 0,
    beat: 0,
    judged: false,
    el: { classList: createClassList() },
  };
  Object.assign(practice, {
    mode: 'practice',
    startAt: 1000,
    beatMs: 1000,
    hitWindowBeats: 0.55,
    song: { notes: [note] },
    score: 0,
    combo: 0,
    hits: 0,
    updateScoreboard() {},
    showJudgement() {},
  });
  practice.handleHarmonicaNote({ hole: 2, type: 'draw', semitones: 0 });
  assert.equal(note.judged, true);
  assert.equal(practice.score, 1000);
  assert.equal(practice.combo, 1);
});

test('practice lesson remains indexable without JavaScript', async () => {
  const html = await readFile(new URL('harmonica.html', projectRoot), 'utf8');

  assert.match(html, /<link rel="canonical" href="https:\/\/neza-draw\.web\.app\/harmonica\.html">/);
  assert.match(html, /type="application\/ld\+json"/);
  assert.match(html, /G 调 12 小节蓝调音阶练习/);
  assert.match(html, /St\. Louis Blues/);
  assert.match(html, /W\.C\. Handy 1914 年作品/);
  assert.match(html, /爱尔兰画眉/);
  assert.match(html, /Down by the Salley Gardens/);
  assert.match(html, /C大调移调 · 96 BPM/);
  assert.match(html, /弱起、八分音符、附点音符与长音/);
  assert.match(html, /From the West/);
  assert.match(html, /Indiara Sfair · 核心主题改编 · 100 BPM/);
  assert.match(html, /本练习不是官方完整曲谱/);
  assert.match(html, /id="songSearch"/);
  assert.match(html, /data-song-filter="folk"/);
  assert.match(html, /id="demoSeek" type="range"/);
  assert.match(html, /选择试听开始位置/);
  assert.match(html, /试听起点.*指定小节开始试听/s);
  assert.match(html, /"hasPart"/);
  assert.match(html, /G–Bb–C–Db–D–F–G/);
  assert.match(html, /和声进行：G7 × 4小节/);
});
