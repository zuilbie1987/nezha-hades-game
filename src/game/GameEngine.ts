import rough from 'roughjs';
import { Input } from '../engine/Input';
import type { Enemy, DialogueLine, Boon } from './entities/Types';
import { DialogueUI } from './ui/DialogueUI';
import { GameHUD } from './ui/GameHUD';
import { BoonSystem } from './systems/BoonSystem';
import { BoonUI } from './ui/BoonUI';

export class GameEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private rc: any;
    private frame: number = 0;

    private currentScene: 'HOME' | 'BATTLE' = 'HOME';

    private hero = { 
        x: 400, y: 400, speed: 5, hp: 100, maxHp: 100, radius: 25,
        state: 'NORMAL', dirX: 1, dirY: 0,
        dashTimer: 0, dashDuration: 12, dashSpeed: 20, dashCooldown: 0,
        attackTimer: 0, attackDuration: 15, attackCooldown: 0, attackThrustSpeed: 3,
        hasDealtDamage: false, hitFlashTimer: 0,
        boonColor: '#fbbf24'
    };

    private npcLiJing = { x: 400, y: 200, radius: 40 };
    private portal = { x: 800, y: 200, radius: 40, active: false };

    private dialogue = { active: false, index: 0, lines: [] as DialogueLine[], cooldown: 0 };
    private enemies: Enemy[] = [];
    private mapWidth = 1200;
    private mapHeight = 800;
    // 【新增】赐福系统状态
    private currentBoons: Boon[] = [];
    private roomCleared: boolean = false; // 标记房间是否已经清空过

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.ctx.scale(dpr, dpr);
        this.rc = rough.canvas(this.canvas);
        requestAnimationFrame(this.gameLoop);
    }

    private applyBoon(boon: Boon) {
        boon.apply(this.hero); // 让赐福直接修改 hero 的属性
        this.hero.state = 'NORMAL'; // 恢复正常状态
        this.currentBoons = []; // 清空卡片
    }

    private startDialogue(lines: DialogueLine[]) {
        this.dialogue.active = true;
        this.dialogue.index = 0;
        this.dialogue.lines = lines;
        this.dialogue.cooldown = 15; 
        this.hero.state = 'NORMAL'; 
    }

    private transitionToBattle() {
        this.currentScene = 'BATTLE';
        this.roomCleared = false; // 重置清空标记
        this.hero.x = 400; 
        this.hero.y = 600;
        this.enemies = [
            { id: 1, x: 600, y: 400, hp: 50, maxHp: 50, radius: 30, hitFlashTimer: 0, speed: 2, state: 'CHASING', attackTimer: 0, attackCooldown: 0, dirX: 0, dirY: 0 },
            { id: 2, x: 800, y: 200, hp: 50, maxHp: 50, radius: 30, hitFlashTimer: 0, speed: 2.5, state: 'CHASING', attackTimer: 0, attackCooldown: 0, dirX: 0, dirY: 0 }
        ];
    }

    private update() {
        this.frame++;
        if (this.hero.state === 'DEAD') return;
        
        // ====== 赐福界面状态拦截 ======
        if (this.hero.state === 'BOON_SELECTION') {
            // 在此状态下，游戏时间完全暂停，专门监听 1、2、3 键
            if (Input.keys['1'] && this.currentBoons[0]) this.applyBoon(this.currentBoons[0]);
            if (Input.keys['2'] && this.currentBoons[1]) this.applyBoon(this.currentBoons[1]);
            if (Input.keys['3'] && this.currentBoons[2]) this.applyBoon(this.currentBoons[2]);
            return; // 拦截所有后续更新 (敌人不准动，哪吒不准跑)
        }

        if (this.dialogue.cooldown > 0) this.dialogue.cooldown--;
        if (this.dialogue.active) {
            if (Input.keys.f && this.dialogue.cooldown <= 0) {
                this.dialogue.index++;
                this.dialogue.cooldown = 15;
                if (this.dialogue.index >= this.dialogue.lines.length) {
                    this.dialogue.active = false;
                    if (this.currentScene === 'HOME') this.portal.active = true;
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
            if (this.portal.active) {
                const distPortal = Math.sqrt(Math.pow(this.hero.x - this.portal.x, 2) + Math.pow(this.hero.y - this.portal.y, 2));
                if (distPortal < 50) this.transitionToBattle();
            }
        } else if (this.currentScene === 'BATTLE') {
            this.updateEnemies();
        }

        this.updateHero();
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

        if (this.currentScene === 'HOME' && this.hero.state !== 'DASHING') {
            const distNPC = Math.sqrt(Math.pow(this.hero.x - this.npcLiJing.x, 2) + Math.pow(this.hero.y - this.npcLiJing.y, 2));
            const minNpcDist = this.hero.radius + this.npcLiJing.radius;
            if (distNPC < minNpcDist && distNPC > 0) {
                const overlap = minNpcDist - distNPC;
                this.hero.x += ((this.hero.x - this.npcLiJing.x) / distNPC) * overlap;
                this.hero.y += ((this.hero.y - this.npcLiJing.y) / distNPC) * overlap;
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

            const dist = Math.sqrt(Math.pow(this.hero.x - enemy.x, 2) + Math.pow(this.hero.y - enemy.y, 2));
            if (dist > 0) { enemy.dirX = (this.hero.x - enemy.x) / dist; enemy.dirY = (this.hero.y - enemy.y) / dist; }

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
        
        // 房间清空检测，触发神明赐福
        if (this.enemies.length === 0 && !this.roomCleared && this.currentScene === 'BATTLE') {
            this.roomCleared = true;
            this.hero.state = 'BOON_SELECTION';
            // 抽取 3 个赐福
            this.currentBoons = BoonSystem.generateBoons(3); 
        }
    }

    private draw() {
        this.ctx.clearRect(0, 0, 800, 600); 
        this.ctx.save();
        this.ctx.translate(400 - this.hero.x, 300 - this.hero.y);

        this.drawMap();
        
        if (this.currentScene === 'HOME') {
            this.drawNPC();
            this.drawPortal();
        } else {
            this.drawEnemies(); 
        }

        this.drawHero(this.hero.x, this.hero.y);
        
        this.ctx.restore();
        
        GameHUD.draw(this.rc, this.ctx, this.hero, this.currentScene);
        DialogueUI.draw(this.rc, this.ctx, this.frame, this.dialogue);
        
        // 【改动 7：新增】绘制赐福三选一卡片
        if (this.hero.state === 'BOON_SELECTION') {
            BoonUI.draw(this.rc, this.ctx, this.currentBoons);
        }
    }

    private drawMap() {
        const bgColor = this.currentScene === 'HOME' ? '#f3f4f6' : '#e5e7eb';
        const strokeColor = this.currentScene === 'HOME' ? '#d1d5db' : '#9ca3af';

        this.rc.rectangle(0, 0, this.mapWidth, this.mapHeight, {
            fill: bgColor, fillStyle: 'hachure', hachureAngle: 30, hachureGap: 15,
            roughness: 2, strokeWidth: 3, stroke: strokeColor
        });

        if (this.currentScene === 'HOME') {
            this.rc.rectangle(300, 100, 200, 50, { fill: '#94a3b8', roughness: 1.5 });
        } else {
            this.rc.circle(200, 200, 60, { fill: '#d1d5db', roughness: 2 });
        }
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

    private drawPortal() {
        if (!this.portal.active) return;
        const px = this.portal.x; const py = this.portal.y;
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
            // 【改动 6】冲刺速度线颜色改为 boonColor
            this.rc.line(-150, 0, -50, 0, { stroke: this.hero.boonColor, strokeWidth: 5, roughness: 3 });
            // 【改动 6】冲刺主体边框改为 boonColor
            this.rc.polygon([[-40, -30], [50, 0], [-40, 30]], { fill: colors.red, fillStyle: 'hachure', hachureGap: 3, roughness: 3, stroke: this.hero.boonColor });
            this.ctx.restore();
        } else if (this.hero.state === 'ATTACKING') {
            this.ctx.save();
            this.ctx.translate(cx, cy);
            this.ctx.rotate(Math.atan2(this.hero.dirY, this.hero.dirX));
            // 攻击前方的破空红线保留
            this.rc.line(30, -30, 160, -10, { stroke: colors.red, roughness: 3, strokeWidth: 2, bowing: 2 });
            // 【改动 6】攻击前方的另外一条破空线改为 boonColor
            this.rc.line(40, 30, 150, 10, { stroke: this.hero.boonColor, roughness: 3, strokeWidth: 2, bowing: 2 });
            this.rc.line(-50, 0, 100, 0, { stroke: '#6b7280', strokeWidth: 6, roughness: 1 });
            // 【改动 6】枪尖填充颜色改为 boonColor
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