const BLUES_SCALE_LANES = [
  { tab: '-2', note: 'G', hole: 2, type: 'draw', semitones: 0 },
  { tab: '-3′', note: 'Bb', hole: 3, type: 'draw', semitones: -1 },
  { tab: '+4', note: 'C', hole: 4, type: 'blow', semitones: 0 },
  { tab: '-4′', note: 'Db', hole: 4, type: 'draw', semitones: -1 },
  { tab: '-4', note: 'D', hole: 4, type: 'draw', semitones: 0 },
  { tab: '-5', note: 'F', hole: 5, type: 'draw', semitones: 0 },
  { tab: '+6', note: 'G', hole: 6, type: 'blow', semitones: 0 },
];

const IRISH_MELODY_LANES = [
  { tab: '+3', note: 'G', hole: 3, type: 'blow', semitones: 0 },
  { tab: '-3″', note: 'A', hole: 3, type: 'draw', semitones: -2 },
  { tab: '+4', note: 'C', hole: 4, type: 'blow', semitones: 0 },
  { tab: '-4', note: 'D', hole: 4, type: 'draw', semitones: 0 },
  { tab: '+5', note: 'E', hole: 5, type: 'blow', semitones: 0 },
  { tab: '+6', note: 'G', hole: 6, type: 'blow', semitones: 0 },
  { tab: '-6', note: 'A', hole: 6, type: 'draw', semitones: 0 },
  { tab: '-7', note: 'B', hole: 7, type: 'draw', semitones: 0 },
  { tab: '+7', note: 'C', hole: 7, type: 'blow', semitones: 0 },
  { tab: '-8', note: 'D', hole: 8, type: 'draw', semitones: 0 },
];

const FROM_THE_WEST_LANES = [
  { tab: '-4', note: 'D', hole: 4, type: 'draw', semitones: 0 },
  { tab: '+5', note: 'E', hole: 5, type: 'blow', semitones: 0 },
  { tab: '-5', note: 'F', hole: 5, type: 'draw', semitones: 0 },
  { tab: '+6', note: 'G', hole: 6, type: 'blow', semitones: 0 },
  { tab: '-6′', note: 'Ab', hole: 6, type: 'draw', semitones: -1 },
  { tab: '-6', note: 'A', hole: 6, type: 'draw', semitones: 0 },
  { tab: '-7', note: 'B', hole: 7, type: 'draw', semitones: 0 },
  { tab: '+7', note: 'C', hole: 7, type: 'blow', semitones: 0 },
  { tab: '-8', note: 'D', hole: 8, type: 'draw', semitones: 0 },
];

const FIRST_BLUES_MELODY = [
  ['-2', '-3′', '+4', '-4′'],
  ['-4', '-5', '+6', '-5'],
  ['-4', '-4′', '+4', '-3′'],
  ['-2', '-2', '-3′', '+4'],
  ['+4', '-4′', '-4', '-5'],
  ['+6', '-5', '-4', '+4'],
  ['-2', '-3′', '+4', '-4'],
  ['-5', '-4', '+4', '-3′'],
  ['-4', '-5', '+6', '-5'],
  ['+4', '-4′', '-4', '-5'],
  ['+6', '-5', '-4', '-3′'],
  ['-2', '-4', '-4′', '-2'],
];

const BAR_CHORDS = ['G7', 'G7', 'G7', 'G7', 'C7', 'C7', 'G7', 'G7', 'D7', 'C7', 'G7', 'D7'];

const ST_LOUIS_BLUES_MELODY = [
  ['-2', '-2', '-3′', '-2'],
  ['+4', '-3′', '-2', '-2'],
  ['-2', '-3′', '+4', '-4′'],
  ['-4', '-4′', '+4', '-3′'],
  ['+4', '+4', '-4′', '+4'],
  ['-5', '-4', '+4', '-3′'],
  ['-2', '-2', '-3′', '+4'],
  ['-4', '-5', '+6', '-5'],
  ['-4', '-4', '-5', '+6'],
  ['+6', '-5', '-4', '+4'],
  ['-3′', '+4', '-4′', '-4'],
  ['-2', '-4', '-3′', '-2'],
];

const SALLEY_GARDENS_EVENTS = [
  { tab: '+4', beat: 0, durationBeats: 0.5 },
  { tab: '-4', beat: 0.5, durationBeats: 0.5 },
  { tab: '+5', beat: 1, durationBeats: 1 },
  { tab: '-4', beat: 2, durationBeats: 0.5 },
  { tab: '+4', beat: 2.5, durationBeats: 0.5 },
  { tab: '-4', beat: 3, durationBeats: 1 },
  { tab: '+5', beat: 4, durationBeats: 0.5 },
  { tab: '+6', beat: 4.5, durationBeats: 0.5 },
  { tab: '-6', beat: 5, durationBeats: 2 },
  { tab: '+6', beat: 7, durationBeats: 1 },
  { tab: '+7', beat: 8, durationBeats: 0.5 },
  { tab: '+6', beat: 8.5, durationBeats: 0.5 },
  { tab: '-6', beat: 9, durationBeats: 1 },
  { tab: '+6', beat: 10, durationBeats: 0.5 },
  { tab: '+5', beat: 10.5, durationBeats: 0.5 },
  { tab: '-4', beat: 11, durationBeats: 1.5 },
  { tab: '+4', beat: 12.5, durationBeats: 0.5 },
  { tab: '-3″', beat: 13, durationBeats: 2 },
  { tab: '+3', beat: 15, durationBeats: 1 },
  { tab: '+4', beat: 16, durationBeats: 0.5 },
  { tab: '-4', beat: 16.5, durationBeats: 0.5 },
  { tab: '+5', beat: 17, durationBeats: 1 },
  { tab: '-4', beat: 18, durationBeats: 0.5 },
  { tab: '+4', beat: 18.5, durationBeats: 0.5 },
  { tab: '-4', beat: 19, durationBeats: 0.5 },
  { tab: '+4', beat: 19.5, durationBeats: 0.5 },
  { tab: '-4', beat: 20, durationBeats: 0.5 },
  { tab: '+5', beat: 20.5, durationBeats: 0.5 },
  { tab: '+6', beat: 21, durationBeats: 2 },
  { tab: '-6', beat: 23, durationBeats: 1 },
  { tab: '+7', beat: 24, durationBeats: 0.5 },
  { tab: '+6', beat: 24.5, durationBeats: 0.5 },
  { tab: '-6', beat: 25, durationBeats: 1 },
  { tab: '+6', beat: 26, durationBeats: 0.5 },
  { tab: '+5', beat: 26.5, durationBeats: 0.5 },
  { tab: '-4', beat: 27, durationBeats: 1.5 },
  { tab: '+4', beat: 28.5, durationBeats: 0.5 },
  { tab: '+4', beat: 29, durationBeats: 3 },
  { tab: '+6', beat: 32, durationBeats: 1 },
  { tab: '+7', beat: 33, durationBeats: 1 },
  { tab: '-7', beat: 34, durationBeats: 0.5 },
  { tab: '+6', beat: 34.5, durationBeats: 0.5 },
  { tab: '-6', beat: 35, durationBeats: 1 },
  { tab: '-7', beat: 36, durationBeats: 0.5 },
  { tab: '+7', beat: 36.5, durationBeats: 0.5 },
  { tab: '-7', beat: 37, durationBeats: 1.5 },
  { tab: '-6', beat: 38.5, durationBeats: 0.5 },
  { tab: '+6', beat: 39, durationBeats: 1 },
  { tab: '+5', beat: 40, durationBeats: 0.5 },
  { tab: '+6', beat: 40.5, durationBeats: 0.5 },
  { tab: '-6', beat: 41, durationBeats: 1 },
  { tab: '+6', beat: 42, durationBeats: 0.5 },
  { tab: '+5', beat: 42.5, durationBeats: 0.5 },
  { tab: '+6', beat: 43, durationBeats: 0.5 },
  { tab: '-6', beat: 43.5, durationBeats: 0.5 },
  { tab: '+7', beat: 44, durationBeats: 0.5 },
  { tab: '-8', beat: 44.5, durationBeats: 0.5 },
  { tab: '+7', beat: 45, durationBeats: 3 },
  { tab: '+4', beat: 48, durationBeats: 0.5 },
  { tab: '-4', beat: 48.5, durationBeats: 0.5 },
  { tab: '+5', beat: 49, durationBeats: 1 },
  { tab: '-4', beat: 50, durationBeats: 0.5 },
  { tab: '+4', beat: 50.5, durationBeats: 0.5 },
  { tab: '-4', beat: 51, durationBeats: 1 },
  { tab: '+5', beat: 52, durationBeats: 0.5 },
  { tab: '+6', beat: 52.5, durationBeats: 0.5 },
  { tab: '-6', beat: 53, durationBeats: 2 },
  { tab: '+6', beat: 55, durationBeats: 1 },
  { tab: '+7', beat: 56, durationBeats: 0.5 },
  { tab: '+6', beat: 56.5, durationBeats: 0.5 },
  { tab: '-6', beat: 57, durationBeats: 1 },
  { tab: '+6', beat: 58, durationBeats: 0.5 },
  { tab: '+5', beat: 58.5, durationBeats: 0.5 },
  { tab: '-4', beat: 59, durationBeats: 1.5 },
  { tab: '+4', beat: 60.5, durationBeats: 0.5 },
  { tab: '+4', beat: 61, durationBeats: 3 },
];

const FROM_THE_WEST_EVENTS = [
  { tab: '-4', beat: 0, durationBeats: 0.5 },
  { tab: '-5', beat: 0.5, durationBeats: 0.5 },
  { tab: '-6', beat: 1, durationBeats: 1.5 },
  { tab: '-6′', beat: 3, durationBeats: 0.5 },
  { tab: '-5', beat: 3.5, durationBeats: 0.5 },
  { tab: '-4', beat: 4, durationBeats: 0.5 },
  { tab: '+6', beat: 4.5, durationBeats: 1.5 },
  { tab: '-5', beat: 6.5, durationBeats: 0.5 },
  { tab: '+6', beat: 7, durationBeats: 0.5 },
  { tab: '-6', beat: 7.5, durationBeats: 0.5 },
  { tab: '+7', beat: 8, durationBeats: 0.5 },
  { tab: '-6', beat: 8.5, durationBeats: 1 },
  { tab: '-6′', beat: 10, durationBeats: 0.5 },
  { tab: '-5', beat: 10.5, durationBeats: 0.5 },
  { tab: '-4', beat: 11, durationBeats: 0.5 },
  { tab: '+6', beat: 11.5, durationBeats: 0.5 },
  { tab: '-4', beat: 12, durationBeats: 0.5 },
  { tab: '+5', beat: 12.5, durationBeats: 0.5 },
  { tab: '-5', beat: 13, durationBeats: 0.5 },
  { tab: '-6', beat: 13.5, durationBeats: 1 },
  { tab: '+6', beat: 14.5, durationBeats: 1 },
  { tab: '-4', beat: 15.5, durationBeats: 0.5 },
  { tab: '-4', beat: 16, durationBeats: 1.5 },
  { tab: '-6', beat: 18, durationBeats: 0.5 },
  { tab: '-8', beat: 18.5, durationBeats: 1.5 },
  { tab: '-6', beat: 20, durationBeats: 0.5 },
  { tab: '-8', beat: 20.5, durationBeats: 0.5 },
  { tab: '+7', beat: 21, durationBeats: 0.5 },
  { tab: '-7', beat: 21.5, durationBeats: 0.5 },
  { tab: '-6', beat: 22, durationBeats: 0.5 },
  { tab: '+6', beat: 22.5, durationBeats: 0.5 },
  { tab: '-8', beat: 23, durationBeats: 0.75 },
  { tab: '-6', beat: 24, durationBeats: 0.5 },
  { tab: '-8', beat: 24.5, durationBeats: 0.5 },
  { tab: '+7', beat: 25, durationBeats: 0.5 },
  { tab: '-7', beat: 25.5, durationBeats: 0.5 },
  { tab: '-6', beat: 26, durationBeats: 0.5 },
  { tab: '+6', beat: 26.5, durationBeats: 1.5 },
  { tab: '-5', beat: 28, durationBeats: 0.5 },
  { tab: '-4', beat: 28.5, durationBeats: 0.5 },
  { tab: '+5', beat: 29, durationBeats: 1 },
  { tab: '-5', beat: 30, durationBeats: 0.5 },
  { tab: '+5', beat: 30.5, durationBeats: 0.5 },
  { tab: '-4', beat: 31, durationBeats: 1 },
];

function getBarNumber(beat, beatsPerBar, pickupBeats = 0) {
  if (pickupBeats && beat < pickupBeats) return 1;
  return Math.floor((beat - pickupBeats) / beatsPerBar) + (pickupBeats ? 2 : 1);
}

function createPracticeSong(config) {
  const lanes = config.lanes || BLUES_SCALE_LANES;
  const barChords = config.barChords || BAR_CHORDS;
  const beatsPerBar = config.beatsPerBar || 4;
  const pickupBeats = config.pickupBeats || 0;
  const events = config.events || config.melody.flatMap((bar, barIndex) => (
    bar.map((tab, beatInBar) => ({
      tab,
      beat: barIndex * beatsPerBar + beatInBar,
      durationBeats: 1,
    }))
  ));
  const totalBeats = config.totalBeats || Math.max(...events.map(event => (
    event.beat + event.durationBeats
  )));
  return {
    beatsPerBar,
    leadInBeats: 4,
    lanes,
    barChords,
    pickupBeats,
    totalBeats,
    ...config,
    notes: events.map(event => {
      const lane = lanes.findIndex(item => item.tab === event.tab);
      const bar = getBarNumber(event.beat, beatsPerBar, pickupBeats);
      return {
        ...lanes[lane],
        ...event,
        lane,
        bar,
        chord: barChords[bar - 1],
      };
    }),
  };
}

const BLUES_PRACTICE_SONGS = [
  createPracticeSong({
    id: 'g-blues-scale',
    category: 'blues',
    lesson: '第 1 课 · C 调口琴二把位',
    title: 'G 调 12 小节蓝调音阶练习',
    intro: '使用 G–Bb–C–Db–D–F–G 七声音阶完成标准 12 小节蓝调进行。先试听熟悉旋律，再在音符到达判定线时点击对应吹吸格。',
    bpm: 84,
    duration: '约 34 秒',
    melody: FIRST_BLUES_MELODY,
  }),
  createPracticeSong({
    id: 'st-louis-blues',
    category: 'blues',
    lesson: '第 2 课 · 经典蓝调入门改编',
    title: 'St. Louis Blues（圣路易斯蓝调）',
    intro: '根据 W.C. Handy 1914 年经典作品的蓝调句型制作入门改编，继续使用 C 调口琴的 G 调二把位，练习重复动机、压音和收束句。',
    bpm: 88,
    duration: '约 33 秒',
    composer: 'W.C. Handy',
    source: '1914 年公版乐谱入门改编',
    melody: ST_LOUIS_BLUES_MELODY,
  }),
  createPracticeSong({
    id: 'salley-gardens',
    category: 'folk',
    lesson: '第 3 课 · 爱尔兰民谣旋律练习',
    title: '爱尔兰画眉（Down by the Salley Gardens）',
    intro: '依据传统爱尔兰曲调的五线谱与 MIDI 节奏制作 C 大调十孔口琴移调版，保留弱起、八分音符、附点音符和长音。重点练习准确起拍与长句呼吸。',
    bpm: 96,
    duration: '约 40 秒',
    composer: 'Traditional Irish',
    source: '传统爱尔兰旋律五线谱移调',
    lanes: IRISH_MELODY_LANES,
    barChords: ['弱起', 'C', 'C', 'Am', 'F', 'C', 'C', 'G', 'C', 'C', 'F', 'C', 'Am', 'F', 'C', 'G', 'C'],
    pickupBeats: 1,
    totalBeats: 64,
    events: SALLEY_GARDENS_EVENTS,
  }),
  createPracticeSong({
    id: 'from-the-west-theme',
    category: 'blues',
    lesson: '第 4 课 · 西部蓝调核心主题',
    title: 'From the West（核心主题改编）',
    intro: '根据 Indiara Sfair《From the West》的公开视频与公开口琴谱，提取核心主题并重建为 8 小节时间线。使用 C 调十孔口琴演奏 D 小调音域，练习延音、空拍、高音区移动与 6 孔吸气半音压音。',
    bpm: 100,
    duration: '约 19 秒',
    composer: 'Indiara Sfair',
    source: '公开视频核心主题教学改编',
    lanes: FROM_THE_WEST_LANES,
    barChords: ['主题 A1', '主题 A2', '主题 A3', '主题 A4', '高音回答 1', '高音回答 2', '高音回答 3', '收束'],
    totalBeats: 32,
    events: FROM_THE_WEST_EVENTS,
  }),
];

class BluesPractice {
  constructor(audioEngineInstance) {
    this.audioEngine = audioEngineInstance;
    this.songs = BLUES_PRACTICE_SONGS;
    this.song = this.songs[0];
    this.beatMs = 60000 / this.song.bpm;
    this.hitWindowBeats = 0.55;
    this.mode = null;
    this.animationId = null;
    this.startAt = 0;
    this.score = 0;
    this.combo = 0;
    this.hits = 0;
    this.misses = 0;
    this.visibleSongLimit = 4;
    this.activeSongFilter = 'all';
    this.previewPlayers = new Set();
    this.timers = new Set();

    this.stageEl = document.getElementById('fallingStage');
    this.laneGridEl = document.getElementById('laneGrid');
    this.notesEl = document.getElementById('fallingNotes');
    this.statusEl = document.getElementById('practiceStatus');
    this.scoreEl = document.getElementById('practiceScore');
    this.comboEl = document.getElementById('practiceCombo');
    this.hitsEl = document.getElementById('practiceHits');
    this.barEl = document.getElementById('barIndicator');
    this.flashEl = document.getElementById('judgementFlash');
    this.demoButton = document.getElementById('demoSong');
    this.practiceButton = document.getElementById('startPractice');
    this.stopButton = document.getElementById('stopPractice');
    this.songButtons = [...document.querySelectorAll('[data-song-id]')];
    this.lessonEl = document.getElementById('lessonLabel');
    this.titleEl = document.getElementById('practiceTitle');
    this.introEl = document.getElementById('practiceIntro');
    this.tempoEl = document.getElementById('songTempo');
    this.durationEl = document.getElementById('songDuration');
    this.scaleGuideEl = document.getElementById('scaleGuide');
    this.songSearchEl = document.getElementById('songSearch');
    this.filterButtons = [...document.querySelectorAll('[data-song-filter]')];
    this.showMoreButton = document.getElementById('showMoreSongs');
    this.songResultsEl = document.getElementById('songResults');
    this.seekInputEl = document.getElementById('demoSeek');
    this.seekValueEl = document.getElementById('demoSeekValue');
    this.demoStartBeat = 0;

    this.renderGame();
    this.bindControls();
    this.renderSongInfo();
    this.applySongFilters();
    this.available = false;
    this.setControls(false);
    this.updateFrame(-this.song.leadInBeats);

    window.addEventListener('pagehide', () => this.stop());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stop();
    });
  }

  renderGame() {
    this.laneGridEl.innerHTML = '';
    this.notesEl.innerHTML = '';
    this.stageEl.style.setProperty('--lane-count', this.song.lanes.length);

    this.song.lanes.forEach(lane => {
      const laneEl = document.createElement('button');
      laneEl.className = 'game-lane';
      laneEl.type = 'button';
      laneEl.setAttribute('aria-label', `演奏 ${lane.tab} ${lane.note}`);
      laneEl.addEventListener('click', () => this.playLane(lane));
      const label = document.createElement('span');
      label.textContent = `${lane.tab} ${lane.note}`;
      laneEl.appendChild(label);
      this.laneGridEl.appendChild(laneEl);
    });

    this.song.notes.forEach(note => {
      const noteEl = document.createElement('div');
      noteEl.className = `falling-note ${note.type}`;
      noteEl.style.setProperty('--lane', note.lane);
      noteEl.dataset.duration = note.durationBeats;
      noteEl.textContent = note.tab;
      note.el = noteEl;
      this.notesEl.appendChild(noteEl);
    });
  }

  bindControls() {
    this.demoButton.addEventListener('click', () => this.start('demo'));
    this.practiceButton.addEventListener('click', () => this.start('practice'));
    this.stopButton.addEventListener('click', () => this.stop());
    this.songButtons.forEach(button => {
      button.addEventListener('click', () => this.selectSong(button.dataset.songId));
    });
    this.songSearchEl.addEventListener('input', () => this.applySongFilters());
    this.filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.activeSongFilter = button.dataset.songFilter;
        this.applySongFilters();
      });
    });
    this.showMoreButton.addEventListener('click', () => {
      this.visibleSongLimit += 4;
      this.applySongFilters(false);
    });
    this.seekInputEl.addEventListener('input', () => {
      this.seekToBeat(Number(this.seekInputEl.value));
    });
  }

  applySongFilters(resetLimit = true) {
    if (resetLimit) this.visibleSongLimit = 4;
    const query = this.songSearchEl.value.trim().toLocaleLowerCase('zh-CN');
    const matches = this.songButtons.filter(button => {
      const matchesCategory = this.activeSongFilter === 'all'
        || button.dataset.category === this.activeSongFilter;
      const matchesQuery = !query || button.textContent.toLocaleLowerCase('zh-CN').includes(query);
      return matchesCategory && matchesQuery;
    });

    this.songButtons.forEach(button => {
      const matchIndex = matches.indexOf(button);
      button.hidden = matchIndex === -1 || matchIndex >= this.visibleSongLimit;
    });
    this.filterButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.songFilter === this.activeSongFilter));
    });
    this.showMoreButton.hidden = matches.length <= this.visibleSongLimit;
    this.songResultsEl.textContent = matches.length
      ? `找到 ${matches.length} 首曲目`
      : '没有符合条件的曲目';
  }

  selectSong(songId) {
    const nextSong = this.songs.find(song => song.id === songId);
    if (!nextSong || nextSong === this.song || this.mode) return;

    this.stop(true);
    this.song = nextSong;
    this.beatMs = 60000 / this.song.bpm;
    this.score = 0;
    this.combo = 0;
    this.hits = 0;
    this.misses = 0;
    this.renderGame();
    this.renderSongInfo();
    this.updateScoreboard();
    this.updateFrame(-this.song.leadInBeats);
    this.statusEl.textContent = this.available
      ? `已选择《${this.song.title}》，可以试听或练习`
      : `已选择《${this.song.title}》，开启音频引擎后开始`;
  }

  renderSongInfo() {
    this.lessonEl.textContent = this.song.lesson;
    this.titleEl.textContent = this.song.title;
    this.introEl.textContent = this.song.intro;
    this.tempoEl.textContent = `${this.song.bpm} BPM`;
    this.durationEl.textContent = this.song.duration;
    this.laneGridEl.setAttribute('aria-label', `${this.song.title}可演奏音阶轨道`);
    this.scaleGuideEl.innerHTML = '';
    this.scaleGuideEl.setAttribute('aria-label', `${this.song.title}口琴谱`);
    this.song.lanes.forEach(lane => {
      const item = document.createElement('span');
      const tab = document.createElement('b');
      tab.textContent = lane.tab;
      item.append(tab, ` ${lane.note}`);
      this.scaleGuideEl.appendChild(item);
    });
    this.songButtons.forEach(button => {
      const isSelected = button.dataset.songId === this.song.id;
      button.classList.toggle('active', isSelected);
      button.setAttribute('aria-pressed', String(isSelected));
    });
    this.seekInputEl.max = Math.max(...this.song.notes.map(note => note.beat));
    this.syncSeekControl(0);
  }

  setControls(isRunning) {
    this.demoButton.disabled = isRunning || !this.available;
    this.practiceButton.disabled = isRunning || !this.available;
    this.stopButton.disabled = !isRunning;
    this.songButtons.forEach(button => {
      button.disabled = isRunning;
    });
    this.songSearchEl.disabled = isRunning;
    this.filterButtons.forEach(button => {
      button.disabled = isRunning;
    });
    this.showMoreButton.disabled = isRunning;
    this.seekInputEl.disabled = !this.available || this.mode === 'practice';
  }

  enable() {
    this.available = true;
    this.setControls(false);
    this.statusEl.textContent = '音频已开启：可先试听示范或直接开始练习';
  }

  start(mode) {
    if (!this.available) return;

    const startBeat = mode === 'demo' ? Number(this.seekInputEl.value) : 0;
    this.stop(true);
    this.mode = mode;
    this.demoStartBeat = startBeat;
    this.startAt = performance.now() + (this.song.leadInBeats - startBeat) * this.beatMs;
    this.score = 0;
    this.combo = 0;
    this.hits = 0;
    this.misses = 0;

    this.song.notes.forEach(note => {
      note.judged = false;
      note.played = mode === 'demo' && note.beat < startBeat;
      note.el.classList.remove('hit', 'miss', 'preview');
    });
    if (mode === 'practice') this.syncSeekControl(0);

    this.updateScoreboard();
    this.setControls(true);
    this.statusEl.textContent = mode === 'demo'
      ? '试听准备：跟随下落音符熟悉旋律'
      : '练习准备：音符到达黄线时点击对应轨道或口琴格';
    this.animationId = requestAnimationFrame(now => this.tick(now));
  }

  tick(now) {
    if (!this.mode) return;

    const currentBeat = (now - this.startAt) / this.beatMs;
    this.updateFrame(currentBeat);

    if (this.mode === 'demo') {
      this.syncSeekControl(Math.max(this.demoStartBeat, currentBeat));
      this.song.notes.forEach(note => {
        if (!note.played && currentBeat >= note.beat) this.playDemoNote(note);
      });
    } else {
      this.song.notes.forEach(note => {
        if (!note.judged && currentBeat > note.beat + this.hitWindowBeats) {
          this.markMiss(note);
        }
      });
    }

    if (currentBeat > this.song.totalBeats + 0.75) {
      this.finish();
      return;
    }
    this.animationId = requestAnimationFrame(nextNow => this.tick(nextNow));
  }

  updateFrame(currentBeat) {
    const judgementY = this.stageEl.clientHeight - 64;
    const pixelsPerBeat = (judgementY + 36) / this.song.leadInBeats;
    const barCount = this.song.barChords.length;
    const currentBar = Math.max(1, Math.min(barCount, getBarNumber(
      Math.max(0, currentBeat),
      this.song.beatsPerBar,
      this.song.pickupBeats,
    )));
    this.barEl.textContent = currentBeat < 0
      ? `准备 · 第 1/${barCount} 小节 · ${this.song.barChords[0]}`
      : `第 ${currentBar}/${barCount} 小节 · ${this.song.barChords[currentBar - 1]}`;

    this.song.notes.forEach(note => {
      const y = judgementY - (note.beat - currentBeat) * pixelsPerBeat;
      const noteHeight = Math.max(30, note.durationBeats * pixelsPerBeat - 6);
      const noteTop = y - noteHeight + 30;
      note.el.style.height = `${noteHeight}px`;
      note.el.style.transform = `translate3d(0, ${noteTop}px, 0)`;
      note.el.style.visibility = y > -noteHeight && y < this.stageEl.clientHeight + 36
        ? 'visible'
        : 'hidden';
    });
  }

  seekToBeat(requestedBeat) {
    if (this.mode === 'practice') return;

    const beat = Math.max(0, Math.min(Number(this.seekInputEl.max), requestedBeat));
    this.demoStartBeat = beat;
    this.syncSeekControl(beat);
    this.updateFrame(beat);

    if (this.mode === 'demo') {
      this.stopPreviewPlayers();
      this.song.notes.forEach(note => {
        note.played = note.beat < beat;
      });
      this.startAt = performance.now() - beat * this.beatMs;
      this.statusEl.textContent = `已跳转到${this.seekPositionText(beat)}继续试听`;
    } else {
      this.statusEl.textContent = `试听起点已设为${this.seekPositionText(beat)}`;
    }
  }

  syncSeekControl(beat) {
    const clampedBeat = Math.max(0, Math.min(Number(this.seekInputEl.max), beat));
    this.seekInputEl.value = clampedBeat;
    this.seekValueEl.innerHTML = this.seekPositionText(clampedBeat, '<br>');
  }

  seekPositionText(beat, separator = ' · ') {
    const bar = Math.max(1, Math.min(this.song.barChords.length, getBarNumber(
      beat,
      this.song.beatsPerBar,
      this.song.pickupBeats,
    )));
    const seconds = Math.floor(beat * this.beatMs / 1000);
    const minutesText = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secondsText = String(seconds % 60).padStart(2, '0');
    return `第 ${bar} 小节${separator}${minutesText}:${secondsText}`;
  }

  playDemoNote(note) {
    note.played = true;
    note.el.classList.add('preview');
    const baseFreq = note.type === 'blow'
      ? this.audioEngine.BLOW_FREQS[note.hole - 1]
      : this.audioEngine.DRAW_FREQS[note.hole - 1];
    const player = this.audioEngine.playNote(baseFreq, note.semitones);
    this.previewPlayers.add(player);

    this.schedule(() => {
      this.audioEngine.stopNote(player);
      this.previewPlayers.delete(player);
      note.el.classList.remove('preview');
    }, this.beatMs * note.durationBeats * 0.92);
  }

  playLane(lane) {
    if (this.mode !== 'practice') return;

    const baseFreq = lane.type === 'blow'
      ? this.audioEngine.BLOW_FREQS[lane.hole - 1]
      : this.audioEngine.DRAW_FREQS[lane.hole - 1];
    const player = this.audioEngine.playNote(baseFreq, lane.semitones);
    this.previewPlayers.add(player);
    this.schedule(() => {
      this.audioEngine.stopNote(player);
      this.previewPlayers.delete(player);
    }, this.beatMs * 0.35);
    this.handleHarmonicaNote(lane);
  }

  handleHarmonicaNote(playedNote) {
    if (this.mode !== 'practice') return;

    const currentBeat = (performance.now() - this.startAt) / this.beatMs;
    const key = this.noteKey(playedNote);
    const candidate = this.song.notes
      .filter(note => !note.judged && this.noteKey(note) === key)
      .map(note => ({ note, distance: Math.abs(note.beat - currentBeat) }))
      .filter(item => item.distance <= this.hitWindowBeats)
      .sort((a, b) => a.distance - b.distance)[0];

    if (!candidate) {
      this.combo = 0;
      this.updateScoreboard();
      this.showJudgement('错音', 'miss');
      return;
    }

    const grade = this.gradeTiming(candidate.distance);
    candidate.note.judged = true;
    candidate.note.el.classList.add('hit');
    this.hits += 1;
    this.combo += 1;
    this.score += grade === 'Perfect' ? 1000 : 600;
    this.updateScoreboard();
    this.showJudgement(grade, grade === 'Perfect' ? '' : 'good');
  }

  gradeTiming(distanceBeats) {
    return distanceBeats <= 0.18 ? 'Perfect' : 'Good';
  }

  markMiss(note) {
    note.judged = true;
    note.el.classList.add('miss');
    this.misses += 1;
    this.combo = 0;
    this.updateScoreboard();
    this.showJudgement('Miss', 'miss');
  }

  noteKey(note) {
    return `${note.hole}:${note.type}:${Math.round(note.semitones)}`;
  }

  updateScoreboard() {
    this.scoreEl.textContent = this.score;
    this.comboEl.textContent = this.combo;
    this.hitsEl.textContent = `${this.hits}/${this.song.notes.length}`;
  }

  showJudgement(text, className) {
    this.flashEl.textContent = text;
    this.flashEl.className = `judgement-flash ${className}`;
    clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => {
      this.flashEl.textContent = '';
    }, 420);
  }

  schedule(callback, delay) {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      callback();
    }, delay);
    this.timers.add(timer);
  }

  finish() {
    const finishedMode = this.mode;
    this.mode = null;
    this.animationId = null;
    this.setControls(false);
    this.stopPreviewPlayers();
    if (finishedMode === 'demo') {
      this.demoStartBeat = 0;
      this.syncSeekControl(0);
      this.updateFrame(-this.song.leadInBeats);
    }
    this.statusEl.textContent = finishedMode === 'demo'
      ? '试听完成，可以开始练习了'
      : `练习完成：命中 ${this.hits}，漏音 ${this.misses}，得分 ${this.score}`;
  }

  stop(silent = false) {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animationId = null;
    this.mode = null;
    this.stopPreviewPlayers();
    this.setControls(false);
    if (!silent) this.statusEl.textContent = '已停止，可重新试听或练习';
  }

  stopPreviewPlayers() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.previewPlayers.forEach(player => this.audioEngine.stopNote(player));
    this.previewPlayers.clear();
    this.song.notes.forEach(note => note.el.classList.remove('preview'));
  }
}
