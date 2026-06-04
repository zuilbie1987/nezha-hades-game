import rough from 'roughjs';
import { Input } from '../engine/Input';
import type { Enemy, DialogueLine, Boon, Obstacle, Door, WeaponType, Projectile, EnemyProjectile } from './entities/Types';
import { DialogueUI } from './ui/DialogueUI';
import { GameHUD } from './ui/GameHUD';
import { BoonSystem } from './systems/BoonSystem';
import { BoonUI } from './ui/BoonUI';
import { UpgradeUI } from './ui/UpgradeUI';

import { HeroRenderer } from './render/HeroRenderer';
import { EntityRenderer } from './render/EntityRenderer';
import { EnvironmentRenderer } from './render/EnvironmentRenderer';
import { GameConfig } from './config/GameConfig';
import { RoomGenerator } from './systems/RoomGenerator';

export class GameEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private rc: any;
    private frame: number = 0;

    private screenW: number = 800;
    private screenH: number = 600;

    private currentLevel: number = 1; 
    private taiyiDefeatCount: number = 0; 
    private unlockedWeapons: WeaponType[] = ['RING', 'SASH']; 

    private currentScene: 'HOME' | 'BATTLE' | 'OASIS' = 'HOME';

    private hero = { 
        x: 400, y: 400, speed: 5, radius: 25,
        hp: 100, maxHp: 100, attack: 15, defense: 0, spiritStones: 0,
        state: 'NORMAL', 
        dirX: 1, dirY: 0,
        dashTimer: 0, dashDuration: 12, dashSpeed: 20, dashCooldown: 0,
        attackTimer: 0, attackDuration: 15, attackCooldown: 0, attackThrustSpeed: 3,
        hasDealtDamage: false, hitFlashTimer: 0,
        boonColor: '#fbbf24',
        weapon: 'RING' as WeaponType, 
        ringBounces: 3, 
    };

    private projectiles: Projectile[] = []; 
    // 【新增】敌方弹幕池
    private enemyProjectiles: EnemyProjectile[] = []; 

    private npcLiJing = { x: 400, y: 200, radius: 40 };
    private npcTaiyi = { x: 1000, y: 300, radius: 50 }; 
    private weaponRack = { x: 200, y: 300, radius: 40 }; 
    
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
        this.projectiles = []; 
        this.enemyProjectiles = []; // 清理弹幕

        this.currentLevel = 1; 
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
        this.projectiles = [];
        this.enemyProjectiles = []; // 进新房间清空弹幕
        this.hero.x = this.mapWidth / 2; 
        this.hero.y = this.mapHeight - 150;
        
        if (this.currentLevel === 5) {
            const room = RoomGenerator.generateBossRoom(this.mapWidth);
            this.obstacles = room.obstacles;
            this.enemies = room.enemies;
            return;
        }

        this.currentLevel++; 
        const room = RoomGenerator.generateBattleRoom(this.mapWidth, this.mapHeight, this.hero.x, this.hero.y);
        this.obstacles = room.obstacles;
        this.enemies = room.enemies;
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
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.doors = RoomGenerator.spawnRewardDoors(this.mapWidth, this.mapHeight, this.obstacles); 
    }

    private applyBoon(boon: Boon) {
        boon.apply(this.hero); 
        this.hero.state = 'NORMAL'; 
        this.currentBoons = []; 
        this.doors = RoomGenerator.spawnRewardDoors(this.mapWidth, this.mapHeight, this.obstacles); 
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
                const cost = GameConfig.UPGRADE_COST;
                if (Input.keys['1'] && this.hero.spiritStones >= cost) {
                    this.hero.spiritStones -= cost; this.hero.maxHp += 20; this.hero.hp += 20; this.dialogue.cooldown = 10; 
                }
                if (Input.keys['2'] && this.hero.spiritStones >= cost) {
                    this.hero.spiritStones -= cost; this.hero.attack += 5; this.dialogue.cooldown = 10;
                }
                if (Input.keys['3'] && this.hero.spiritStones >= cost) {
                    this.hero.spiritStones -= cost; this.hero.defense += 2; this.dialogue.cooldown = 10;
                }
                if (Input.keys.f) {
                    this.hero.state = 'NORMAL'; this.dialogue.cooldown = 15;
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
            const distRack = Math.sqrt(Math.pow(this.hero.x - this.weaponRack.x, 2) + Math.pow(this.hero.y - this.weaponRack.y, 2));

            if (distLi < 100 && Input.keys.f && this.dialogue.cooldown <= 0) {
                this.startDialogue(GameConfig.DIALOGUES.LI_JING);
            } else if (distTaiyi < 100 && Input.keys.f && this.dialogue.cooldown <= 0) {
                if (this.taiyiDefeatCount === 1 && !this.unlockedWeapons.includes('SPEAR')) {
                    this.startDialogue(GameConfig.DIALOGUES.TAIYI_UNLOCK_SPEAR);
                    this.unlockedWeapons.push('SPEAR');
                    this.hero.weapon = 'SPEAR'; 
                    this.hero.attack += 20; 
                } else if (this.taiyiDefeatCount === 2 && !this.unlockedWeapons.includes('WHEELS')) {
                    this.startDialogue(GameConfig.DIALOGUES.TAIYI_UNLOCK_WHEELS);
                    this.unlockedWeapons.push('WHEELS');
                    this.hero.weapon = 'WHEELS'; 
                    this.hero.dashSpeed += 10; 
                } else {
                    this.hero.state = 'UPGRADING';
                    this.dialogue.cooldown = 15;
                }
            } else if (distRack < 100 && Input.keys.f && this.dialogue.cooldown <= 0) {
                if (this.unlockedWeapons.length > 1) {
                    const idx = this.unlockedWeapons.indexOf(this.hero.weapon);
                    this.hero.weapon = this.unlockedWeapons[(idx + 1) % this.unlockedWeapons.length];
                    this.dialogue.cooldown = 15;
                } else {
                    this.startDialogue(GameConfig.DIALOGUES.EMPTY_RACK);
                }
            }

            if (this.homePortal.active) {
                const distPortal = Math.sqrt(Math.pow(this.hero.x - this.homePortal.x, 2) + Math.pow(this.hero.y - this.homePortal.y, 2));
                if (distPortal < 50) this.transitionToBattle('BOON');
            }
            
        } else if (this.currentScene === 'BATTLE') {
            this.updateEnemies();
            this.updateProjectiles(); 
            this.updateEnemyProjectiles(); // 【新增】处理敌方子弹
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

    // 【修改】敌方子弹的更新与墙壁反弹逻辑
    private updateEnemyProjectiles() {
        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
            let p = this.enemyProjectiles[i];
            
            p.x += p.dirX * p.speed;
            p.y += p.dirY * p.speed;

            // 墙壁碰撞判定 (地图边界)
            if (p.x < 0 || p.x > this.mapWidth || p.y < 0 || p.y > this.mapHeight) {
                // =============== 预留反弹与怪物升级接口 ===============
                // 如果你想开启反弹机制，可以将下面这段代码取消注释：
                /*
                if (p.bounces < 2) { // 允许反弹 2 次
                    p.bounces++;
                    if (p.x < 0 || p.x > this.mapWidth) p.dirX *= -1; // 撞左右墙反弹
                    if (p.y < 0 || p.y > this.mapHeight) p.dirY *= -1; // 撞上下墙反弹
                    
                    // 让发射它的怪物变强 (狂暴机制)
                    const owner = this.enemies.find(e => e.id === p.ownerId);
                    if (owner && owner.attackCooldown > 10) {
                        owner.attackCooldown -= 10; // 冷却缩减，越射越快
                        owner.speed += 0.2; // 移速加快
                    }
                    continue; // 发生反弹，不销毁子弹
                }
                */
                // ====================================================

                // 当前逻辑：超出边界直接销毁
                this.enemyProjectiles.splice(i, 1);
                continue;
            }

            // 【注意】这里已经删除了普通障碍物的碰撞检查，子弹现在可以穿山越岭了！

            // 击中主角判定 (主角如果是 DASHING 状态则无敌闪避穿透)
            const distToHero = Math.sqrt(Math.pow(p.x - this.hero.x, 2) + Math.pow(p.y - this.hero.y, 2));
            if (distToHero < p.radius + this.hero.radius && this.hero.state !== 'DASHING' && this.hero.state !== 'DEAD') {
                const dmg = Math.max(1, p.damage - this.hero.defense);
                this.hero.hp -= dmg;
                this.hero.hitFlashTimer = 10;
                if (this.hero.hp <= 0) { this.hero.hp = 0; this.hero.state = 'DEAD'; }
                
                this.enemyProjectiles.splice(i, 1);
            }
        }
    }

    private updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];

            if (p.state === 'RETURNING') {
                const dx = this.hero.x - p.x;
                const dy = this.hero.y - p.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 40) {
                    this.projectiles.splice(i, 1);
                    continue;
                }
                p.dirX = dx / dist;
                p.dirY = dy / dist;
                p.x += p.dirX * p.speed;
                p.y += p.dirY * p.speed;
                continue;
            }

            p.x += p.dirX * p.speed;
            p.y += p.dirY * p.speed;

            if (p.x < 0 || p.x > this.mapWidth || p.y < 0 || p.y > this.mapHeight) {
                p.state = 'RETURNING';
                continue;
            }

            for (let enemy of this.enemies) {
                if (enemy.hp <= 0 || p.hitEnemies.includes(enemy.id)) continue;
                const dist = Math.sqrt(Math.pow(p.x - enemy.x, 2) + Math.pow(p.y - enemy.y, 2));
                if (dist < 25 + enemy.radius) {
                    enemy.hp -= p.damage;
                    enemy.hitFlashTimer = 8;
                    p.hitEnemies.push(enemy.id);

                    if (p.bouncesLeft > 0) {
                        p.bouncesLeft--;
                        p.damage = Math.floor(p.damage * 0.7); 
                        
                        let nextTarget = null;
                        let minDist = Infinity;
                        for (let e2 of this.enemies) {
                            if (e2.hp > 0 && !p.hitEnemies.includes(e2.id)) {
                                const d2 = Math.sqrt(Math.pow(p.x - e2.x, 2) + Math.pow(p.y - e2.y, 2));
                                if (d2 < minDist && d2 < 400) { 
                                    minDist = d2;
                                    nextTarget = e2;
                                }
                            }
                        }
                        
                        if (nextTarget) {
                            const ndx = nextTarget.x - p.x;
                            const ndy = nextTarget.y - p.y;
                            const ndist = Math.sqrt(ndx*ndx + ndy*ndy);
                            p.dirX = ndx / ndist;
                            p.dirY = ndy / ndist;
                        } else {
                            p.state = 'RETURNING'; 
                        }
                    } else {
                        p.state = 'RETURNING'; 
                    }
                    break; 
                }
            }
        }
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
                this.hero.hasDealtDamage = false; 
                
                if (this.hero.weapon === 'SPEAR') {
                    this.hero.attackTimer = 15; this.hero.attackCooldown = 20;
                } else if (this.hero.weapon === 'RING') {
                    this.hero.attackTimer = 10; this.hero.attackCooldown = 30;
                    this.projectiles.push({
                        x: this.hero.x, y: this.hero.y,
                        dirX: this.hero.dirX, dirY: this.hero.dirY,
                        speed: 15, damage: this.hero.attack, bouncesLeft: this.hero.ringBounces,
                        hitEnemies: [], state: 'FLYING', color: this.hero.boonColor
                    });
                } else if (this.hero.weapon === 'SASH') {
                    this.hero.attackTimer = 25; this.hero.attackCooldown = 25; 
                } else if (this.hero.weapon === 'WHEELS') {
                    this.hero.attackTimer = 20; this.hero.attackCooldown = 20; 
                }
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
            if (this.hero.weapon === 'SPEAR') {
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
            } else if (this.hero.weapon === 'SASH') {
                if (this.hero.attackTimer === 15) { 
                    for (let enemy of this.enemies) {
                        if (enemy.hp <= 0) continue; 
                        const dx = enemy.x - this.hero.x;
                        const dy = enemy.y - this.hero.y;
                        const dist = Math.sqrt(dx*dx + dy*dy);
                        if (dist < 150 + enemy.radius) { 
                            enemy.hp -= this.hero.attack * 0.8; 
                            enemy.hitFlashTimer = 8; 
                            enemy.x += this.hero.dirX * 40; 
                            enemy.y += this.hero.dirY * 40;
                        }
                    }
                }
            } else if (this.hero.weapon === 'WHEELS') {
                this.hero.x += this.hero.dirX * 12;
                this.hero.y += this.hero.dirY * 12;
                if (this.frame % 5 === 0) this.hero.hasDealtDamage = false; 

                if (!this.hero.hasDealtDamage) {
                    for (let enemy of this.enemies) {
                        if (enemy.hp <= 0) continue; 
                        const dist = Math.sqrt(Math.pow(enemy.x - this.hero.x, 2) + Math.pow(enemy.y - this.hero.y, 2));
                        if (dist < 60 + enemy.radius) {
                            enemy.hp -= this.hero.attack * 0.4; 
                            enemy.hitFlashTimer = 5; 
                        }
                    }
                    this.hero.hasDealtDamage = true;
                }
            }
            
            this.hero.attackTimer--;
            if (this.hero.attackTimer <= 0) this.hero.state = 'NORMAL';
        }

        const pad = 50;
        this.hero.x = Math.max(pad, Math.min(this.hero.x, this.mapWidth - pad));
        this.hero.y = Math.max(pad, Math.min(this.hero.y, this.mapHeight - pad));

        if (this.hero.state !== 'DASHING' && this.hero.weapon !== 'WHEELS') {
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
                    this.hero.spiritStones += Math.floor(Math.random() * (GameConfig.STONE_DROP_MAX - GameConfig.STONE_DROP_MIN + 1)) + GameConfig.STONE_DROP_MIN;
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

            // 【修改】高级怪物AI：远程怪懂拉扯，近战怪刚正面
            if (enemy.state === 'CHASING') {
                if (enemy.enemyType === 'RANGED') {
                    const attackDist = 450;
                    const fleeDist = 200;
                    
                    if (dist < fleeDist) { // 靠太近就跑避
                        enemy.x -= enemy.dirX * enemy.speed * 1.2; 
                        enemy.y -= enemy.dirY * enemy.speed * 1.2;
                    } else if (dist > attackDist) { // 太远就追
                        enemy.x += enemy.dirX * enemy.speed; 
                        enemy.y += enemy.dirY * enemy.speed;
                    }
                    
                    if (dist < attackDist && enemy.attackCooldown <= 0) {
                        enemy.state = 'ATTACKING';
                        enemy.attackTimer = 30; // 较长的施法前摇
                    }
                } 
                // 近战和 Boss 逻辑
                else {
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
                }
            } 
            else if (enemy.state === 'ATTACKING') {
                enemy.attackTimer--;
                
                if (enemy.isBoss && enemy.name === '太乙真人') {
                    if (enemy.attackTimer === 30) {
                        if (enemy.attackRound === 1) {
                            if (dist < 300 && this.hero.state !== 'DASHING') {
                                this.hero.hp -= 20;
                                this.hero.hitFlashTimer = 10;
                            }
                        } else if (enemy.attackRound === 2) {
                            this.taiyiDefeatCount++;
                            this.hero.hp = 0;
                            this.hero.state = 'DEAD';
                        }
                    }
                    if (enemy.attackTimer <= 0) {
                        enemy.state = 'CHASING'; 
                        enemy.attackCooldown = 80; 
                    }
                } 
                // 【新增】远程怪发射子弹
                else if (enemy.enemyType === 'RANGED') {
                    if (enemy.attackTimer === 10) {
                        this.enemyProjectiles.push({
                            x: enemy.x, y: enemy.y,
                            dirX: enemy.dirX, dirY: enemy.dirY,
                            speed: 8, damage: 15, radius: 10,
                            ownerId: enemy.id, bounces: 0 
                        });
                    }
                    if (enemy.attackTimer <= 0) {
                        enemy.state = 'CHASING'; 
                        enemy.attackCooldown = 90; 
                    }
                }
                // 原有的近战怪打人
                else {
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
            } else if (this.expectedReward === 'HEAL') {
                this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + 30);
                this.doors = RoomGenerator.spawnRewardDoors(this.mapWidth, this.mapHeight, this.obstacles);
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
            EnvironmentRenderer.drawWeaponRack(this.rc, this.ctx, this.weaponRack, this.hero, this.unlockedWeapons); 
        } else if (this.currentScene === 'OASIS') {
            EnvironmentRenderer.drawOasis(this.rc, this.ctx, this.hero, this.lotusPool);
            EnvironmentRenderer.drawDoors(this.rc, this.ctx, this.doors, this.frame);
        } else {
            EnvironmentRenderer.drawObstacles(this.rc, this.obstacles); 
            EnvironmentRenderer.drawDoors(this.rc, this.ctx, this.doors, this.frame);     
            EntityRenderer.drawEnemies(this.rc, this.ctx, this.enemies); 
            // 【新增】渲染敌方弹幕
            EntityRenderer.drawEnemyProjectiles(this.rc, this.ctx, this.enemyProjectiles, this.frame);
        }

        HeroRenderer.draw(this.rc, this.ctx, this.hero, this.frame, this.projectiles); 
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