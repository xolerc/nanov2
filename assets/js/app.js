// === index.html dan ajratildi (XOLERIC SEO) ===
(function() {
            // ---- HARDCORE CONFIGURATION ----
            const CONFIG = {
                baseRows: 8,       // Kattalashtirildi
                baseCols: 8,       // Kattalashtirildi
                maxRows: 14,
                maxCols: 12,
                comboDuration: 1500, // 3 soniyadan 1.5 soniyaga qisqardi
                baseScore: 100,
                errorLimitBase: 1,   // Faqat 1 marta xato qilish mumkin
                errorLimitPerLevel: 0, // Limit oshmaydi
                shufflePenalty: 500, // Katta jarima
            };

            const EMOJI_BASE = ["⚽","🏀","🏈","⚾","🎾","🏐","🎱","🪀","🏓","🏸","🏒","🥍","🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🛻","🚚","🚛","⌚","📱","💻","⌨️","🖥️","🕹️","💽","💾","💿","📀","🍎","🍒","🍓","🍊","🍋","🍌","🍏","🍐","🍑","🍔","🍕","🍟","🌭","😀","😂","🥰","😎","🤔","😴","😷","👻","👽","🤖","🐶","🦊","🐻","🌟","⭐","✨","💫","🌍","🌙","☀️","🌈","💧","🔥","⚡","❄️","💎","🔮","🎲","🎯","🎮","🤍","🖤","🔘","⚪","⚫"];

            let audioCtx = null;
            function playSound(type, freq = 400, duration = 0.1) {
                if (!audioCtx) {
                    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return; }
                }
                if (audioCtx.state === 'suspended') return;
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = (type === 'error') ? 'sawtooth' : 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + duration);
            }

            const particleLayer = document.getElementById('particle-layer');
            function spawnParticles(x, y, count = 20, color = '#ff2a2a') {
                for (let i = 0; i < count; i++) {
                    const p = document.createElement('div');
                    p.className = 'particle';
                    p.style.left = x + 'px';
                    p.style.top = y + 'px';
                    const angle = Math.random() * 2 * Math.PI;
                    const dist = 40 + Math.random() * 80;
                    const dx = Math.cos(angle) * dist;
                    const dy = Math.sin(angle) * dist;
                    p.style.setProperty('--dx', dx + 'px');
                    p.style.setProperty('--dy', dy + 'px');
                    p.style.background = color;
                    particleLayer.appendChild(p);
                    setTimeout(() => p.remove(), 600);
                }
            }

            class PathFinder {
                static find(grid, rows, cols, r1, c1, r2, c2) {
                    const queue = [{ r: r1, c: c1, dir: -1, turns: 0, path: [[r1, c1]] }];
                    const visited = new Set();
                    while (queue.length) {
                        const cur = queue.shift();
                        if (cur.r === r2 && cur.c === c2) return cur.path;
                        if (cur.turns > 2) continue;
                        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
                        for (let i = 0; i < 4; i++) {
                            const nr = cur.r + dirs[i][0];
                            const nc = cur.c + dirs[i][1];
                            if (nr < 0 || nr >= rows+2 || nc < 0 || nc >= cols+2) continue;
                            if (grid[nr][nc] === null || (nr === r2 && nc === c2)) {
                                const newTurns = (cur.dir !== -1 && cur.dir !== i) ? cur.turns + 1 : cur.turns;
                                const key = `${nr},${nc},${i},${newTurns}`;
                                if (!visited.has(key)) {
                                    visited.add(key);
                                    queue.push({ r: nr, c: nc, dir: i, turns: newTurns, path: [...cur.path, [nr, nc]] });
                                }
                            }
                        }
                    }
                    return null;
                }
            }

            class LevelGenerator {
                static generate(level) {
                    const rows = Math.min(CONFIG.baseRows + Math.floor(level * 0.5), CONFIG.maxRows);
                    let cols = Math.min(CONFIG.baseCols + Math.floor((level-1)/2), CONFIG.maxCols);
                    if ((rows * cols) % 2 !== 0) rows++;
                    const total = rows * cols;
                    const half = total / 2;
                    let basePool = [...EMOJI_BASE].sort(() => Math.random() - 0.5).slice(0, half);
                    let items = [...basePool, ...basePool].sort(() => Math.random() - 0.5);

                    const grid = Array.from({ length: rows+2 }, () => new Array(cols+2).fill(null));
                    let idx = 0;
                    for (let r = 1; r <= rows; r++) {
                        for (let c = 1; c <= cols; c++) {
                            let baseEmoji = items[idx++];
                            let rand = Math.random();
                            let tileType = 'normal';
                            
                            // Maxsus toshlar chiqish ehtimoli keskin oshirildi
                            if (level >= 1 && rand < 0.1) tileType = 'lightning';
                            else if (level >= 2 && rand < 0.15) tileType = 'bomb';
                            else if (level >= 2 && rand < 0.25) tileType = 'frozen';
                            else if (level >= 3 && rand < 0.35) tileType = 'locked';
                            
                            let specialEmoji = baseEmoji;
                            switch (tileType) {
                                case 'lightning': specialEmoji = '⚡'; break;
                                case 'bomb': specialEmoji = '💣'; break;
                                case 'frozen': specialEmoji = '🧊'; break;
                                case 'wildcard': specialEmoji = '🌈'; break;
                                case 'locked': specialEmoji = '🔒'; break;
                            }
                            grid[r][c] = {
                                type: tileType,
                                base: baseEmoji,
                                emoji: specialEmoji,
                                cracked: false,
                            };
                        }
                    }
                    return { rows, cols, grid };
                }
            }

            class XolericHardcore {
                constructor() {
                    this.state = { player: 'GUEST', level: 1, score: 0, errors: 0, rows: 8, cols: 8, grid: [], locked: false, math: null };
                    this.combo = 1;
                    this.comboTimer = null;
                    this.comboInterval = null;
                    this.selected = null;
                    this.isAnim = false;
                    this.mathAns = '';

                    this.el = {
                        login: document.getElementById('screen-login'),
                        game: document.getElementById('game-ui'),
                        lock: document.getElementById('screen-lockdown'),
                        over: document.getElementById('screen-gameover'),
                        lvlUp: document.getElementById('screen-levelup'),
                        inpName: document.getElementById('inp-name'),
                        btnCont: document.getElementById('btn-continue'),
                        vLvl: document.getElementById('val-lvl'),
                        vErr: document.getElementById('val-err'),
                        vScore: document.getElementById('val-score'),
                        vUser: document.getElementById('val-user'),
                        vCombo: document.getElementById('val-combo'),
                        comboFill: document.getElementById('combo-bar-fill'),
                        grid: document.getElementById('grid'),
                        svg: document.getElementById('svg-layer'),
                        board: document.getElementById('board-wrapper'),
                        mQ: document.getElementById('math-question'),
                        mA: document.getElementById('math-answer'),
                        fScore: document.getElementById('final-score'),
                    };

                    this.initEventListeners();
                    this.loadSave();
                    this.startBackground();
                }

                initEventListeners() {
                    document.getElementById('btn-start').addEventListener('click', () => this.startGame(false));
                    document.getElementById('btn-continue').addEventListener('click', () => this.startGame(true));
                    document.getElementById('btn-restart').addEventListener('click', () => this.resetToLogin());
                    document.getElementById('btn-exit').addEventListener('click', () => this.gameOver());
                    document.getElementById('btn-shuffle').addEventListener('click', () => this.shuffle());
                    document.getElementById('btn-hint').addEventListener('click', () => this.hint());
                    document.querySelectorAll('.num-key').forEach(b => b.addEventListener('click', (e) => this.pressKey(e.target.dataset.key)));
                }

                loadSave() {
                    const saved = localStorage.getItem('xoleric_hard');
                    if (saved) {
                        try {
                            const data = JSON.parse(saved);
                            if (!data.locked) {
                                this.el.btnCont.style.display = 'block';
                                this.el.inpName.value = data.player || '';
                            } else {
                                this.state = data;
                                if (this.state.locked) this.triggerLockdown(true);
                            }
                        } catch(e) {}
                    }
                }

                save() { localStorage.setItem('xoleric_hard', JSON.stringify(this.state)); }
                wipe() { localStorage.removeItem('xoleric_hard'); this.el.btnCont.style.display = 'none'; }

                startGame(continueGame) {
                    if (continueGame) {
                        const saved = localStorage.getItem('xoleric_hard');
                        if (saved) { this.state = JSON.parse(saved); this.combo = 1; }
                    } else {
                        this.state.player = this.el.inpName.value.trim() || 'NANO';
                        this.state.level = 1; this.state.score = 0; this.state.errors = 0; this.state.locked = false;
                        this.wipe();
                    }
                    this.el.login.classList.add('hidden');
                    this.el.vUser.innerText = this.state.player.substring(0,10);
                    setTimeout(() => {
                        this.el.game.classList.add('active');
                        this.buildLevel();
                    }, 600);
                }

                resetToLogin() {
                    this.el.over.classList.add('hidden');
                    this.el.game.classList.remove('active');
                    this.el.login.classList.remove('hidden');
                }

                gameOver() {
                    this.el.fScore.innerText = String(this.state.score).padStart(5, '0');
                    this.el.game.classList.remove('active');
                    setTimeout(() => { this.el.over.classList.remove('hidden'); this.wipe(); }, 500);
                }

                buildLevel() {
                    const { rows, cols, grid } = LevelGenerator.generate(this.state.level);
                    this.state.rows = rows; this.state.cols = cols; this.state.grid = grid;
                    this.drawGrid(); this.updateHUD(); this.save();
                }

                drawGrid() {
                    this.el.grid.style.gridTemplateColumns = `repeat(${this.state.cols}, 1fr)`;
                    this.el.grid.innerHTML = '';
                    for (let r = 1; r <= this.state.rows; r++) {
                        for (let c = 1; c <= this.state.cols; c++) {
                            const tile = this.state.grid[r][c];
                            const div = document.createElement('div');
                            div.className = 'tile';
                            if (tile) {
                                div.innerText = tile.emoji;
                                if (tile.type !== 'normal') div.classList.add(tile.type);
                                if (tile.cracked) div.classList.add('cracked');
                                div.addEventListener('click', (e) => this.tapTile(r, c, div));
                            } else { div.classList.add('matched'); }
                            div.id = `t-${r}-${c}`;
                            this.el.grid.appendChild(div);
                        }
                    }
                    this.el.svg.innerHTML = ''; this.selected = null;
                }

                updateHUD() {
                    const maxErr = CONFIG.errorLimitBase;
                    this.el.vLvl.innerText = String(this.state.level).padStart(2, '0');
                    this.el.vScore.innerText = String(this.state.score).padStart(5, '0');
                    this.el.vErr.innerText = `${this.state.errors}/${maxErr}`;
                    this.el.vCombo.innerText = `x${this.combo}`;
                }

                tileEquals(a, b) { return a.base === b.base; }

                tapTile(r, c, dom) {
                    if (this.isAnim || this.state.locked) return;
                    const tile = this.state.grid[r][c];
                    if (!tile) return;

                    if ((tile.type === 'frozen' || tile.type === 'locked') && !tile.cracked) {
                        tile.cracked = true; dom.classList.add('cracked');
                        playSound('tap', 250, 0.05); return;
                    }

                    if (this.selected) {
                        const { r: sr, c: sc } = this.selected;
                        const prevDom = document.getElementById(`t-${sr}-${sc}`);
                        const prevTile = this.state.grid[sr][sc];
                        if (sr === r && sc === c) { dom.classList.remove('selected'); this.selected = null; return; }
                        
                        if (this.tileEquals(prevTile, tile)) {
                            const path = PathFinder.find(this.state.grid, this.state.rows, this.state.cols, sr, sc, r, c);
                            if (path) {
                                this.isAnim = true; this.doMatch(this.selected, { r, c }, path, prevTile, tile); return;
                            } else { this.doError(dom, prevDom); }
                        } else { this.doError(dom, prevDom); }
                        
                        prevDom.classList.remove('selected'); this.selected = null;
                    } else {
                        this.selected = { r, c }; dom.classList.add('selected'); playSound('tap', 400, 0.05);
                    }
                }

                doError(dom1, dom2) {
                    this.state.errors++;
                    this.updateHUD();
                    dom1.classList.add('error-shake');
                    if (dom2) dom2.classList.add('error-shake');
                    setTimeout(() => { dom1.classList.remove('error-shake'); if (dom2) dom2.classList.remove('error-shake'); }, 400);
                    playSound('error', 150, 0.3);
                    this.combo = 1; this.save();
                    if (this.state.errors >= CONFIG.errorLimitBase) {
                        setTimeout(() => this.triggerLockdown(false), 400);
                    }
                }

                doMatch(p1, p2, path, tile1, tile2) {
                    this.renderPath(path);
                    clearTimeout(this.comboTimer); clearInterval(this.comboInterval);
                    let earned = CONFIG.baseScore * this.combo;
                    this.state.score += earned;

                    const rect = document.getElementById(`t-${p2.r}-${p2.c}`).getBoundingClientRect();
                    const boardRect = this.el.board.getBoundingClientRect();
                    spawnParticles(rect.left - boardRect.left + rect.width/2, rect.top - boardRect.top + rect.height/2);
                    playSound('match', 600, 0.15);

                    this.combo++; this.updateHUD(); this.startComboTimer();

                    setTimeout(() => {
                        this.state.grid[p1.r][p1.c] = null; this.state.grid[p2.r][p2.c] = null;
                        document.getElementById(`t-${p1.r}-${p1.c}`).className = 'tile matched';
                        document.getElementById(`t-${p2.r}-${p2.c}`).className = 'tile matched';

                        this.save();
                        setTimeout(() => this.el.svg.innerHTML = '', 200);
                        this.selected = null; this.isAnim = false; this.checkWin();
                    }, 150);
                }

                renderPath(path) {
                    const svg = this.el.svg;
                    const boardRect = this.el.board.getBoundingClientRect();
                    const gridRect = this.el.grid.getBoundingClientRect();
                    const cellW = gridRect.width / this.state.cols;
                    const cellH = gridRect.height / this.state.rows;
                    const ox = gridRect.left - boardRect.left;
                    const oy = gridRect.top - boardRect.top;
                    const points = path.map(p => `${ox + (p[1]-0.5)*cellW},${oy + (p[0]-0.5)*cellH}`).join(' ');
                    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
                    poly.setAttribute('points', points); poly.setAttribute('class', 'path-line');
                    svg.appendChild(poly);
                }

                startComboTimer() {
                    this.el.comboFill.style.width = '100%';
                    const start = Date.now();
                    const interval = setInterval(() => {
                        const elapsed = Date.now() - start;
                        const remain = Math.max(0, CONFIG.comboDuration - elapsed);
                        this.el.comboFill.style.width = (remain / CONFIG.comboDuration * 100) + '%';
                        if (remain <= 0) { clearInterval(interval); this.combo = 1; this.updateHUD(); }
                    }, 50);
                    this.comboInterval = interval;
                    this.comboTimer = setTimeout(() => { clearInterval(interval); this.combo = 1; this.updateHUD(); }, CONFIG.comboDuration);
                }

                checkWin() {
                    for (let r = 1; r <= this.state.rows; r++) {
                        for (let c = 1; c <= this.state.cols; c++) { if (this.state.grid[r][c] !== null) return; }
                    }
                    this.state.level++; this.state.errors = 0; this.save();
                    this.el.lvlUp.classList.add('show');
                    setTimeout(() => { this.el.lvlUp.classList.remove('show'); this.buildLevel(); }, 1200);
                }

                shuffle() {
                    if (this.isAnim) return;
                    const tiles = [];
                    for (let r = 1; r <= this.state.rows; r++) {
                        for (let c = 1; c <= this.state.cols; c++) { if (this.state.grid[r][c]) tiles.push(this.state.grid[r][c]); }
                    }
                    tiles.sort(() => Math.random() - 0.5);
                    let idx = 0;
                    for (let r = 1; r <= this.state.rows; r++) {
                        for (let c = 1; c <= this.state.cols; c++) { if (this.state.grid[r][c]) this.state.grid[r][c] = tiles[idx++]; }
                    }
                    this.state.score = Math.max(0, this.state.score - CONFIG.shufflePenalty);
                    this.combo = 1; this.updateHUD(); this.drawGrid(); playSound('shuffle', 200, 0.2); this.save();
                }

                hint() {
                    this.state.score = Math.max(0, this.state.score - 100);
                    this.updateHUD();
                    for (let r1 = 1; r1 <= this.state.rows; r1++) {
                        for (let c1 = 1; c1 <= this.state.cols; c1++) {
                            const t1 = this.state.grid[r1][c1];
                            if (!t1) continue;
                            for (let r2 = 1; r2 <= this.state.rows; r2++) {
                                for (let c2 = 1; c2 <= this.state.cols; c2++) {
                                    const t2 = this.state.grid[r2][c2];
                                    if ((r1 === r2 && c1 === c2) || !t2) continue;
                                    if (this.tileEquals(t1, t2) && PathFinder.find(this.state.grid, this.state.rows, this.state.cols, r1, c1, r2, c2)) {
                                        document.getElementById(`t-${r1}-${c1}`).style.borderColor = '#ff2a2a';
                                        document.getElementById(`t-${r2}-${c2}`).style.borderColor = '#ff2a2a';
                                        setTimeout(() => { this.drawGrid(); }, 1000);
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }

                triggerLockdown(fromLoad) {
                    if (!fromLoad) {
                        this.state.locked = true;
                        const op = ['+','-','*'][Math.floor(Math.random()*3)];
                        let a, b, ans;
                        // Matematika qiyinlashtirildi
                        if (op === '+') { a = Math.floor(Math.random()*500)+100; b = Math.floor(Math.random()*500)+100; ans = a+b; }
                        else if (op === '-') { a = Math.floor(Math.random()*800)+200; b = Math.floor(Math.random()*199)+1; ans = a-b; }
                        else { a = Math.floor(Math.random()*15)+10; b = Math.floor(Math.random()*15)+10; ans = a*b; }
                        this.state.math = { q: `${a} ${op} ${b} = ?`, a: ans };
                        this.save();
                    }
                    this.el.game.classList.remove('active');
                    this.el.lock.classList.remove('hidden');
                    this.el.mQ.innerText = this.state.math.q;
                    this.mathAns = '';
                    this.renderMath();
                }

                pressKey(key) {
                    if (key === 'DEL') this.mathAns = this.mathAns.slice(0,-1);
                    else if (key === 'OK') this.submitMath();
                    else if (this.mathAns.length < 5) this.mathAns += key;
                    this.renderMath();
                }

                renderMath() { this.el.mA.innerText = this.mathAns || '_'; }

                submitMath() {
                    if (parseInt(this.mathAns) === this.state.math.a) {
                        this.el.mA.innerText = "QULFDAN CHIQDI";
                        this.el.mA.style.color = "#00ff00";
                        setTimeout(() => {
                            this.el.mA.style.color = "#fff";
                            this.state.locked = false; this.state.math = null; this.state.errors = 0;
                            // Qulf yechilganda jarima
                            this.state.score = Math.max(0, this.state.score - 500);
                            this.save();
                            this.el.lock.classList.add('hidden');
                            this.el.game.classList.add('active');
                            this.updateHUD();
                        }, 1000);
                    } else {
                        this.el.mA.style.transform = 'translateX(-15px)';
                        this.el.mA.style.color = "#ff0000";
                        setTimeout(() => this.el.mA.style.transform = 'translateX(15px)', 100);
                        setTimeout(() => { this.el.mA.style.transform = 'translateX(0)'; this.el.mA.style.color = "#fff"; }, 200);
                        setTimeout(() => { this.mathAns = ''; this.renderMath(); }, 400);
                    }
                }

                startBackground() {
                    const canvas = document.getElementById('bg-canvas');
                    const ctx = canvas.getContext('2d');
                    let w, h;
                    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
                    window.addEventListener('resize', resize); resize();

                    const particles = [];
                    for (let i = 0; i < 40; i++) {
                        particles.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5 });
                    }

                    function draw() {
                        ctx.clearRect(0, 0, w, h);
                        ctx.fillStyle = '#ff2a2a';
                        ctx.shadowColor = '#ff0000';
                        ctx.shadowBlur = 15;
                        for (let p of particles) {
                            ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, 2*Math.PI); ctx.fill();
                            p.x += p.vx; p.y += p.vy;
                            if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
                            if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
                        }
                        requestAnimationFrame(draw);
                    }
                    draw();
                }
            }

            new XolericHardcore();
        })();