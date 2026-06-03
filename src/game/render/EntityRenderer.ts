// src/game/render/EntityRenderer.ts
// 负责绘制敌人、NPC等实体
import type { Enemy } from '../entities/Types';

export class EntityRenderer {
    static drawEnemies(rc: any, ctx: CanvasRenderingContext2D, enemies: Enemy[]) {
        for (let enemy of enemies) {
            const isHit = enemy.hitFlashTimer > 0;
            const isAttacking = enemy.state === 'ATTACKING';
            const roughLevel = isHit ? 4 : (isAttacking ? 3 : 1.5);
            const strokeColor = isHit ? '#ef4444' : (isAttacking ? '#b91c1c' : '#4b5563');
            const bodyFill = isHit ? '#fca5a5' : '#9ca3af';

            ctx.save();
            ctx.translate(enemy.x, enemy.y);
            if (isAttacking && enemy.attackTimer < 20 && enemy.attackTimer > 5) {
                const angle = Math.atan2(enemy.dirY, enemy.dirX);
                ctx.rotate(angle);
                rc.polygon([[0, -10], [60, 0], [0, 10]], { fill: '#ef4444', fillStyle: 'solid', roughness: 3, stroke: 'none' });
                ctx.rotate(-angle); 
            }
            rc.rectangle(-10, -20, 20, 50, { fill: bodyFill, fillStyle: 'hachure', roughness: roughLevel, stroke: strokeColor });
            rc.line(-30, -5, 30, -5, { stroke: strokeColor, strokeWidth: 8, roughness: roughLevel });
            rc.circle(0, -35, 30, { fill: isAttacking ? '#f87171' : '#d1d5db', fillStyle: 'solid', roughness: roughLevel, stroke: strokeColor, strokeWidth: 2 });
            ctx.restore();
        }
    }

    static drawNPCs(rc: any, ctx: CanvasRenderingContext2D, hero: any, npcLiJing: any, npcTaiyi: any, dialogueActive: boolean) {
        // 1. 李靖
        const nx = npcLiJing.x; const ny = npcLiJing.y;
        rc.rectangle(nx - 20, ny - 30, 40, 70, { fill: '#3b82f6', fillStyle: 'hachure', roughness: 1 });
        rc.circle(nx, ny - 50, 30, { fill: '#fed7aa', fillStyle: 'solid', roughness: 1 });
        rc.polygon([[nx - 10, ny - 35], [nx + 10, ny - 35], [nx, ny - 15]], { fill: '#1f2937', fillStyle: 'solid' });
        rc.line(nx - 30, ny, nx - 30, ny - 60, { stroke: '#000', strokeWidth: 3, roughness: 1 });

        const distLi = Math.sqrt(Math.pow(hero.x - nx, 2) + Math.pow(hero.y - ny, 2));
        if (distLi < 100 && !dialogueActive && hero.state !== 'UPGRADING') {
            ctx.fillStyle = '#1f2937';
            ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif';
            ctx.fillText('[按 F 交互]', nx - 35, ny - 80);
        }

        // 2. 太乙真人
        const tx = npcTaiyi.x; const ty = npcTaiyi.y;
        rc.ellipse(tx, ty - 25, 60, 70, { fill: '#10b981', fillStyle: 'hachure', roughness: 1.5 }); 
        rc.circle(tx, ty - 65, 30, { fill: '#fed7aa', fillStyle: 'solid', roughness: 1 }); 
        rc.ellipse(tx - 35, ty - 15, 15, 25, { fill: '#fbbf24', fillStyle: 'solid', stroke: 'none' }); 
        rc.circle(tx - 35, ty - 35, 10, { fill: '#fbbf24', fillStyle: 'solid', stroke: 'none' }); 

        const distTaiyi = Math.sqrt(Math.pow(hero.x - tx, 2) + Math.pow(hero.y - ty, 2));
        if (distTaiyi < 100 && !dialogueActive && hero.state !== 'UPGRADING') {
            ctx.fillStyle = '#1f2937';
            ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif';
            ctx.fillText('[按 F 修炼]', tx - 35, ty - 80);
        }
    }
}