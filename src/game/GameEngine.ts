import rough from 'roughjs';
import { Input } from '../engine/Input';
import type { Enemy, DialogueLine, Boon, BoonSlot, Obstacle, Door, WeaponType, Projectile, EnemyProjectile, ElementType, RewardType, DamageText } from './entities/Types';
import { DialogueUI } from './ui/DialogueUI';
import { GameHUD } from './ui/GameHUD';
import { BoonSystem } from './systems/BoonSystem';
import { BoonUI } from './ui/BoonUI';
import { UpgradeUI } from './ui/UpgradeUI';
import { ShopUI } from './ui/ShopUI'; 

import { HeroRenderer } from './render/HeroRenderer';
import { EntityRenderer } from './render/EntityRenderer';
import { EnvironmentRenderer } from './render/EnvironmentRenderer';
import { GameConfig } from './config/GameConfig';
import { RoomGenerator } from './systems/RoomGenerator';

export class GameEngine {
    private canvas: HTMLCanvasElement; private ctx: CanvasRenderingContext2D; private rc: any; private frame: number = 0;
    private screenW: number = 800; private screenH: number = 600;
    private lastTime: number = 0; private accumulator: number = 0; private readonly TIME_STEP: number = 1000 / 60; 
    private hitStopTimer: number = 0; private shakeTimer: number = 0; private shakeMagnitude: number = 0;

    private storyPhase: number = 0; private currentLevel: number = 1; private taiyiDefeatCount: number = 0; 
    private unlockedWeapons: WeaponType[] = ['RING', 'SASH']; 

    private currentScene: 'HOME' | 'BATTLE' | 'OASIS' | 'NPC_ROOM' = 'HOME';

    private hero = { 
        x: 800, y: 600, speed: 5, radius: 25,
        hp: 100, maxHp: 100, attack: 15, defense: 0, spiritStones: 0, gold: 0, critRate: 0.15, 
        state: 'NORMAL', dirX: 1, dirY: 0,
        dashTimer: 0, dashDuration: 8, dashSpeed: 15, dashCooldown: 0,
        attackTimer: 0, attackDuration: 15, attackCooldown: 0, attackThrustSpeed: 3,
        hasDealtDamage: false, hitFlashTimer: 0,
        weapon: 'RING' as WeaponType, ringBounces: 3, 
        
        // ====== 【核心修改】废弃单赐福，启用强大的三槽位流派 ======
        boons: { ATTACK: null, DASH: null, PASSIVE: null } as Record<BoonSlot, Boon | null>,

        maxRevives: 0, currentRevives: 0, reviveTimer: 0,
        weaponUpgrades: { 'RING': false, 'SASH': false, 'SPEAR': false, 'WHEELS': false } as Record<WeaponType, boolean>
    };

    private projectiles: Projectile[] = []; private enemyProjectiles: EnemyProjectile[] = []; private lightnings: { x1: number, y1: number, x2: number, y2: number, duration: number }[] = [];
    private damageTexts: DamageText[] = []; 
    private npcLiJing = { x: 800, y: 220, radius: 40 }; private weaponRack = { x: 350, y: 550, radius: 40 }; private npcTaiyi = { x: 1250, y: 480, radius: 50 }; private homeLotusPool = { x: 1250, y: 720, radius: 50 }; private homePortal = { x: 800, y: 950, radius: 40, active: false }; private lotusPool = { x: 800, y: 600, radius: 80, used: false };
    private currentNpcType: 'AOGUANG' | 'PIG' | 'BEASTS' | 'SHENGONGBAO' | null = null; private rewardNpcEntity = { x: 800, y: 400, radius: 60, interacted: false };
    private shopStock = [true, true, true];
    private postDialogueAction: 'AOBING_DEAD' | 'LIJING_DEAD' | null = null;
    private dialogue = { active: false, index: 0, lines: [] as DialogueLine[], cooldown: 0 };
    private mapWidth = 1600; private mapHeight = 1200;
    private enemies: Enemy[] = []; private obstacles: Obstacle[] = []; private doors: Door[] = [];         
    private currentBoons: Boon[] = []; private roomCleared: boolean = false; private expectedReward: RewardType = 'BOON'; 

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement; this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D; this.rc = rough.canvas(this.canvas);
        window.addEventListener('resize', this.handleResize); this.handleResize(); requestAnimationFrame(this.gameLoop);
    }
    private handleResize = () => { const dpr = window.devicePixelRatio || 1; this.screenW = window.innerWidth; this.screenH = window.innerHeight; this.canvas.width = this.screenW * dpr; this.canvas.height = this.screenH * dpr; this.ctx.resetTransform(); this.ctx.scale(dpr, dpr); }
    private triggerHitStop(ms: number) { this.hitStopTimer = ms; }
    private triggerScreenShake(ms: number, mag: number) { this.shakeTimer = ms; this.shakeMagnitude = mag; }

    private dealDamageToEnemy(enemy: Enemy, baseDamage: number, canCrit: boolean = true) {
        const isCrit = canCrit && (Math.random() < this.hero.critRate);
        let finalDamage = Math.floor(isCrit ? baseDamage * 2 : baseDamage);
        
        // ====== 【新增被动槽】豹子胆：暴击附加 20 真实伤害 ======
        if (isCrit && this.hero.boons.PASSIVE?.id === 'p3') {
            finalDamage += 20;
        }

        enemy.hp -= finalDamage;
        const tx = enemy.x + (Math.random() - 0.5) * 40; const ty = enemy.y - enemy.radius - Math.random() * 20;
        this.damageTexts.push({ x: tx, y: ty, value: finalDamage, isCrit, life: 45, maxLife: 45, vx: (Math.random() - 0.5) * 2, vy: -1.5 - Math.random() * 1.5 });
        return finalDamage;
    }

    // 【修改】接受动态传入元素类型
    private applyElementalStatus(targetEnemy: Enemy, baseDamage: number, element: ElementType) {
        if (element === 'FIRE') { targetEnemy.burnTimer = 300; } 
        else if (element === 'ICE') { targetEnemy.frostTimer = 240; } 
        else if (element === 'THUNDER') {
            let chains = 0;
            for (const other of this.enemies) {
                if (other.id === targetEnemy.id || other.hp <= 0) continue;
                const dist = Math.sqrt(Math.pow(targetEnemy.x - other.x, 2) + Math.pow(targetEnemy.y - other.y, 2));
                if (dist < 300) { 
                    this.dealDamageToEnemy(other, baseDamage * 0.6, false);
                    other.hitFlashTimer = 6;
                    this.lightnings.push({ x1: targetEnemy.x, y1: targetEnemy.y, x2: other.x, y2: other.y, duration: 8 });
                    chains++; if (chains >= 2) break;
                }
            }
        }
    }

    private handleHeroDeath() {
        if (this.hero.hp <= 0 && this.hero.state !== 'DEAD') {
            if (this.hero.currentRevives > 0) {
                this.hero.currentRevives--; this.hero.hp = this.hero.maxHp; this.hero.state = 'REVIVING'; this.hero.reviveTimer = 90; this.hero.hitFlashTimer = 0;
                this.triggerHitStop(30); this.triggerScreenShake(300, 8);
            } else { this.hero.hp = 0; this.hero.state = 'DEAD'; }
        }
    }

    private resurrect() {
        this.hero.hp = this.hero.maxHp; this.hero.state = 'NORMAL'; this.hero.hitFlashTimer = 0; this.hero.attackCooldown = 20; this.hero.hasDealtDamage = false; 
        this.hero.currentRevives = this.hero.maxRevives; this.hero.gold = 0;
        this.hero.weaponUpgrades = { 'RING': false, 'SASH': false, 'SPEAR': false, 'WHEELS': false };
        
        // ====== 【修改】复活清空所有槽位 ======
        this.hero.boons = { ATTACK: null, DASH: null, PASSIVE: null };

        this.projectiles = []; this.enemyProjectiles = []; this.lightnings = []; this.enemies = []; this.obstacles = []; this.doors = []; this.roomCleared = false; this.damageTexts = [];
        this.currentLevel = 1; this.currentScene = 'HOME'; this.hero.x = 800; this.hero.y = 600; this.homePortal.active = false; this.dialogue.active = false;
        if (this.storyPhase === 0 && this.taiyiDefeatCount > 0) { this.storyPhase = 1; }
    }

    private startDialogue(lines: DialogueLine[]) { this.dialogue.active = true; this.dialogue.index = 0; this.dialogue.lines = lines; this.dialogue.cooldown = 15; this.hero.state = 'NORMAL'; }
    private transitionToNPC(npcType: 'AOGUANG' | 'PIG' | 'BEASTS' | 'SHENGONGBAO') {
        this.currentScene = 'NPC_ROOM'; this.currentNpcType = npcType; this.rewardNpcEntity.interacted = false; this.hero.x = this.mapWidth / 2; this.hero.y = this.mapHeight - 150; this.rewardNpcEntity.x = this.mapWidth / 2; this.rewardNpcEntity.y = this.mapHeight / 2 - 100; this.doors = []; this.obstacles = []; this.enemies = []; this.projectiles = []; this.enemyProjectiles = []; this.lightnings = []; this.damageTexts = []; this.currentLevel++;
        if (npcType === 'SHENGONGBAO') { this.shopStock = [true, true, true]; }
    }
    private transitionToBattle(rewardType: RewardType) {
        this.currentScene = 'BATTLE'; this.roomCleared = false; this.expectedReward = rewardType; this.doors = []; this.projectiles = []; this.enemyProjectiles = []; this.lightnings = []; this.damageTexts = []; this.hero.x = this.mapWidth / 2; this.hero.y = this.mapHeight - 150; this.currentLevel++; 
        if (rewardType === 'BOSS') {
            const room = RoomGenerator.generateBossRoom(this.mapWidth, this.storyPhase); this.obstacles = room.obstacles; this.enemies = room.enemies;
            if (this.storyPhase === 0) this.startDialogue(GameConfig.DIALOGUES.BOSS_TAIYI_ENCOUNTER); else if (this.storyPhase === 1) this.startDialogue(GameConfig.DIALOGUES.BOSS_AOBING_ENCOUNTER); else this.startDialogue(GameConfig.DIALOGUES.BOSS_LIJING_ENCOUNTER); return;
        }
        const room = RoomGenerator.generateBattleRoom(this.mapWidth, this.mapHeight, this.hero.x, this.hero.y, this.storyPhase); this.obstacles = room.obstacles; this.enemies = room.enemies;
    }
    private transitionToOasis() {
        this.currentScene = 'OASIS'; this.roomCleared = true; this.hero.x = this.mapWidth / 2; this.hero.y = this.mapHeight - 150; this.lotusPool.x = this.mapWidth / 2; this.lotusPool.y = this.mapHeight / 2 - 100; this.lotusPool.used = false; this.obstacles = []; this.enemies = []; this.projectiles = []; this.enemyProjectiles = []; this.lightnings = []; this.damageTexts = []; this.doors = RoomGenerator.spawnRewardDoors(this.mapWidth, this.mapHeight, this.obstacles, this.currentLevel); this.currentLevel++;
    }
    
    // ====== 【修改】拾取赐福放入对应槽位 ======
    private applyBoon(boon: Boon) { 
        this.hero.boons[boon.slot] = boon; 
        this.hero.state = 'NORMAL'; this.currentBoons = []; this.doors = RoomGenerator.spawnRewardDoors(this.mapWidth, this.mapHeight, this.obstacles, this.currentLevel); 
    }

    private update() {
        this.frame++;
        for (let i = this.lightnings.length - 1; i >= 0; i--) { this.lightnings[i].duration--; if (this.lightnings[i].duration <= 0) this.lightnings.splice(i, 1); }
        for (let i = this.damageTexts.length - 1; i >= 0; i--) { const dt = this.damageTexts[i]; dt.x += dt.vx; dt.y += dt.vy; dt.life--; if (dt.life <= 0) this.damageTexts.splice(i, 1); }

        if (this.hero.state === 'DEAD') { if (Input.keys.f) this.resurrect(); return; }

        // ====== 【新增被动槽】太乙真人 造化青莲：缓慢回血 ======
        if (this.hero.state !== 'DEAD' && this.hero.boons.PASSIVE?.id === 'p2' && this.frame % 30 === 0) {
            this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + 1);
        }

        if (this.hero.state === 'UPGRADING') {
            if (this.dialogue.cooldown > 0) this.dialogue.cooldown--;
            if (this.dialogue.cooldown <= 0) {
                const cost = GameConfig.UPGRADE_COST;
                if (Input.keys['1'] && this.hero.spiritStones >= cost) { this.hero.spiritStones -= cost; this.hero.maxHp += 20; this.hero.hp += 20; this.dialogue.cooldown = 10; }
                if (Input.keys['2'] && this.hero.spiritStones >= cost) { this.hero.spiritStones -= cost; this.hero.attack += 5; this.dialogue.cooldown = 10; }
                if (Input.keys['3'] && this.hero.spiritStones >= cost) { this.hero.spiritStones -= cost; this.hero.defense += 2; this.dialogue.cooldown = 10; }
                if (Input.keys.f) { this.hero.state = 'NORMAL'; this.dialogue.cooldown = 15; }
            } return; 
        }
        if (this.hero.state === 'BOON_SELECTION') { if (Input.keys['1'] && this.currentBoons[0]) this.applyBoon(this.currentBoons[0]); if (Input.keys['2'] && this.currentBoons[1]) this.applyBoon(this.currentBoons[1]); if (Input.keys['3'] && this.currentBoons[2]) this.applyBoon(this.currentBoons[2]); return; }

        if (this.hero.state === 'SHOPPING') {
            if (this.dialogue.cooldown > 0) this.dialogue.cooldown--;
            if (this.dialogue.cooldown <= 0) {
                if (Input.keys['1'] && this.shopStock[0] && this.hero.gold >= 150) { this.hero.gold -= 150; this.shopStock[0] = false; const boon = BoonSystem.generateBoons(1)[0]; this.applyBoon(boon); this.dialogue.cooldown = 15; }
                if (Input.keys['2'] && this.shopStock[1] && this.hero.gold >= 50) { this.hero.gold -= 50; this.shopStock[1] = false; this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + 50); this.dialogue.cooldown = 15; }
                if (Input.keys['3'] && this.shopStock[2]) { this.shopStock[2] = false; this.hero.maxHp = Math.max(1, Math.floor(this.hero.maxHp / 2)); if (this.hero.hp > this.hero.maxHp) this.hero.hp = this.hero.maxHp; this.hero.gold += 150; this.dialogue.cooldown = 15; this.triggerScreenShake(200, 5); }
                if (Input.keys.f) { this.hero.state = 'NORMAL'; this.dialogue.cooldown = 15; this.doors = RoomGenerator.spawnRewardDoors(this.mapWidth, this.mapHeight, [], this.currentLevel); }
            } return; 
        }

        if (this.dialogue.cooldown > 0) this.dialogue.cooldown--;
        if (this.dialogue.active) {
            if (Input.keys.f && this.dialogue.cooldown <= 0) {
                this.dialogue.index++; this.dialogue.cooldown = 15;
                if (this.dialogue.index >= this.dialogue.lines.length) {
                    this.dialogue.active = false;
                    if (this.postDialogueAction === 'AOBING_DEAD') { this.storyPhase = 2; this.postDialogueAction = null; this.resurrect(); return; } else if (this.postDialogueAction === 'LIJING_DEAD') { this.storyPhase = 2; this.postDialogueAction = null; this.resurrect(); return; }
                    if (this.currentScene === 'HOME') this.homePortal.active = true;
                    else if (this.currentScene === 'NPC_ROOM' && this.doors.length === 0) {
                        if (this.currentNpcType === 'AOGUANG') this.hero.gold += 150; else if (this.currentNpcType === 'PIG') { this.hero.maxHp += 25; this.hero.hp += 25; } else if (this.currentNpcType === 'BEASTS') { this.hero.weaponUpgrades[this.hero.weapon] = true; }
                        if (this.currentNpcType === 'SHENGONGBAO') { this.hero.state = 'SHOPPING'; } else { this.doors = RoomGenerator.spawnRewardDoors(this.mapWidth, this.mapHeight, [], this.currentLevel); }
                    }
                }
            } return;
        }

        if (this.hero.dashCooldown > 0) this.hero.dashCooldown--; if (this.hero.attackCooldown > 0) this.hero.attackCooldown--; if (this.hero.hitFlashTimer > 0) this.hero.hitFlashTimer--;

        if (this.currentScene === 'HOME') {
            const distLi = Math.sqrt(Math.pow(this.hero.x - this.npcLiJing.x, 2) + Math.pow(this.hero.y - this.npcLiJing.y, 2)); const distTaiyi = Math.sqrt(Math.pow(this.hero.x - this.npcTaiyi.x, 2) + Math.pow(this.hero.y - this.npcTaiyi.y, 2)); const distRack = Math.sqrt(Math.pow(this.hero.x - this.weaponRack.x, 2) + Math.pow(this.hero.y - this.weaponRack.y, 2)); const distHomePool = Math.sqrt(Math.pow(this.hero.x - this.homeLotusPool.x, 2) + Math.pow(this.hero.y - this.homeLotusPool.y, 2));
            if (distHomePool < 100 && Input.keys.f && this.dialogue.cooldown <= 0) { if (this.hero.maxRevives < 3) { const cost = GameConfig.REVIVE_COSTS[this.hero.maxRevives]; if (this.hero.spiritStones >= cost) { this.hero.spiritStones -= cost; this.hero.maxRevives++; this.hero.currentRevives++; this.dialogue.cooldown = 20; } } } else if (distLi < 100 && Input.keys.f && this.dialogue.cooldown <= 0) { this.startDialogue(GameConfig.DIALOGUES.LI_JING); } else if (distTaiyi < 100 && Input.keys.f && this.dialogue.cooldown <= 0) { if (this.taiyiDefeatCount === 0) return; if (!this.unlockedWeapons.includes('SPEAR')) { this.startDialogue(GameConfig.DIALOGUES.TAIYI_UNLOCK_SPEAR); this.unlockedWeapons.push('SPEAR'); this.hero.weapon = 'SPEAR'; this.hero.attack += 20; } else if (!this.unlockedWeapons.includes('WHEELS')) { this.startDialogue(GameConfig.DIALOGUES.TAIYI_UNLOCK_WHEELS); this.unlockedWeapons.push('WHEELS'); this.hero.weapon = 'WHEELS'; this.hero.dashSpeed += 10; } else { this.hero.state = 'UPGRADING'; this.dialogue.cooldown = 15; } } else if (distRack < 100 && Input.keys.f && this.dialogue.cooldown <= 0) { if (this.unlockedWeapons.length > 1) { const idx = this.unlockedWeapons.indexOf(this.hero.weapon); this.hero.weapon = this.unlockedWeapons[(idx + 1) % this.unlockedWeapons.length]; this.dialogue.cooldown = 15; } else { this.startDialogue(GameConfig.DIALOGUES.EMPTY_RACK); } }
            if (this.homePortal.active) { const distPortal = Math.sqrt(Math.pow(this.hero.x - this.homePortal.x, 2) + Math.pow(this.hero.y - this.homePortal.y, 2)); if (distPortal < 50) this.transitionToBattle('BOON');  }
        } 
        else if (this.currentScene === 'NPC_ROOM') {
            const distNpc = Math.sqrt(Math.pow(this.hero.x - this.rewardNpcEntity.x, 2) + Math.pow(this.hero.y - this.rewardNpcEntity.y, 2));
            if (distNpc < this.rewardNpcEntity.radius + 80 && Input.keys.f && !this.rewardNpcEntity.interacted && this.dialogue.cooldown <= 0) {
                this.rewardNpcEntity.interacted = true;
                if (this.currentNpcType === 'AOGUANG') this.startDialogue(GameConfig.DIALOGUES.NPC_AOGUANG); else if (this.currentNpcType === 'PIG') this.startDialogue(GameConfig.DIALOGUES.NPC_PIG); else if (this.currentNpcType === 'BEASTS') this.startDialogue(GameConfig.DIALOGUES.NPC_BEASTS); else if (this.currentNpcType === 'SHENGONGBAO') this.startDialogue(GameConfig.DIALOGUES.NPC_SHENGONGBAO);
            }
            this.checkDoors();
        }
        else if (this.currentScene === 'BATTLE') { this.updateEnemies(); this.updateProjectiles(); this.updateEnemyProjectiles(); this.checkDoors(); } else if (this.currentScene === 'OASIS') { const distPool = Math.sqrt(Math.pow(this.hero.x - this.lotusPool.x, 2) + Math.pow(this.hero.y - this.lotusPool.y, 2)); if (distPool < this.lotusPool.radius + 50 && Input.keys.f && !this.lotusPool.used) { this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + this.hero.maxHp * 0.5); this.lotusPool.used = true; } this.checkDoors(); }
        
        this.updateHero();
    }

    private updateEnemyProjectiles() {
        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
            let p = this.enemyProjectiles[i]; p.x += p.dirX * p.speed; p.y += p.dirY * p.speed;
            if (p.x < 0 || p.x > this.mapWidth || p.y < 0 || p.y > this.mapHeight) { this.enemyProjectiles.splice(i, 1); continue; }
            const distToHero = Math.sqrt(Math.pow(p.x - this.hero.x, 2) + Math.pow(p.y - this.hero.y, 2));
            if (distToHero < p.radius + this.hero.radius && this.hero.state !== 'DASHING' && this.hero.state !== 'REVIVING' && this.hero.state !== 'DEAD') {
                const dmg = Math.max(1, p.damage - this.hero.defense); this.hero.hp -= dmg; this.hero.hitFlashTimer = 10; this.triggerHitStop(50); this.triggerScreenShake(150, 4); this.handleHeroDeath(); this.enemyProjectiles.splice(i, 1);
            }
        }
    }

    private updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            if (p.state === 'RETURNING') { const dx = this.hero.x - p.x; const dy = this.hero.y - p.y; const dist = Math.sqrt(dx*dx + dy*dy); if (dist < 40) { this.projectiles.splice(i, 1); continue; } p.dirX = dx / dist; p.dirY = dy / dist; p.x += p.dirX * p.speed; p.y += p.dirY * p.speed; continue; }
            p.x += p.dirX * p.speed; p.y += p.dirY * p.speed;
            if (p.x < 0 || p.x > this.mapWidth || p.y < 0 || p.y > this.mapHeight) { p.state = 'RETURNING'; continue; }
            for (let enemy of this.enemies) {
                if (enemy.hp <= 0 || p.hitEnemies.includes(enemy.id)) continue;
                const dist = Math.sqrt(Math.pow(p.x - enemy.x, 2) + Math.pow(p.y - enemy.y, 2));
                if (dist < 25 + enemy.radius) {
                    this.dealDamageToEnemy(enemy, p.damage);
                    enemy.hitFlashTimer = 8; p.hitEnemies.push(enemy.id);
                    // ====== 【修改】取出攻击槽带的元素属性 ======
                    this.applyElementalStatus(enemy, p.damage, this.hero.boons.ATTACK?.element || 'NORMAL'); 
                    this.triggerHitStop(30);
                    if (p.bouncesLeft > 0) { p.bouncesLeft--; p.damage = Math.floor(p.damage * 0.7); let nextTarget = null; let minDist = Infinity; for (let e2 of this.enemies) { if (e2.hp > 0 && !p.hitEnemies.includes(e2.id)) { const d2 = Math.sqrt(Math.pow(p.x - e2.x, 2) + Math.pow(p.y - e2.y, 2)); if (d2 < minDist && d2 < 400) { minDist = d2; nextTarget = e2; } } } if (nextTarget) { const ndx = nextTarget.x - p.x; const ndy = nextTarget.y - p.y; const ndist = Math.sqrt(ndx*ndx + ndy*ndy); p.dirX = ndx / ndist; p.dirY = ndy / ndist; } else { p.state = 'RETURNING'; } } else { p.state = 'RETURNING'; } break; 
                }
            }
        }
    }

    private checkDoors() {
        for (const door of this.doors) {
            const dist = Math.sqrt(Math.pow(this.hero.x - door.x, 2) + Math.pow(this.hero.y - door.y, 2));
            if (dist < 50) { 
                if (door.rewardType === 'HEAL') this.transitionToOasis(); else if (door.rewardType === 'GOLD') this.transitionToNPC('AOGUANG'); else if (door.rewardType === 'MAX_HP') this.transitionToNPC('PIG'); else if (door.rewardType === 'HAMMER') this.transitionToNPC('BEASTS'); else if (door.rewardType === 'SHOP') this.transitionToNPC('SHENGONGBAO'); else this.transitionToBattle(door.rewardType); break; 
            }
        }
    }

    private checkObstacleCollision(entity: {x: number, y: number, radius: number}) {
        for (const obs of this.obstacles) { const dx = entity.x - obs.x; const dy = entity.y - obs.y; const dist = Math.sqrt(dx * dx + dy * dy); const minDist = entity.radius + obs.radius; if (dist < minDist && dist > 0) { const overlap = minDist - dist; entity.x += (dx / dist) * overlap; entity.y += (dy / dist) * overlap; } }
    }

    private updateHero() {
        if (this.hero.state === 'REVIVING') { this.hero.reviveTimer--; if (this.hero.reviveTimer <= 0) { this.hero.state = 'NORMAL'; this.hero.hitFlashTimer = 60; } return; }

        // ====== 【新增提取】读取冲刺流派属性 ======
        let currentDashSpeed = 15; let currentDashCool = 40;
        const dBoon = this.hero.boons.DASH;
        if (dBoon?.id === 'd1') { currentDashSpeed = 18; currentDashCool = 30; }
        else if (dBoon?.id === 'd2') { currentDashSpeed = 25; }
        else if (dBoon?.id === 'd3') { currentDashCool = 20; }

        // ====== 【新增提取】读取攻击流派属性 ======
        const aColor = this.hero.boons.ATTACK?.color || '#fbbf24';
        const aElement = this.hero.boons.ATTACK?.element || 'NORMAL';

        if (this.hero.state === 'NORMAL') {
            let dx = 0; let dy = 0; if (Input.keys.w) dy -= 1; if (Input.keys.s) dy += 1; if (Input.keys.a) dx -= 1; if (Input.keys.d) dx += 1;
            if (dx !== 0 || dy !== 0) { const length = Math.sqrt(dx * dx + dy * dy); this.hero.dirX = dx / length; this.hero.dirY = dy / length; this.hero.x += this.hero.dirX * this.hero.speed; this.hero.y += this.hero.dirY * this.hero.speed; }

            if (Input.keys.j && this.hero.attackCooldown <= 0 && this.currentScene === 'BATTLE') {
                this.hero.state = 'ATTACKING'; this.hero.hasDealtDamage = false; 
                if (this.hero.weapon === 'SPEAR') { this.hero.attackTimer = 15; this.hero.attackCooldown = 20; } 
                else if (this.hero.weapon === 'RING') { 
                    this.hero.attackTimer = 10; this.hero.attackCooldown = 30; const upg = this.hero.weaponUpgrades['RING'];
                    this.projectiles.push({ x: this.hero.x, y: this.hero.y, dirX: this.hero.dirX, dirY: this.hero.dirY, speed: upg ? 25 : 15, damage: this.hero.attack * (upg ? 1.2 : 1), bouncesLeft: this.hero.ringBounces + (upg ? 4 : 0), hitEnemies: [], state: 'FLYING', 
                    color: aColor }); // 【修改】圈的颜色跟着普攻走
                } 
                else if (this.hero.weapon === 'SASH') { this.hero.attackTimer = 25; this.hero.attackCooldown = 25; } 
                else if (this.hero.weapon === 'WHEELS') { this.hero.attackTimer = 20; this.hero.attackCooldown = 20; }
            } else if (Input.keys.space && this.hero.dashCooldown <= 0) { 
                this.hero.state = 'DASHING'; this.hero.dashTimer = this.hero.dashDuration; this.hero.dashCooldown = currentDashCool; // 【修改】应用变异冲刺CD
            }
        } else if (this.hero.state === 'DASHING') {
            this.hero.x += this.hero.dirX * currentDashSpeed; this.hero.y += this.hero.dirY * currentDashSpeed; // 【修改】应用变异冲刺速度
            this.hero.dashTimer--; if (this.hero.dashTimer <= 0) this.hero.state = 'NORMAL';
        } else if (this.hero.state === 'ATTACKING') {
            if (this.hero.weapon === 'SPEAR') {
                const upg = this.hero.weaponUpgrades['SPEAR']; const thrustAmt = upg ? 6 : this.hero.attackThrustSpeed; this.hero.x += this.hero.dirX * thrustAmt; this.hero.y += this.hero.dirY * thrustAmt;
                if (!this.hero.hasDealtDamage && this.hero.attackTimer > this.hero.attackDuration - 5) {
                    const hitboxX = this.hero.x + this.hero.dirX * 80; const hitboxY = this.hero.y + this.hero.dirY * 80; let hitAny = false;
                    for (let enemy of this.enemies) {
                        if (enemy.hp <= 0) continue; const dist = Math.sqrt(Math.pow(enemy.x - hitboxX, 2) + Math.pow(enemy.y - hitboxY, 2));
                        if (dist < (upg ? 80 : 50) + enemy.radius) { this.dealDamageToEnemy(enemy, this.hero.attack * (upg ? 1.5 : 1)); enemy.hitFlashTimer = 8; enemy.x += this.hero.dirX * 20; enemy.y += this.hero.dirY * 20; this.applyElementalStatus(enemy, this.hero.attack, aElement); hitAny = true; }
                    }
                    if (hitAny) { this.triggerHitStop(60); this.triggerScreenShake(100, 6); } this.hero.hasDealtDamage = true; 
                }
            } else if (this.hero.weapon === 'SASH') {
                if (this.hero.attackTimer === 15) { 
                    const upg = this.hero.weaponUpgrades['SASH']; let hitAny = false;
                    for (let enemy of this.enemies) {
                        if (enemy.hp <= 0) continue; const dx = enemy.x - this.hero.x; const dy = enemy.y - this.hero.y; const dist = Math.sqrt(dx*dx + dy*dy);
                        if (dist < (upg ? 250 : 150) + enemy.radius) { this.dealDamageToEnemy(enemy, this.hero.attack * (upg ? 1.5 : 0.8)); enemy.hitFlashTimer = 8; enemy.x += this.hero.dirX * 40; enemy.y += this.hero.dirY * 40; this.applyElementalStatus(enemy, this.hero.attack * (upg ? 1.5 : 0.8), aElement); hitAny = true; }
                    }
                    if (hitAny) { this.triggerHitStop(80); this.triggerScreenShake(200, 5); }
                }
            } else if (this.hero.weapon === 'WHEELS') {
                const upg = this.hero.weaponUpgrades['WHEELS']; const wheelSpeed = upg ? 18 : 12; this.hero.x += this.hero.dirX * wheelSpeed; this.hero.y += this.hero.dirY * wheelSpeed; 
                if (this.frame % (upg ? 2 : 5) === 0) this.hero.hasDealtDamage = false; 
                if (!this.hero.hasDealtDamage) {
                    for (let enemy of this.enemies) {
                        if (enemy.hp <= 0) continue; const dist = Math.sqrt(Math.pow(enemy.x - this.hero.x, 2) + Math.pow(enemy.y - this.hero.y, 2));
                        if (dist < 60 + enemy.radius) { this.dealDamageToEnemy(enemy, this.hero.attack * (upg ? 0.6 : 0.4)); enemy.hitFlashTimer = 5; this.applyElementalStatus(enemy, this.hero.attack * 0.4, aElement); this.triggerScreenShake(50, 2); }
                    }
                    this.hero.hasDealtDamage = true;
                }
            }
            this.hero.attackTimer--; if (this.hero.attackTimer <= 0) this.hero.state = 'NORMAL';
        }

        const pad = 50; this.hero.x = Math.max(pad, Math.min(this.hero.x, this.mapWidth - pad)); this.hero.y = Math.max(pad, Math.min(this.hero.y, this.mapHeight - pad));
        if (this.hero.state !== 'DASHING' && this.hero.weapon !== 'WHEELS') { this.checkObstacleCollision(this.hero); if (this.currentScene === 'HOME') { if (this.taiyiDefeatCount > 0) { const distTaiyi = Math.sqrt(Math.pow(this.hero.x - this.npcTaiyi.x, 2) + Math.pow(this.hero.y - this.npcTaiyi.y, 2)); if (distTaiyi < this.hero.radius + this.npcTaiyi.radius && distTaiyi > 0) { const overlap = (this.hero.radius + this.npcTaiyi.radius) - distTaiyi; this.hero.x += ((this.hero.x - this.npcTaiyi.x) / distTaiyi) * overlap; this.hero.y += ((this.hero.y - this.npcTaiyi.y) / distTaiyi) * overlap; } } const distLi = Math.sqrt(Math.pow(this.hero.x - this.npcLiJing.x, 2) + Math.pow(this.hero.y - this.npcLiJing.y, 2)); if (distLi < this.hero.radius + this.npcLiJing.radius && distLi > 0) { const overlap = (this.hero.radius + this.npcLiJing.radius) - distLi; this.hero.x += ((this.hero.x - this.npcLiJing.x) / distLi) * overlap; this.hero.y += ((this.hero.y - this.npcLiJing.y) / distLi) * overlap; } } else if (this.currentScene === 'OASIS') { const distPool = Math.sqrt(Math.pow(this.hero.x - this.lotusPool.x, 2) + Math.pow(this.hero.y - this.lotusPool.y, 2)); if (distPool < this.hero.radius + this.lotusPool.radius && distPool > 0) { const overlap = (this.hero.radius + this.lotusPool.radius) - distPool; this.hero.x += ((this.hero.x - this.lotusPool.x) / distPool) * overlap; this.hero.y += ((this.hero.y - this.lotusPool.y) / distPool) * overlap; } } }
    }

    private updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy.hitFlashTimer > 0) enemy.hitFlashTimer--; if (enemy.attackCooldown > 0) enemy.attackCooldown--;

            if (enemy.burnTimer && enemy.burnTimer > 0) { 
                enemy.burnTimer--; 
                if (this.frame % 30 === 0) { this.dealDamageToEnemy(enemy, 4, false); enemy.hitFlashTimer = 4; } 
            }
            let speedMultiplier = 1; if (enemy.frostTimer && enemy.frostTimer > 0) { enemy.frostTimer--; speedMultiplier = 0.5; }

            if (enemy.hp <= 0 && enemy.hitFlashTimer <= 0) {
                if (enemy.isBoss && enemy.name === '敖丙') { this.enemies.splice(i, 1); this.postDialogueAction = 'AOBING_DEAD'; this.startDialogue(GameConfig.DIALOGUES.AOBING_DEFEATED); continue; } 
                else if (enemy.isBoss && enemy.name === '李靖') { this.enemies.splice(i, 1); this.postDialogueAction = 'LIJING_DEAD'; this.startDialogue(GameConfig.DIALOGUES.LIJING_DEFEATED); continue; }
                
                // ====== 【新增被动槽】殷夫人 慈母血阵 ======
                if (!enemy.isBoss) { 
                    this.hero.spiritStones += Math.floor(Math.random() * (GameConfig.STONE_DROP_MAX - GameConfig.STONE_DROP_MIN + 1)) + GameConfig.STONE_DROP_MIN; 
                    if (this.hero.boons.PASSIVE?.id === 'p1' && Math.random() < 0.2) {
                        this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + 5);
                    }
                }
                this.enemies.splice(i, 1); continue;
            }

            for (let j = 0; j < this.enemies.length; j++) { if (i === j) continue; const other = this.enemies[j]; const edx = enemy.x - other.x; const edy = enemy.y - other.y; const edist = Math.sqrt(edx * edx + edy * edy); const minEdist = enemy.radius + other.radius; if (edist < minEdist && edist > 0) { const overlap = minEdist - edist; enemy.x += (edx / edist) * overlap * 0.1; enemy.y += (edy / edist) * overlap * 0.1; } }

            const dist = Math.sqrt(Math.pow(this.hero.x - enemy.x, 2) + Math.pow(this.hero.y - enemy.y, 2)); if (dist > 0) { enemy.dirX = (this.hero.x - enemy.x) / dist; enemy.dirY = (this.hero.y - enemy.y) / dist; }
            this.checkObstacleCollision(enemy);

            if (enemy.state === 'CHASING') {
                if (enemy.enemyType === 'RANGED') { const attackDist = 450; const fleeDist = 200; if (dist < fleeDist) { enemy.x -= enemy.dirX * enemy.speed * 1.2 * speedMultiplier; enemy.y -= enemy.dirY * enemy.speed * 1.2 * speedMultiplier; } else if (dist > attackDist) { enemy.x += enemy.dirX * enemy.speed * speedMultiplier; enemy.y += enemy.dirY * enemy.speed * speedMultiplier; } if (dist < attackDist && enemy.attackCooldown <= 0) { enemy.state = 'ATTACKING'; enemy.attackTimer = 30; } } else { const triggerDist = enemy.isBoss ? 400 : 70; if (dist < triggerDist && enemy.attackCooldown <= 0) { enemy.state = 'ATTACKING'; enemy.attackTimer = enemy.isBoss ? 60 : 25; if (enemy.isBoss) enemy.attackRound = (enemy.attackRound || 0) + 1; } else if (enemy.hitFlashTimer <= 0) { enemy.x += enemy.dirX * enemy.speed * speedMultiplier; enemy.y += enemy.dirY * enemy.speed * speedMultiplier; } }
            } else if (enemy.state === 'ATTACKING') {
                enemy.attackTimer--;
                if (enemy.isBoss && enemy.name === '太乙真人') { if (enemy.attackTimer === 30) { if (enemy.attackRound === 1) { if (dist < 300 && this.hero.state !== 'DASHING' && this.hero.state !== 'REVIVING') { this.hero.hp -= 20; this.hero.hitFlashTimer = 10; this.triggerScreenShake(200, 6); this.handleHeroDeath(); } } else if ((enemy.attackRound || 0) >= 2) { this.hero.hp -= 9999; this.handleHeroDeath(); if (this.hero.state === 'DEAD') { this.taiyiDefeatCount++; } } } if (enemy.attackTimer <= 0) { enemy.state = 'CHASING'; enemy.attackCooldown = 80; } } 
                else if (enemy.isBoss && enemy.name === '敖丙') { if (enemy.attackTimer === 30) { for(let k = 0; k < 8; k++) { const angle = (Math.PI / 4) * k; this.enemyProjectiles.push({ x: enemy.x, y: enemy.y, dirX: Math.cos(angle), dirY: Math.sin(angle), speed: 7, damage: 25, radius: 12, ownerId: enemy.id, bounces: 0 }); } } if (enemy.attackTimer <= 0) { enemy.state = 'CHASING'; enemy.attackCooldown = 70; } }
                else if (enemy.isBoss && enemy.name === '李靖') { if (enemy.attackTimer === 30) { if (enemy.attackRound === 1) { if (dist < 200 && this.hero.state !== 'DASHING' && this.hero.state !== 'REVIVING') { this.hero.hp -= 25; this.hero.hitFlashTimer = 10; this.triggerScreenShake(100, 4); this.handleHeroDeath(); } } else if ((enemy.attackRound || 0) >= 2) { this.enemyProjectiles.push({ x: this.hero.x, y: this.hero.y - 150, dirX: 0, dirY: 1, speed: 6, damage: 45, radius: 60, ownerId: enemy.id, bounces: 0 }); } } if (enemy.attackTimer <= 0) { enemy.state = 'CHASING'; enemy.attackCooldown = 60; } }
                else if (enemy.enemyType === 'RANGED') { if (enemy.attackTimer === 10) { this.enemyProjectiles.push({ x: enemy.x, y: enemy.y, dirX: enemy.dirX, dirY: enemy.dirY, speed: 8, damage: 15, radius: 10, ownerId: enemy.id, bounces: 0 }); } if (enemy.attackTimer <= 0) { enemy.state = 'CHASING'; enemy.attackCooldown = 90; } } else { if (enemy.attackTimer === 10 && this.hero.state !== 'DASHING' && this.hero.state !== 'REVIVING' && dist < 80) { const dmg = Math.max(1, 10 - this.hero.defense); this.hero.hp -= dmg; this.hero.hitFlashTimer = 10; this.triggerHitStop(40); this.triggerScreenShake(100, 4); this.handleHeroDeath(); } if (enemy.attackTimer <= 0) { enemy.state = 'CHASING'; enemy.attackCooldown = 60; } }
            }

            if (this.hero.state !== 'DASHING') { const minDist = this.hero.radius + enemy.radius; if (dist < minDist && dist > 0) { const overlap = minDist - dist; this.hero.x += (this.hero.x - enemy.x) / dist * overlap; this.hero.y += (this.hero.y - enemy.y) / dist * overlap; } }
        }
        
        if (this.enemies.length === 0 && !this.roomCleared && this.currentScene === 'BATTLE') {
            this.roomCleared = true;
            if (this.expectedReward === 'BOON') { this.hero.state = 'BOON_SELECTION'; this.currentBoons = BoonSystem.generateBoons(3); } 
            else if (this.expectedReward === 'HAMMER') { this.hero.attack += 10; this.doors = RoomGenerator.spawnRewardDoors(this.mapWidth, this.mapHeight, this.obstacles, this.currentLevel); }
            else { this.doors = RoomGenerator.spawnRewardDoors(this.mapWidth, this.mapHeight, this.obstacles, this.currentLevel); }
        }
    }

    private draw() {
        this.ctx.clearRect(0, 0, this.screenW, this.screenH); this.ctx.save(); let cameraX = this.screenW / 2 - this.hero.x; let cameraY = this.screenH / 2 - this.hero.y; if (this.shakeTimer > 0) { cameraX += (Math.random() - 0.5) * this.shakeMagnitude * 2; cameraY += (Math.random() - 0.5) * this.shakeMagnitude * 2; } this.ctx.translate(cameraX, cameraY);
        EnvironmentRenderer.drawMap(this.rc, this.currentScene, this.mapWidth, this.mapHeight, this.storyPhase);
        
        const renderList: any[] = []; renderList.push({ type: 'HERO', y: this.hero.y, obj: this.hero });
        for (const e of this.enemies) renderList.push({ type: 'ENEMY', y: e.y, obj: e });
        for (const o of this.obstacles) renderList.push({ type: 'OBSTACLE', y: o.y + o.radius, obj: o });

        if (this.currentScene === 'HOME') {
            renderList.push({ type: 'NPC_LI', y: this.npcLiJing.y, obj: this.npcLiJing }); if (this.taiyiDefeatCount > 0) renderList.push({ type: 'NPC_TAIYI', y: this.npcTaiyi.y, obj: this.npcTaiyi }); renderList.push({ type: 'RACK', y: this.weaponRack.y, obj: this.weaponRack }); renderList.push({ type: 'HOME_POOL', y: this.homeLotusPool.y, obj: this.homeLotusPool }); EnvironmentRenderer.drawHomePortal(this.rc, this.ctx, this.homePortal, this.frame); 
        } else if (this.currentScene === 'OASIS') { renderList.push({ type: 'POOL', y: this.lotusPool.y, obj: this.lotusPool }); } else if (this.currentScene === 'NPC_ROOM') { renderList.push({ type: 'REWARD_NPC', y: this.rewardNpcEntity.y, obj: this.rewardNpcEntity }); }

        renderList.sort((a, b) => a.y - b.y);

        for (const item of renderList) {
            if (item.type === 'HERO') HeroRenderer.drawHero(this.rc, this.ctx, item.obj, this.frame); else if (item.type === 'ENEMY') EntityRenderer.drawEnemy(this.rc, this.ctx, item.obj); else if (item.type === 'OBSTACLE') EnvironmentRenderer.drawObstacle(this.rc, item.obj); else if (item.type === 'NPC_LI') EntityRenderer.drawLiJing(this.rc, this.ctx, this.hero, item.obj, this.dialogue.active); else if (item.type === 'NPC_TAIYI') EntityRenderer.drawTaiyi(this.rc, this.ctx, this.hero, item.obj, this.dialogue.active); else if (item.type === 'RACK') EnvironmentRenderer.drawWeaponRack(this.rc, this.ctx, item.obj, this.hero, this.unlockedWeapons); else if (item.type === 'POOL') EnvironmentRenderer.drawOasis(this.rc, this.ctx, this.hero, item.obj); else if (item.type === 'HOME_POOL') EnvironmentRenderer.drawHomeLotusPool(this.rc, this.ctx, item.obj, this.hero, GameConfig.REVIVE_COSTS);
            else if (item.type === 'REWARD_NPC') { if (this.currentNpcType === 'AOGUANG') EntityRenderer.drawAoGuang(this.rc, this.ctx, this.hero, item.obj, item.obj.interacted, this.dialogue.active, this.frame); else if (this.currentNpcType === 'PIG') EntityRenderer.drawFlyingPig(this.rc, this.ctx, this.hero, item.obj, item.obj.interacted, this.dialogue.active, this.frame); else if (this.currentNpcType === 'BEASTS') EntityRenderer.drawBarrierBeasts(this.rc, this.ctx, this.hero, item.obj, item.obj.interacted, this.dialogue.active, this.frame); else if (this.currentNpcType === 'SHENGONGBAO') EntityRenderer.drawShenGongBao(this.rc, this.ctx, this.hero, item.obj, item.obj.interacted, this.dialogue.active, this.frame); }
        }

        if (this.hero.state === 'REVIVING') { this.ctx.save(); this.ctx.translate(this.hero.x, this.hero.y); const progress = 1 - (this.hero.reviveTimer / 90); this.ctx.rotate(progress * Math.PI * 4); this.rc.circle(0, 0, progress * 150, { stroke: '#f472b6', strokeWidth: 4, roughness: 2 }); this.rc.ellipse(0, 0, progress * 120, progress * 40, { fill: 'rgba(236, 72, 153, 0.6)', fillStyle: 'solid', stroke: 'none' }); this.rc.ellipse(0, 0, progress * 40, progress * 120, { fill: 'rgba(236, 72, 153, 0.6)', fillStyle: 'solid', stroke: 'none' }); this.ctx.restore(); }

        if (this.currentScene !== 'HOME') { EnvironmentRenderer.drawDoors(this.rc, this.ctx, this.doors, this.frame); EntityRenderer.drawEnemyProjectiles(this.rc, this.ctx, this.enemyProjectiles, this.frame); EntityRenderer.drawLightningArcs(this.rc, this.lightnings); }
        HeroRenderer.drawProjectiles(this.rc, this.ctx, this.projectiles, this.frame); 
        EntityRenderer.drawDamageTexts(this.ctx, this.damageTexts);
        this.ctx.restore();
        
        GameHUD.draw(this.rc, this.ctx, this.hero, this.currentScene); DialogueUI.draw(this.rc, this.ctx, this.frame, this.dialogue);
        if (this.hero.state === 'BOON_SELECTION') BoonUI.draw(this.rc, this.ctx, this.currentBoons);
        if (this.hero.state === 'UPGRADING') UpgradeUI.draw(this.rc, this.ctx, this.hero);
        if (this.hero.state === 'SHOPPING') ShopUI.draw(this.rc, this.ctx, this.hero, this.shopStock);
    }

    private gameLoop = (timestamp: number) => {
        if (!this.lastTime) this.lastTime = timestamp; const dt = timestamp - this.lastTime; this.lastTime = timestamp;
        if (this.hitStopTimer > 0) { this.hitStopTimer -= dt; } else {
            if (this.shakeTimer > 0) this.shakeTimer -= dt; this.accumulator += dt;
            while (this.accumulator >= this.TIME_STEP) { this.update(); this.accumulator -= this.TIME_STEP; }
        }
        this.draw(); requestAnimationFrame(this.gameLoop);
    }
}