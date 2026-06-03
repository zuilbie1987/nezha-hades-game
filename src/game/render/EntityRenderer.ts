// src/game/render/EntityRenderer.ts
// 负责绘制敌人、NPC等实体
import type { Enemy } from '../entities/Types';

export class EntityRenderer {
    static drawEnemies(rc: any, ctx: CanvasRenderingContext2D, enemies: Enemy[]) {
        for (let enemy of enemies) {
            // 【新增】Boss 太乙真人的专属渲染
            if (enemy.isBoss && enemy.name === '太乙真人') {
                ctx.save();
                ctx.translate(enemy.x, enemy.y);
                
                // 太乙真人的身体 (比 NPC 版本更大、更具压迫感)
                rc.ellipse(0, -35, 80, 90, { fill: '#10b981', fillStyle: 'hachure', roughness: 2, hachureGap: 3 }); 
                rc.circle(0, -85, 40, { fill: '#fed7aa', fillStyle: 'solid', roughness: 1.5 }); 
                
                // 飘浮的酒葫芦围绕
                const gourdX = Math.cos(Date.now() / 300) * 60;
                const gourdY = Math.sin(Date.now() / 300) * 20 - 40;
                rc.ellipse(gourdX, gourdY, 20, 30, { fill: '#fbbf24', fillStyle: 'solid', stroke: '#b45309', strokeWidth: 2 });
                rc.circle(gourdX, gourdY - 20, 12, { fill: '#fbbf24', fillStyle: 'solid', stroke: '#b45309' });

                // 攻击特效绘制
                if (enemy.state === 'ATTACKING') {
                    if (enemy.attackRound === 1) {
                        // 第一轮攻击：太乙仙术·醉酒波 (蓝色大范围警告)
                        const radius = (60 - enemy.attackTimer) * 5; // 动态扩大的圈
                        rc.circle(0, 0, radius, { stroke: '#3b82f6', strokeWidth: 4, roughness: 3 });
                        rc.circle(0, 0, radius - 20, { stroke: '#60a5fa', strokeWidth: 2, roughness: 2 });
                    } else if (enemy.attackRound === 2) {
                        // 第二轮攻击 (必杀)：九龙神火罩！
                        ctx.fillStyle = '#b91c1c';
                        ctx.font = 'bold 48px "Comic Sans MS", cursive, sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText('九 龙 神 火 罩 ！', 0, -150);
                        
                        // 毁天灭地的红色烈焰覆盖
                        const fireRadius = (120 - enemy.attackTimer) * 15;
                        rc.circle(0, 0, fireRadius, { fill: 'rgba(239, 68, 68, 0.4)', fillStyle: 'solid', stroke: '#dc2626', strokeWidth: 10, roughness: 5, bowing: 3 });
                    }
                }
                
                // Boss 血条 (悬浮在头顶)
                const hpBarWidth = 100;
                const currentHpWidth = (enemy.hp / enemy.maxHp) * hpBarWidth;
                rc.rectangle(-hpBarWidth/2, -130, hpBarWidth, 8, { fill: '#374151', fillStyle: 'solid', roughness: 0.5 });
                rc.rectangle(-hpBarWidth/2, -130, currentHpWidth, 8, { fill: '#10b981', fillStyle: 'solid', roughness: 0.5, stroke: 'none' });
                
                ctx.restore();
                continue; // Boss 画完直接跳过普通怪绘制
            }

            // --- 普通怪物绘制 (保持原样) ---
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
        // ... (保持原样，与上一版代码一致) ...
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

        const tx = npcTaiyi.x; const ty = npcTaiyi.y;
        rc.ellipse(tx, ty - 25, 60, 70, { fill: '#10b981', fillStyle: 'hachure', roughness: 1.5 }); 
        rc.circle(tx, ty - 65, 30, { fill: '#fed7aa', fillStyle: 'solid', roughness: 1 }); 
        rc.ellipse(tx - 35, ty - 15, 15, 25, { fill: '#fbbf24', fillStyle: 'solid', stroke: 'none' }); 
        rc.circle(tx - 35, ty - 35, 10, { fill: '#fbbf24', fillStyle: 'solid', stroke: 'none' }); 

        const distTaiyi = Math.sqrt(Math.pow(hero.x - tx, 2) + Math.pow(hero.y - ty, 2));
        if (distTaiyi < 100 && !dialogueActive && hero.state !== 'UPGRADING') {
            ctx.fillStyle = '#1f2937';
            ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif';
            ctx.fillText('[按 F 交互]', tx - 35, ty - 80);
        }
    }
}