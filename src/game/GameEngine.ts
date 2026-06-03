import rough from 'roughjs';
import { Input } from '../engine/Input';
import type { Enemy, DialogueLine, Boon, Obstacle, Door } from './entities/Types';
import { DialogueUI } from './ui/DialogueUI';
import { GameHUD } from './ui/GameHUD';
import { BoonSystem } from './systems/BoonSystem';
import { BoonUI } from './ui/BoonUI';
import { UpgradeUI } from './ui/UpgradeUI';

// 导入分离出来的三大渲染器
import { HeroRenderer } from './render/HeroRenderer';
import { EntityRenderer } from './render/EntityRenderer';
import { EnvironmentRenderer } from './render/EnvironmentRenderer';

export class GameEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private rc: any;
    private frame: number = 0;

    private screenW: number = 800;
    private screenH: number = 600;

    // 关卡与剧情进度控制
    private currentLevel: number = 1; 
    private hasUnlockedSpear: boolean = false; 
    private bossDefeatedNezha: boolean = false; 

    private currentScene: 'HOME' | 'BATTLE' | 'OASIS' = 'HOME';

    private hero = { 
        x: 400, y: 400, speed: 5, radius: 25,
        hp: 100, maxHp: 100, attack: 15, defense: 0, spiritStones: 0,
        state: 'NORMAL', 
        dirX: 1, dirY: 0,
        dashTimer: 0, dashDuration: 12, dashSpeed: 20, dashCooldown: 0,
        attackTimer: 0, attackDuration: 15, attackCooldown: 0, attackThrustSpeed: 3,
        hasDealtDamage: false, hitFlashTimer: 0,
        boonColor: '#fbbf24'
    };

    private npcLiJing = { x: 400, y: 200, radius: 40 };
    private npcTaiyi = { x: 1000, y: 300, radius: 50 }; 
    
    private homePortal = { x: 800, y: 200, radius: 40, active: false };
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

    private resurrect() {
        this.hero.hp = this.hero.maxHp;
        this.hero.state = 'NORMAL';
        this.hero.hitFlashTimer = 0;
        this.hero.attackCooldown = 20;
        this.hero.hasDealtDamage = false;
        this.hero.boonColor = '#fbbf24'; 

        this.currentLevel = 1; // 重置层数
        
        this.currentScene = 'HOME';
        this.hero.x = 400;
        this.hero.y = 400;
        this.homePortal.active = false; 
        this.dialogue.active = false;
    }

    private startDialogue(lines: DialogueLine[]) {
        this.dialogue.active = true;
        this.dialogue.index = 0;
        this.dialogue.lines = lines;
        this.dialogue.cooldown = 15; 
        this.hero.state = 'NORMAL'; 
    }

    private transitionToBattle(rewardType: 'BOON' | 'HEAL') {
        this.currentScene = 'BATTLE';
        this.roomCleared = false;
        this.expectedReward = rewardType;
        this.doors = []; 
        this.hero.x = this.mapWidth / 2; 
        this.hero.y = this.mapHeight - 150;
        
        if (this.currentLevel === 5) {
            this.obstacles = [];
            this.enemies = [{ 
                id: 999, x: this.mapWidth / 2, y: 300, hp: 9999, maxHp: 9999, radius: 50, 
                hitFlashTimer: 0, speed: 1.5, state: 'CHASING', attackTimer: 0, attackCooldown: 100, 
                dirX: 0, dirY: 0, isBoss: true, name: '太乙真人', attackRound: 0 
            }];
            return;
        }

        this.currentLevel++; 
        
        this.obstacles = [];
        const types: ('ROCK' | 'BAMBOO' | 'POND')[] = ['ROCK', 'BAMBOO', 'POND'];
        const numObstacles = Math.floor(Math.random() * 4) + 6; 
        for (let i = 0; i < numObstacles; i++) {
            let ox = 200 + Math.random() * (this.mapWidth - 400);
            let oy = 200 + Math.random() * (this.mapHeight - 400);
            const distToHero = Math.sqrt(Math.pow(ox - this.hero.x, 2) + Math.pow(oy - this.hero.y, 2));
            if (distToHero < 150) oy -= 200; 
            this.obstacles.push({ x: ox, y: oy, radius: 50 + Math.random() * 30, type: types[Math.floor(Math.random() * types.length)] });
        }

        this.enemies = [
            { id: 1, x: this.mapWidth / 2 - 200, y: 300, hp: 50, maxHp: 50, radius: 30, hitFlashTimer: 0, speed: 2, state: 'CHASING', attackTimer: 0, attackCooldown: 0, dirX: 0, dirY: 0 },
            { id: 2, x: this.mapWidth / 2 + 200, y: 300, hp: 50, maxHp: 50, radius: 30, hitFlashTimer: 0, speed: 2.5, state: 'CHASING', attackTimer: 0, attackCooldown: 0, dirX: 0, dirY: 0 },
            { id: 3, x: this.mapWidth / 2, y: 200, hp: 70, maxHp: 70, radius: 35, hitFlashTimer: 0, speed: 1.5, state: 'CHASING', attackTimer: 0, attackCooldown: 0, dirX: 0, dirY: 0 },
        ];
    }

    private transitionToOasis() {
        this.currentScene = 'OASIS';
        this.roomCleared = true; 
        this.hero.x = this.mapWidth / 2;
        this.hero.y = this.mapHeight - 150;
        this.lotusPool.x = this.mapWidth / 2;
        this.lotusPool.y = this.mapHeight / 2 - 100;
        this.lotusPool.used = false;
        this.obstacles = [];
        this.enemies = [];
        this.spawnRewardDoors(); 
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
        
        if (this.hero.state === 'DEAD') {
            if (Input.keys.j) this.resurrect();
            return; 
        }

        if (this.hero.state === 'UPGRADING') {
            if (this.dialogue.cooldown > 0) this.dialogue.cooldown--;
            if (this.dialogue.cooldown <= 0) {
                const cost = 50;
                if (Input.keys['1'] && this.hero.spiritStones >= cost) {
                    this.hero.spiritStones -= cost;
                    this.hero.maxHp += 20;
                    this.hero.hp += 20; 
                    this.dialogue.cooldown = 10; 
                }
                if (Input.keys['2'] && this.hero.spiritStones >= cost) {
                    this.hero.spiritStones -= cost;
                    this.hero.attack += 5;
                    this.dialogue.cooldown = 10;
                }
                if (Input.keys['3'] && this.hero.spiritStones >= cost) {
                    this.hero.spiritStones -= cost;
                    this.hero.defense += 2;
                    this.dialogue.cooldown = 10;
                }
                if (Input.keys.f) {
                    this.hero.state = 'NORMAL';
                    this.dialogue.cooldown = 15;
                }
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
            const distLi = Math.sqrt(Math.pow(this.hero.x - this.npcLiJing.x, 2) + Math.pow(this.hero.y - this.npcLiJing.y, 2));
            const distTaiyi = Math.sqrt(Math.pow(this.hero.x - this.npcTaiyi.x, 2) + Math.pow(this.hero.y - this.npcTaiyi.y, 2));

            if (distLi < 100 && Input.keys.f && this.dialogue.cooldown <= 0) {
                this.startDialogue([
                    { speaker: '李靖', text: '逆子！你又去哪里惹是生非了？', color: '#1d4ed8' },
                    { speaker: '哪吒', text: '我命由我不由天！是他们先欺负人的！', color: '#dc2626' },
                    { speaker: '李靖', text: '执迷不悟... 你且去后山试炼场好好反省！', color: '#1d4ed8' },
                    { speaker: '系统', text: '（通往试炼场的传送门已开启）', color: '#4b5563' }
                ]);
            } else if (distTaiyi < 100 && Input.keys.f && this.dialogue.cooldown <= 0) {
                // 【修复】：加入判定，是否触发传授武器剧情
                if (this.bossDefeatedNezha && !this.hasUnlockedSpear) {
                    this.startDialogue([
                        { speaker: '太乙真人', text: '徒儿啊，你一直用真气凝聚长枪，难怪连为师一招都接不下！', color: '#10b981' },
                        { speaker: '哪吒', text: '师傅偏心！乾坤圈和混天绫近战太吃亏了！', color: '#dc2626' },
                        { speaker: '太乙真人', text: '罢了罢了，这柄真正的【火尖枪】便传授于你，去打破天命吧！', color: '#10b981' },
                        { speaker: '系统', text: '（获得法宝：火尖枪。攻击力永久提升 20 点！）', color: '#fbbf24' }
                    ]);
                    this.hasUnlockedSpear = true;
                    this.hero.attack += 20; 
                } else {
                    this.hero.state = 'UPGRADING';
                    this.dialogue.cooldown = 15;
                }
            }

            if (this.homePortal.active) {
                const distPortal = Math.sqrt(Math.pow(this.hero.x - this.homePortal.x, 2) + Math.pow(this.hero.y - this.homePortal.y, 2));
                if (distPortal < 50) this.transitionToBattle('BOON');
            }
            
        } else if (this.currentScene === 'BATTLE') {
            this.updateEnemies();
            this.checkDoors();
            
        } else if (this.currentScene === 'OASIS') {
            const distPool = Math.sqrt(Math.pow(this.hero.x - this.lotusPool.x, 2) + Math.pow(this.hero.y - this.lotusPool.y, 2));
            if (distPool < this.lotusPool.radius + 50 && Input.keys.f && !this.lotusPool.used) {
                this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + this.hero.maxHp * 0.5);
                this.lotusPool.used = true;
            }
            this.checkDoors();
        }

        this.updateHero();
    }

    private checkDoors() {
        for (const door of this.doors) {
            const dist = Math.sqrt(Math.pow(this.hero.x - door.x, 2) + Math.pow(this.hero.y - door.y, 2));
            if (dist < 50) {
                if (door.rewardType === 'HEAL') this.transitionToOasis(); 
                else this.transitionToBattle(door.rewardType); 
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
                        enemy.hp -= this.hero.attack; 
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
                const distLi = Math.sqrt(Math.pow(this.hero.x - this.npcLiJing.x, 2) + Math.pow(this.hero.y - this.npcLiJing.y, 2));
                if (distLi < this.hero.radius + this.npcLiJing.radius && distLi > 0) {
                    const overlap = (this.hero.radius + this.npcLiJing.radius) - distLi;
                    this.hero.x += ((this.hero.x - this.npcLiJing.x) / distLi) * overlap;
                    this.hero.y += ((this.hero.y - this.npcLiJing.y) / distLi) * overlap;
                }
                const distTaiyi = Math.sqrt(Math.pow(this.hero.x - this.npcTaiyi.x, 2) + Math.pow(this.hero.y - this.npcTaiyi.y, 2));
                if (distTaiyi < this.hero.radius + this.npcTaiyi.radius && distTaiyi > 0) {
                    const overlap = (this.hero.radius + this.npcTaiyi.radius) - distTaiyi;
                    this.hero.x += ((this.hero.x - this.npcTaiyi.x) / distTaiyi) * overlap;
                    this.hero.y += ((this.hero.y - this.npcTaiyi.y) / distTaiyi) * overlap;
                }
            } else if (this.currentScene === 'OASIS') {
                const distPool = Math.sqrt(Math.pow(this.hero.x - this.lotusPool.x, 2) + Math.pow(this.hero.y - this.lotusPool.y, 2));
                if (distPool < this.hero.radius + this.lotusPool.radius && distPool > 0) {
                    const overlap = (this.hero.radius + this.lotusPool.radius) - distPool;
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
                if (!enemy.isBoss) {
                    this.hero.spiritStones += Math.floor(Math.random() * 6) + 5;
                }
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
                const triggerDist = enemy.isBoss ? 400 : 70; 
                if (dist < triggerDist && enemy.attackCooldown <= 0) {
                    enemy.state = 'ATTACKING'; 
                    enemy.attackTimer = enemy.isBoss ? 60 : 25; 
                    if (enemy.isBoss) {
                        enemy.attackRound = (enemy.attackRound || 0) + 1; 
                    }
                } else if (enemy.hitFlashTimer <= 0) {
                    enemy.x += enemy.dirX * enemy.speed; enemy.y += enemy.dirY * enemy.speed;
                }
            } else if (enemy.state === 'ATTACKING') {
                enemy.attackTimer--;
                
                if (enemy.isBoss && enemy.name === '太乙真人') {
                    if (enemy.attackTimer === 30) {
                        if (enemy.attackRound === 1) {
                            if (dist < 300 && this.hero.state !== 'DASHING') {
                                this.hero.hp -= 20;
                                this.hero.hitFlashTimer = 10;
                            }
                        } else if (enemy.attackRound === 2) {
                            this.bossDefeatedNezha = true;
                            this.hero.hp = 0;
                            this.hero.state = 'DEAD';
                        }
                    }
                    if (enemy.attackTimer <= 0) {
                        enemy.state = 'CHASING'; 
                        enemy.attackCooldown = 80; 
                    }
                } else {
                    if (enemy.attackTimer === 10 && this.hero.state !== 'DASHING' && dist < 80) {
                        const dmg = Math.max(1, 10 - this.hero.defense);
                        this.hero.hp -= dmg;
                        this.hero.hitFlashTimer = 10;
                        if (this.hero.hp <= 0) { this.hero.hp = 0; this.hero.state = 'DEAD'; }
                    }
                    if (enemy.attackTimer <= 0) { enemy.state = 'CHASING'; enemy.attackCooldown = 60; }
                }
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
        }
    }

    private draw() {
        this.ctx.clearRect(0, 0, this.screenW, this.screenH); 
        this.ctx.save();
        
        const cameraX = this.screenW / 2 - this.hero.x;
        const cameraY = this.screenH / 2 - this.hero.y;
        this.ctx.translate(cameraX, cameraY);

        EnvironmentRenderer.drawMap(this.rc, this.currentScene, this.mapWidth, this.mapHeight);
        
        if (this.currentScene === 'HOME') {
            EntityRenderer.drawNPCs(this.rc, this.ctx, this.hero, this.npcLiJing, this.npcTaiyi, this.dialogue.active);
            EnvironmentRenderer.drawHomePortal(this.rc, this.ctx, this.homePortal, this.frame);
        } else if (this.currentScene === 'OASIS') {
            EnvironmentRenderer.drawOasis(this.rc, this.ctx, this.hero, this.lotusPool);
            EnvironmentRenderer.drawDoors(this.rc, this.ctx, this.doors, this.frame);
        } else {
            EnvironmentRenderer.drawObstacles(this.rc, this.obstacles); 
            EnvironmentRenderer.drawDoors(this.rc, this.ctx, this.doors, this.frame);     
            EntityRenderer.drawEnemies(this.rc, this.ctx, this.enemies); 
        }

        HeroRenderer.draw(this.rc, this.ctx, this.hero, this.frame);
        this.ctx.restore();
        
        GameHUD.draw(this.rc, this.ctx, this.hero, this.currentScene);
        DialogueUI.draw(this.rc, this.ctx, this.frame, this.dialogue);
        
        if (this.hero.state === 'BOON_SELECTION') BoonUI.draw(this.rc, this.ctx, this.currentBoons);
        if (this.hero.state === 'UPGRADING') UpgradeUI.draw(this.rc, this.ctx, this.hero);
    }

    private gameLoop = () => {
        this.update();
        if (this.frame % 3 === 0) {
            this.draw();
        }
        requestAnimationFrame(this.gameLoop);
    }
}