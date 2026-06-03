import rough from 'roughjs';
import { Input } from '../engine/Input';
import type { Enemy, DialogueLine, Boon, Obstacle, Door } from './entities/Types';
import { DialogueUI } from './ui/DialogueUI';
import { GameHUD } from './ui/GameHUD';
import { BoonSystem } from './systems/BoonSystem';
import { BoonUI } from './ui/BoonUI';

export class GameEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private rc: any;
    private frame: number = 0;

    private screenW: number = 800;
    private screenH: number = 600;

    // 【新增】OASIS 作为独立的休息区场景
    private currentScene: 'HOME' | 'BATTLE' | 'OASIS' = 'HOME';

    private hero = { 
        x: 400, y: 400, speed: 5, hp: 100, maxHp: 100, radius: 25,
        state: 'NORMAL', dirX: 1, dirY: 0,
        dashTimer: 0, dashDuration: 12, dashSpeed: 20, dashCooldown: 0,
        attackTimer: 0, attackDuration: 15, attackCooldown: 0, attackThrustSpeed: 3,
        hasDealtDamage: false, hitFlashTimer: 0,
        boonColor: '#fbbf24'
    };

    private npcLiJing = { x: 400, y: 200, radius: 40 };
    private homePortal = { x: 800, y: 200, radius: 40, active: false };

    // 【新增】休息区的莲花池实体
    private lotusPool = { x: 800, y: 600, radius: 80, used: false };

    private dialogue = { active: false, index: 0, lines: [] as DialogueLine[], cooldown: 0 };
    
    private mapWidth = 1600; 
    private mapHeight = 1200;
    private enemies: Enemy[] = [];
    private obstacles: Obstacle[] = []; 
    private doors: Door[] = [];         
    
    private currentBoons: Boon[] = [];
    private roomCleared: boolean = false; 
    private expectedReward: 'BOON' | 'HEAL' = 'BOON'; 

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.rc = rough.canvas(this.canvas);
        
        window.addEventListener('resize', this.handleResize);
        this.handleResize(); 
        requestAnimationFrame(this.gameLoop);
    }

    private handleResize = () => {
        const dpr = window.devicePixelRatio || 1;
        this.screenW = window.innerWidth;
        this.screenH = window.innerHeight;
        this.canvas.width = this.screenW * dpr;
        this.canvas.height = this.screenH * dpr;
        this.ctx.resetTransform();
        this.ctx.scale(dpr, dpr);
    }

    // 【新增】轮回重塑方法
    private resurrect() {
        this.hero.hp = this.hero.maxHp;
        this.hero.state = 'NORMAL';
        this.hero.hitFlashTimer = 0;
        this.hero.attackCooldown = 20; // 防止复活瞬间触发攻击
        this.hero.hasDealtDamage = false;
        
        // 剥夺当前的赐福（肉鸽设定：死亡掉落局内强化）
        this.hero.boonColor = '#fbbf24'; 
        
        // 回到陈塘关
        this.currentScene = 'HOME';
        this.hero.x = 400;
        this.hero.y = 400;
        this.homePortal.active = false; // 传送门关闭，需重新对话激活
        this.dialogue.active = false;
    }

    private startDialogue(lines: DialogueLine[]) {
        this.dialogue.active = true;
        this.dialogue.index = 0;
        this.dialogue.lines = lines;
        this.dialogue.cooldown = 15; 
        this.hero.state = 'NORMAL'; 
    }

    // 进入战斗房间
    private transitionToBattle(rewardType: 'BOON' | 'HEAL') {
        this.currentScene = 'BATTLE';
        this.roomCleared = false;
        this.expectedReward = rewardType;
        this.doors = []; 
        
        this.hero.x = this.mapWidth / 2; 
        this.hero.y = this.mapHeight - 150;
        
        this.obstacles = [];
        const types: ('ROCK' | 'BAMBOO' | 'POND')[] = ['ROCK', 'BAMBOO', 'POND'];
        const numObstacles = Math.floor(Math.random() * 4) + 6; 
        
        for (let i = 0; i < numObstacles; i++) {
            let ox = 200 + Math.random() * (this.mapWidth - 400);
            let oy = 200 + Math.random() * (this.mapHeight - 400);
            
            const distToHero = Math.sqrt(Math.pow(ox - this.hero.x, 2) + Math.pow(oy - this.hero.y, 2));
            if (distToHero < 150) oy -= 200; 

            this.obstacles.push({
                x: ox,
                y: oy,
                radius: 50 + Math.random() * 30,
                type: types[Math.floor(Math.random() * types.length)]
            });
        }

        this.enemies = [
            { id: 1, x: this.mapWidth / 2 - 200, y: 300, hp: 50, maxHp: 50, radius: 30, hitFlashTimer: 0, speed: 2, state: 'CHASING', attackTimer: 0, attackCooldown: 0, dirX: 0, dirY: 0 },
            { id: 2, x: this.mapWidth / 2 + 200, y: 300, hp: 50, maxHp: 50, radius: 30, hitFlashTimer: 0, speed: 2.5, state: 'CHASING', attackTimer: 0, attackCooldown: 0, dirX: 0, dirY: 0 },
            { id: 3, x: this.mapWidth / 2, y: 200, hp: 70, maxHp: 70, radius: 35, hitFlashTimer: 0, speed: 1.5, state: 'CHASING', attackTimer: 0, attackCooldown: 0, dirX: 0, dirY: 0 },
            { id: 4, x: this.mapWidth / 2 - 300, y: 250, hp: 40, maxHp: 40, radius: 30, hitFlashTimer: 0, speed: 2.2, state: 'CHASING', attackTimer: 0, attackCooldown: 0, dirX: 0, dirY: 0 }
        ];
    }

    // 【新增】进入休息区
    private transitionToOasis() {
        this.currentScene = 'OASIS';
        this.roomCleared = true; // 休息区没有怪物，视为已清理
        this.hero.x = this.mapWidth / 2;
        this.hero.y = this.mapHeight - 150;
        
        // 莲花池放置在地图中央
        this.lotusPool.x = this.mapWidth / 2;
        this.lotusPool.y = this.mapHeight / 2 - 100;
        this.lotusPool.used = false;
        
        this.obstacles = [];
        this.enemies = [];
        this.spawnRewardDoors(); // 生成离开休息区的门
    }

    private spawnRewardDoors() {
        this.doors = [];
        const rewardTypes: ('BOON' | 'HEAL')[] = ['BOON', 'HEAL'];
        
        for (let i = 0; i < 2; i++) {
            let px = this.mapWidth / 2 + (i === 0 ? -200 : 200);
            let py = 150;
            const radius = 40;
            let valid = false;
            let attempts = 0;
            
            while (!valid && attempts < 50) {
                valid = true;
                for (const obs of this.obstacles) {
                    const dist = Math.sqrt(Math.pow(px - obs.x, 2) + Math.pow(py - obs.y, 2));
                    if (dist < radius + obs.radius + 30) { 
                        valid = false;
                        px += (Math.random() > 0.5 ? 1 : -1) * 40; 
                        py += (Math.random() > 0.5 ? 1 : -1) * 40;
                        break;
                    }
                }
                attempts++;
            }
            
            px = Math.max(100, Math.min(px, this.mapWidth - 100));
            py = Math.max(100, Math.min(py, this.mapHeight - 100));
            
            this.doors.push({ x: px, y: py, radius, rewardType: rewardTypes[i] });
        }
    }

    private applyBoon(boon: Boon) {
        boon.apply(this.hero); 
        this.hero.state = 'NORMAL'; 
        this.currentBoons = []; 
        this.spawnRewardDoors(); 
    }

    private update() {
        this.frame++;
        
        // 【核心】死亡拦截与复活判定
        if (this.hero.state === 'DEAD') {
            if (Input.keys.j) {
                this.resurrect();
            }
            return; 
        }
        
        if (this.hero.state === 'BOON_SELECTION') {
            if (Input.keys['1'] && this.currentBoons[0]) this.applyBoon(this.currentBoons[0]);
            if (Input.keys['2'] && this.currentBoons[1]) this.applyBoon(this.currentBoons[1]);
            if (Input.keys['3'] && this.currentBoons[2]) this.applyBoon(this.currentBoons[2]);
            return; 
        }

        if (this.dialogue.cooldown > 0) this.dialogue.cooldown--;
        if (this.dialogue.active) {
            if (Input.keys.f && this.dialogue.cooldown <= 0) {
                this.dialogue.index++;
                this.dialogue.cooldown = 15;
                if (this.dialogue.index >= this.dialogue.lines.length) {
                    this.dialogue.active = false;
                    if (this.currentScene === 'HOME') this.homePortal.active = true;
                }
            }
            return;
        }

        if (this.hero.dashCooldown > 0) this.hero.dashCooldown--;
        if (this.hero.attackCooldown > 0) this.hero.attackCooldown--;
        if (this.hero.hitFlashTimer > 0) this.hero.hitFlashTimer--;

        if (this.currentScene === 'HOME') {
            const distNPC = Math.sqrt(Math.pow(this.hero.x - this.npcLiJing.x, 2) + Math.pow(this.hero.y - this.npcLiJing.y, 2));
            if (distNPC < 100 && Input.keys.f && this.dialogue.cooldown <= 0) {
                this.startDialogue([
                    { speaker: '李靖', text: '逆子！你又去哪里惹是生非了？', color: '#1d4ed8' },
                    { speaker: '哪吒', text: '我命由我不由天！是他们先欺负人的！', color: '#dc2626' },
                    { speaker: '李靖', text: '执迷不悟... 你且去后山试炼场好好反省！', color: '#1d4ed8' },
                    { speaker: '系统', text: '（通往试炼场的传送门已开启）', color: '#4b5563' }
                ]);
            }
            if (this.homePortal.active) {
                const distPortal = Math.sqrt(Math.pow(this.hero.x - this.homePortal.x, 2) + Math.pow(this.hero.y - this.homePortal.y, 2));
                if (distPortal < 50) this.transitionToBattle('BOON');
            }
            
        } else if (this.currentScene === 'BATTLE') {
            this.updateEnemies();
            this.checkDoors();
            
        } else if (this.currentScene === 'OASIS') {
            // 【新增】莲花池交互
            const distPool = Math.sqrt(Math.pow(this.hero.x - this.lotusPool.x, 2) + Math.pow(this.hero.y - this.lotusPool.y, 2));
            if (distPool < this.lotusPool.radius + 50 && Input.keys.f && !this.lotusPool.used) {
                // 恢复 50% 生命值
                this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + this.hero.maxHp * 0.5);
                this.lotusPool.used = true;
            }
            this.checkDoors();
        }

        this.updateHero();
    }

    // 抽离统一的进门检测
    private checkDoors() {
        for (const door of this.doors) {
            const dist = Math.sqrt(Math.pow(this.hero.x - door.x, 2) + Math.pow(this.hero.y - door.y, 2));
            if (dist < 50) {
                if (door.rewardType === 'HEAL') {
                    this.transitionToOasis(); // 进灵丹妙药门 -> 去莲池绿洲
                } else {
                    this.transitionToBattle(door.rewardType); // 进神明门 -> 战斗拿赐福
                }
                break;
            }
        }
    }

    private checkObstacleCollision(entity: {x: number, y: number, radius: number}) {
        for (const obs of this.obstacles) {
            const dx = entity.x - obs.x;
            const dy = entity.y - obs.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = entity.radius + obs.radius;
            if (dist < minDist && dist > 0) {
                const overlap = minDist - dist;
                entity.x += (dx / dist) * overlap;
                entity.y += (dy / dist) * overlap;
            }
        }
    }

    private updateHero() {
        if (this.hero.state === 'NORMAL') {
            let dx = 0; let dy = 0;
            if (Input.keys.w) dy -= 1;
            if (Input.keys.s) dy += 1;
            if (Input.keys.a) dx -= 1;
            if (Input.keys.d) dx += 1;

            if (dx !== 0 || dy !== 0) {
                const length = Math.sqrt(dx * dx + dy * dy);
                this.hero.dirX = dx / length;
                this.hero.dirY = dy / length;
                this.hero.x += this.hero.dirX * this.hero.speed;
                this.hero.y += this.hero.dirY * this.hero.speed;
            }

            // OASIS 不允许攻击
            if (Input.keys.j && this.hero.attackCooldown <= 0 && this.currentScene === 'BATTLE') {
                this.hero.state = 'ATTACKING';
                this.hero.attackTimer = this.hero.attackDuration;
                this.hero.attackCooldown = 20;
                this.hero.hasDealtDamage = false; 
            } else if (Input.keys.space && this.hero.dashCooldown <= 0) {
                this.hero.state = 'DASHING';
                this.hero.dashTimer = this.hero.dashDuration;
                this.hero.dashCooldown = 40; 
            }
        } else if (this.hero.state === 'DASHING') {
            this.hero.x += this.hero.dirX * this.hero.dashSpeed;
            this.hero.y += this.hero.dirY * this.hero.dashSpeed;
            this.hero.dashTimer--;
            if (this.hero.dashTimer <= 0) this.hero.state = 'NORMAL';
        } else if (this.hero.state === 'ATTACKING') {
            this.hero.x += this.hero.dirX * this.hero.attackThrustSpeed;
            this.hero.y += this.hero.dirY * this.hero.attackThrustSpeed;
            
            if (!this.hero.hasDealtDamage && this.hero.attackTimer > this.hero.attackDuration - 5) {
                const hitboxX = this.hero.x + this.hero.dirX * 80;
                const hitboxY = this.hero.y + this.hero.dirY * 80;
                
                for (let enemy of this.enemies) {
                    if (enemy.hp <= 0) continue; 
                    const dist = Math.sqrt(Math.pow(enemy.x - hitboxX, 2) + Math.pow(enemy.y - hitboxY, 2));
                    if (dist < 50 + enemy.radius) {
                        enemy.hp -= 15; 
                        enemy.hitFlashTimer = 8; 
                        enemy.x += this.hero.dirX * 20;
                        enemy.y += this.hero.dirY * 20;
                    }
                }
                this.hero.hasDealtDamage = true; 
            }
            this.hero.attackTimer--;
            if (this.hero.attackTimer <= 0) this.hero.state = 'NORMAL';
        }

        const pad = 50;
        this.hero.x = Math.max(pad, Math.min(this.hero.x, this.mapWidth - pad));
        this.hero.y = Math.max(pad, Math.min(this.hero.y, this.mapHeight - pad));

        if (this.hero.state !== 'DASHING') {
            this.checkObstacleCollision(this.hero);
            
            if (this.currentScene === 'HOME') {
                const distNPC = Math.sqrt(Math.pow(this.hero.x - this.npcLiJing.x, 2) + Math.pow(this.hero.y - this.npcLiJing.y, 2));
                const minNpcDist = this.hero.radius + this.npcLiJing.radius;
                if (distNPC < minNpcDist && distNPC > 0) {
                    const overlap = minNpcDist - distNPC;
                    this.hero.x += ((this.hero.x - this.npcLiJing.x) / distNPC) * overlap;
                    this.hero.y += ((this.hero.y - this.npcLiJing.y) / distNPC) * overlap;
                }
            } else if (this.currentScene === 'OASIS') {
                // 莲花池物理阻挡
                const distPool = Math.sqrt(Math.pow(this.hero.x - this.lotusPool.x, 2) + Math.pow(this.hero.y - this.lotusPool.y, 2));
                const minPoolDist = this.hero.radius + this.lotusPool.radius;
                if (distPool < minPoolDist && distPool > 0) {
                    const overlap = minPoolDist - distPool;
                    this.hero.x += ((this.hero.x - this.lotusPool.x) / distPool) * overlap;
                    this.hero.y += ((this.hero.y - this.lotusPool.y) / distPool) * overlap;
                }
            }
        }
    }

    private updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy.hitFlashTimer > 0) enemy.hitFlashTimer--;
            if (enemy.attackCooldown > 0) enemy.attackCooldown--;
            if (enemy.hp <= 0 && enemy.hitFlashTimer <= 0) {
                this.enemies.splice(i, 1);
                continue;
            }

            for (let j = 0; j < this.enemies.length; j++) {
                if (i === j) continue;
                const other = this.enemies[j];
                const edx = enemy.x - other.x;
                const edy = enemy.y - other.y;
                const edist = Math.sqrt(edx * edx + edy * edy);
                const minEdist = enemy.radius + other.radius;
                if (edist < minEdist && edist > 0) {
                    const overlap = minEdist - edist;
                    enemy.x += (edx / edist) * overlap * 0.1;
                    enemy.y += (edy / edist) * overlap * 0.1;
                }
            }

            const dist = Math.sqrt(Math.pow(this.hero.x - enemy.x, 2) + Math.pow(this.hero.y - enemy.y, 2));
            if (dist > 0) { enemy.dirX = (this.hero.x - enemy.x) / dist; enemy.dirY = (this.hero.y - enemy.y) / dist; }

            this.checkObstacleCollision(enemy);

            if (enemy.state === 'CHASING') {
                if (dist < 70 && enemy.attackCooldown <= 0) {
                    enemy.state = 'ATTACKING'; enemy.attackTimer = 25;
                } else if (enemy.hitFlashTimer <= 0) {
                    enemy.x += enemy.dirX * enemy.speed; enemy.y += enemy.dirY * enemy.speed;
                }
            } else if (enemy.state === 'ATTACKING') {
                enemy.attackTimer--;
                if (enemy.attackTimer === 10 && this.hero.state !== 'DASHING' && dist < 80) {
                    this.hero.hp -= 10;
                    this.hero.hitFlashTimer = 10;
                    if (this.hero.hp <= 0) { this.hero.hp = 0; this.hero.state = 'DEAD'; }
                }
                if (enemy.attackTimer <= 0) { enemy.state = 'CHASING'; enemy.attackCooldown = 60; }
            }

            if (this.hero.state !== 'DASHING') {
                const minDist = this.hero.radius + enemy.radius;
                if (dist < minDist && dist > 0) {
                    const overlap = minDist - dist;
                    this.hero.x += (this.hero.x - enemy.x) / dist * overlap;
                    this.hero.y += (this.hero.y - enemy.y) / dist * overlap;
                }
            }
        }
        
        if (this.enemies.length === 0 && !this.roomCleared && this.currentScene === 'BATTLE') {
            this.roomCleared = true;
            if (this.expectedReward === 'BOON') {
                this.hero.state = 'BOON_SELECTION';
                this.currentBoons = BoonSystem.generateBoons(3); 
            } 
            // 如果原本期待HEAL，直接发个门，不再弹神明卡片
        }
    }

    private draw() {
        this.ctx.clearRect(0, 0, this.screenW, this.screenH); 
        this.ctx.save();
        
        const cameraX = this.screenW / 2 - this.hero.x;
        const cameraY = this.screenH / 2 - this.hero.y;
        this.ctx.translate(cameraX, cameraY);

        this.drawMap();
        
        if (this.currentScene === 'HOME') {
            this.drawNPC();
            this.drawHomePortal();
        } else if (this.currentScene === 'OASIS') {
            this.drawOasis();
            this.drawDoors();
        } else {
            this.drawObstacles(); 
            this.drawDoors();     
            this.drawEnemies(); 
        }

        this.drawHero(this.hero.x, this.hero.y);
        this.ctx.restore();
        
        GameHUD.draw(this.rc, this.ctx, this.hero, this.currentScene);
        DialogueUI.draw(this.rc, this.ctx, this.frame, this.dialogue);
        
        if (this.hero.state === 'BOON_SELECTION') BoonUI.draw(this.rc, this.ctx, this.currentBoons);
    }

    private drawMap() {
        // 根据不同场景，设置不同风格的底色
        let bgColor = '#e5e7eb'; // BATTLE 灰色
        if (this.currentScene === 'HOME') bgColor = '#f3f4f6'; // 明亮
        else if (this.currentScene === 'OASIS') bgColor = '#ecfccb'; // 生机勃勃的浅绿色
        
        const strokeColor = this.currentScene === 'HOME' ? '#d1d5db' : '#9ca3af';

        this.rc.rectangle(0, 0, this.mapWidth, this.mapHeight, {
            fill: bgColor, fillStyle: 'hachure', hachureAngle: 30, hachureGap: 15,
            roughness: 2, strokeWidth: 3, stroke: strokeColor
        });

        if (this.currentScene === 'HOME') {
            this.rc.rectangle(300, 100, 200, 50, { fill: '#94a3b8', roughness: 1.5 });
        }
    }

    // 【新增】绘制莲花池和交互提示
    private drawOasis() {
        const px = this.lotusPool.x;
        const py = this.lotusPool.y;
        
        // 莲池水面
        this.rc.ellipse(px, py, this.lotusPool.radius * 2.5, this.lotusPool.radius * 1.5, { 
            fill: '#bae6fd', fillStyle: 'solid', stroke: '#38bdf8', strokeWidth: 2, roughness: 1.5 
        });
        
        // 简单的莲花
        this.rc.circle(px, py, 40, { fill: '#fbcfe8', fillStyle: 'solid', stroke: '#f472b6', strokeWidth: 2 });
        this.rc.circle(px, py, 20, { fill: '#fce7f3', fillStyle: 'solid', stroke: '#f472b6', strokeWidth: 1 });

        // 交互提示 (如果未被使用且玩家靠近)
        const distPool = Math.sqrt(Math.pow(this.hero.x - px, 2) + Math.pow(this.hero.y - py, 2));
        if (distPool < this.lotusPool.radius + 50 && !this.lotusPool.used) {
            this.ctx.fillStyle = '#1f2937';
            this.ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif';
            this.ctx.fillText('[按 F 沐浴莲池恢复气血]', px - 95, py - 60);
        }
    }

    private drawObstacles() {
        for (const obs of this.obstacles) {
            if (obs.type === 'ROCK') {
                this.rc.circle(obs.x, obs.y, obs.radius * 2, { 
                    fill: '#9ca3af', fillStyle: 'hachure', hachureAngle: 60, hachureGap: 4, roughness: 2.5, stroke: '#4b5563', strokeWidth: 2 
                });
                this.rc.polygon([[obs.x - obs.radius * 0.8, obs.y + obs.radius/2], [obs.x, obs.y - obs.radius], [obs.x + obs.radius * 0.8, obs.y + obs.radius/2]], { stroke: '#374151', strokeWidth: 2, roughness: 2 });
            } else if (obs.type === 'BAMBOO') {
                this.rc.circle(obs.x, obs.y, obs.radius * 2, { fill: '#dcfce7', fillStyle: 'solid', stroke: 'none', roughness: 2 });
                for (let i=0; i<4; i++) {
                    const bx = obs.x - obs.radius * 0.6 + (obs.radius * 0.4) * i + (Math.random() * 10 - 5);
                    this.rc.line(bx, obs.y + obs.radius * 0.8, bx, obs.y - obs.radius * 1.2, { stroke: '#22c55e', strokeWidth: 4, roughness: 1.5 });
                    this.rc.line(bx, obs.y - 10 + i*5, bx + 15, obs.y - 20 + i*5, { stroke: '#16a34a', strokeWidth: 2, roughness: 1 });
                }
            } else if (obs.type === 'POND') {
                this.rc.ellipse(obs.x, obs.y, obs.radius * 2.5, obs.radius * 1.5, { 
                    fill: '#bae6fd', fillStyle: 'hachure', hachureAngle: 0, hachureGap: 6, roughness: 1.5, stroke: '#38bdf8', strokeWidth: 2 
                });
                this.rc.curve([[obs.x - obs.radius/2, obs.y], [obs.x, obs.y + 5], [obs.x + obs.radius/2, obs.y - 5]], { stroke: '#0284c7', strokeWidth: 2, roughness: 1 });
            }
        }
    }

    private drawDoors() {
        for (const door of this.doors) {
            this.ctx.save();
            this.ctx.translate(door.x, door.y);
            this.ctx.rotate(this.frame * 0.05);
            
            const doorColor = door.rewardType === 'BOON' ? '#fbbf24' : '#10b981';
            this.rc.ellipse(0, 0, door.radius*2, door.radius*2, { stroke: doorColor, strokeWidth: 4, roughness: 3, bowing: 2 });
            this.rc.ellipse(0, 0, door.radius*1.5, door.radius*1.5, { stroke: doorColor, strokeWidth: 2, roughness: 2 });
            this.ctx.restore();

            this.ctx.fillStyle = door.rewardType === 'BOON' ? '#fbbf24' : '#10b981';
            this.ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif';
            const text = door.rewardType === 'BOON' ? '神明赐福' : '灵丹妙药';
            this.ctx.fillText(text, door.x - 35, door.y - 60);
        }
    }

    private drawHomePortal() {
        if (!this.homePortal.active) return;
        const px = this.homePortal.x; const py = this.homePortal.y;
        this.ctx.save();
        this.ctx.translate(px, py);
        this.ctx.rotate(this.frame * 0.05);
        this.rc.ellipse(0, 0, 80, 80, { stroke: '#8b5cf6', strokeWidth: 4, roughness: 3, bowing: 2 });
        this.rc.ellipse(0, 0, 60, 60, { stroke: '#c4b5fd', strokeWidth: 2, roughness: 2 });
        this.ctx.restore();
        this.ctx.fillStyle = '#8b5cf6';
        this.ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif';
        this.ctx.fillText('前往试炼场', px - 40, py - 60);
    }

    private drawNPC() {
        const nx = this.npcLiJing.x;
        const ny = this.npcLiJing.y;
        this.rc.rectangle(nx - 20, ny - 30, 40, 70, { fill: '#3b82f6', fillStyle: 'hachure', roughness: 1 });
        this.rc.circle(nx, ny - 50, 30, { fill: '#fed7aa', fillStyle: 'solid', roughness: 1 });
        this.rc.polygon([[nx - 10, ny - 35], [nx + 10, ny - 35], [nx, ny - 15]], { fill: '#1f2937', fillStyle: 'solid' });
        this.rc.line(nx - 30, ny, nx - 30, ny - 60, { stroke: '#000', strokeWidth: 3, roughness: 1 });

        const dist = Math.sqrt(Math.pow(this.hero.x - nx, 2) + Math.pow(this.hero.y - ny, 2));
        if (dist < 100 && !this.dialogue.active) {
            this.ctx.fillStyle = '#1f2937';
            this.ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif';
            this.ctx.fillText('[按 F 交互]', nx - 35, ny - 80);
        }
    }

    private drawEnemies() {
        for (let enemy of this.enemies) {
            const isHit = enemy.hitFlashTimer > 0;
            const isAttacking = enemy.state === 'ATTACKING';
            const roughLevel = isHit ? 4 : (isAttacking ? 3 : 1.5);
            const strokeColor = isHit ? '#ef4444' : (isAttacking ? '#b91c1c' : '#4b5563');
            const bodyFill = isHit ? '#fca5a5' : '#9ca3af';

            this.ctx.save();
            this.ctx.translate(enemy.x, enemy.y);
            if (isAttacking && enemy.attackTimer < 20 && enemy.attackTimer > 5) {
                const angle = Math.atan2(enemy.dirY, enemy.dirX);
                this.ctx.rotate(angle);
                this.rc.polygon([[0, -10], [60, 0], [0, 10]], { fill: '#ef4444', fillStyle: 'solid', roughness: 3, stroke: 'none' });
                this.ctx.rotate(-angle); 
            }
            this.rc.rectangle(-10, -20, 20, 50, { fill: bodyFill, fillStyle: 'hachure', roughness: roughLevel, stroke: strokeColor });
            this.rc.line(-30, -5, 30, -5, { stroke: strokeColor, strokeWidth: 8, roughness: roughLevel });
            this.rc.circle(0, -35, 30, { fill: isAttacking ? '#f87171' : '#d1d5db', fillStyle: 'solid', roughness: roughLevel, stroke: strokeColor, strokeWidth: 2 });
            this.ctx.restore();
        }
    }

    private drawHero(cx: number, cy: number) {
        if (this.hero.state === 'DEAD') {
            const deathOpts = { roughness: 4, stroke: '#6b7280', strokeWidth: 2 };
            this.rc.ellipse(cx, cy + 20, 80, 40, { fill: '#9ca3af', fillStyle: 'hachure', hachureAngle: 0, ...deathOpts });
            this.rc.line(cx - 50, cy + 30, cx + 50, cy - 10, deathOpts);
            this.rc.line(cx - 30, cy - 20, cx + 60, cy + 40, deathOpts);
            this.rc.line(cx - 70, cy + 50, cx + 40, cy + 60, { stroke: '#4b5563', strokeWidth: 4, roughness: 3 });
            return;
        }

        const isHit = this.hero.hitFlashTimer > 0;
        const colors = { red: isHit ? '#fef2f2' : '#dc2626', gold: isHit ? '#fef3c7' : '#fbbf24', skin: isHit ? '#ffedd5' : '#fed7aa', hair: isHit ? '#6b7280' : '#1f2937' };

        if (this.hero.state === 'NORMAL') {
            const breath = Math.sin(this.frame * 0.1) * 3;
            const rOpts = { roughness: isHit ? 3 : 1.5 }; 
            const spearY = cy - 30 + breath;
            this.rc.line(cx - 80, spearY + 20, cx + 80, spearY - 25, { stroke: '#6b7280', strokeWidth: 5, ...rOpts });
            this.rc.circle(cx - 30, cy + 80 + breath, 30, { stroke: colors.gold, strokeWidth: 3, ...rOpts });
            this.rc.circle(cx + 30, cy + 80 + breath, 30, { stroke: colors.gold, strokeWidth: 3, ...rOpts });
            this.rc.polygon([[cx - 20, cy], [cx + 20, cy], [cx + 25, cy + 50], [cx - 25, cy + 50]], { fill: colors.red, fillStyle: 'hachure' });
            const headY = cy - 40 + breath;
            this.rc.ellipse(cx, headY, 70, 60, { fill: colors.skin, fillStyle: 'solid', ...rOpts });
            this.rc.circle(cx - 30, headY - 35, 20, { fill: colors.hair, fillStyle: 'solid' });
            this.rc.circle(cx + 30, headY - 35, 20, { fill: colors.hair, fillStyle: 'solid' });
            this.rc.ellipse(cx - 15, headY + 5, 20, 12, { fill: '#9ca3af', fillStyle: 'solid', stroke: 'none' });
            this.rc.ellipse(cx + 15, headY + 5, 20, 12, { fill: '#9ca3af', fillStyle: 'solid', stroke: 'none' });
            
            const eyeColor = isHit ? '#fff' : '#000';
            this.rc.circle(cx - 15, headY + 5, 4, { fill: eyeColor, fillStyle: 'solid' });
            this.rc.circle(cx + 15, headY + 5, 4, { fill: eyeColor, fillStyle: 'solid' });
            
            this.rc.curve([[cx - 80, cy + 40], [cx - 50, cy + 80], [cx - 15, cy + 45]], { stroke: colors.red, strokeWidth: 8, ...rOpts });
            this.rc.curve([[cx + 80, cy + 40], [cx + 50, cy + 80], [cx + 15, cy + 45]], { stroke: colors.red, strokeWidth: 8, ...rOpts });
        } else if (this.hero.state === 'DASHING') {
            this.ctx.save();
            this.ctx.translate(cx, cy);
            this.ctx.rotate(Math.atan2(this.hero.dirY, this.hero.dirX));
            this.rc.line(-150, 0, -50, 0, { stroke: this.hero.boonColor, strokeWidth: 5, roughness: 3 });
            this.rc.polygon([[-40, -30], [50, 0], [-40, 30]], { fill: colors.red, fillStyle: 'hachure', hachureGap: 3, roughness: 3, stroke: this.hero.boonColor });
            this.ctx.restore();
        } else if (this.hero.state === 'ATTACKING') {
            this.ctx.save();
            this.ctx.translate(cx, cy);
            this.ctx.rotate(Math.atan2(this.hero.dirY, this.hero.dirX));
            this.rc.line(30, -30, 160, -10, { stroke: colors.red, roughness: 3, strokeWidth: 2, bowing: 2 });
            this.rc.line(40, 30, 150, 10, { stroke: this.hero.boonColor, roughness: 3, strokeWidth: 2, bowing: 2 });
            this.rc.line(-50, 0, 100, 0, { stroke: '#6b7280', strokeWidth: 6, roughness: 1 });
            this.rc.polygon([[100, -15], [160, 0], [100, 15]], { fill: this.hero.boonColor, fillStyle: 'solid' });
            this.rc.ellipse(-20, 0, 60, 40, { fill: colors.red, fillStyle: 'hachure', roughness: 2 });
            this.rc.ellipse(-10, -20, 40, 40, { fill: colors.skin, fillStyle: 'solid', roughness: 1.5 });
            this.ctx.restore();
        }
    }

    private gameLoop = () => {
        this.update();
        if (this.frame % 3 === 0) {
            this.draw();
        }
        requestAnimationFrame(this.gameLoop);
    }
}