import type { Enemy, EnemyProjectile } from '../entities/Types';

export class EntityRenderer {
    static drawEnemy(rc: any, ctx: CanvasRenderingContext2D, enemy: Enemy) {
        if (enemy.isBoss && enemy.name === '太乙真人') {
            ctx.save();
            ctx.translate(enemy.x, enemy.y);
            rc.ellipse(0, -35, 80, 90, { fill: '#10b981', fillStyle: 'hachure', roughness: 2, hachureGap: 3 }); 
            rc.circle(0, -85, 40, { fill: '#fed7aa', fillStyle: 'solid', roughness: 1.5 }); 
            const gourdX = Math.cos(Date.now() / 300) * 60;
            const gourdY = Math.sin(Date.now() / 300) * 20 - 40;
            rc.ellipse(gourdX, gourdY, 20, 30, { fill: '#fbbf24', fillStyle: 'solid', stroke: '#b45309', strokeWidth: 2 });
            rc.circle(gourdX, gourdY - 20, 12, { fill: '#fbbf24', fillStyle: 'solid', stroke: '#b45309' });

            if (enemy.state === 'ATTACKING') {
                if (enemy.attackRound === 1) {
                    const radius = (60 - enemy.attackTimer) * 5; 
                    rc.circle(0, 0, radius, { stroke: '#3b82f6', strokeWidth: 4, roughness: 3 });
                    rc.circle(0, 0, radius - 20, { stroke: '#60a5fa', strokeWidth: 2, roughness: 2 });
                } else if (enemy.attackRound === 2) {
                    ctx.fillStyle = '#b91c1c';
                    ctx.font = 'bold 48px "Comic Sans MS", cursive, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('九 龙 神 火 罩 ！', 0, -150);
                    const fireRadius = (120 - enemy.attackTimer) * 15;
                    rc.circle(0, 0, fireRadius, { fill: 'rgba(239, 68, 68, 0.4)', fillStyle: 'solid', stroke: '#dc2626', strokeWidth: 10, roughness: 5, bowing: 3 });
                }
            }
            const hpBarWidth = 100;
            const currentHpWidth = (enemy.hp / enemy.maxHp) * hpBarWidth;
            rc.rectangle(-hpBarWidth/2, -130, hpBarWidth, 8, { fill: '#374151', fillStyle: 'solid', roughness: 0.5 });
            rc.rectangle(-hpBarWidth/2, -130, currentHpWidth, 8, { fill: '#10b981', fillStyle: 'solid', roughness: 0.5, stroke: 'none' });
            
            // ====== 【新增】Boss 异常状态视觉特效 ======
            if (enemy.burnTimer && enemy.burnTimer > 0) {
                ctx.fillStyle = '#f97316';
                for (let i = 0; i < 6; i++) { // Boss体积大，火球多画几个
                    const fx = (Math.random() - 0.5) * enemy.radius * 2;
                    const fy = -50 - Math.random() * enemy.radius * 1.5;
                    ctx.beginPath();
                    ctx.arc(fx, fy, 8, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            if (enemy.frostTimer && enemy.frostTimer > 0) {
                rc.rectangle(-enemy.radius/1.5, -90, enemy.radius * 1.3, 100, {
                    fill: 'rgba(56, 189, 248, 0.3)', fillStyle: 'solid', stroke: '#0ea5e9', strokeWidth: 3, roughness: 1.5
                });
            }
            // ==========================================

            ctx.restore();
            return;
        }

        const isHit = enemy.hitFlashTimer > 0;
        const isAttacking = enemy.state === 'ATTACKING';
        const roughLevel = isHit ? 4 : (isAttacking ? 3 : 1.5);
        
        const isRanged = enemy.enemyType === 'RANGED';
        const strokeColor = isHit ? '#ef4444' : (isAttacking ? (isRanged ? '#9333ea' : '#b91c1c') : '#4b5563');
        const bodyFill = isHit ? '#fca5a5' : (isRanged ? '#d8b4fe' : '#9ca3af');

        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        
        if (isAttacking && enemy.attackTimer < 20 && enemy.attackTimer > 5) {
            const angle = Math.atan2(enemy.dirY, enemy.dirX);
            ctx.rotate(angle);
            if (isRanged) rc.circle(20, 0, 25, { fill: '#c084fc', fillStyle: 'solid', stroke: 'none' });
            else rc.polygon([[0, -10], [60, 0], [0, 10]], { fill: '#ef4444', fillStyle: 'solid', roughness: 3, stroke: 'none' });
            ctx.rotate(-angle); 
        }
        
        rc.rectangle(-10, -20, 20, 50, { fill: bodyFill, fillStyle: 'hachure', roughness: roughLevel, stroke: strokeColor });
        rc.line(-30, -5, 30, -5, { stroke: strokeColor, strokeWidth: 8, roughness: roughLevel });
        
        const headColor = isAttacking ? (isRanged ? '#a855f7' : '#f87171') : '#d1d5db';
        if (isRanged) rc.polygon([[-20, -60], [20, -60], [20, -20], [-20, -20]], { fill: headColor, fillStyle: 'solid', roughness: roughLevel, stroke: strokeColor, strokeWidth: 2 });
        else rc.circle(0, -35, 30, { fill: headColor, fillStyle: 'solid', roughness: roughLevel, stroke: strokeColor, strokeWidth: 2 });

        // ====== 【新增】普通怪物异常状态视觉特效 ======
        if (enemy.burnTimer && enemy.burnTimer > 0) {
            ctx.fillStyle = '#f97316';
            for (let i = 0; i < 3; i++) {
                const fx = (Math.random() - 0.5) * enemy.radius * 1.2;
                const fy = -20 - Math.random() * enemy.radius;
                ctx.beginPath();
                ctx.arc(fx, fy, 6, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        if (enemy.frostTimer && enemy.frostTimer > 0) {
            rc.rectangle(-enemy.radius/2, -40, enemy.radius, 50, {
                fill: 'rgba(56, 189, 248, 0.3)', fillStyle: 'solid', stroke: '#0ea5e9', strokeWidth: 2, roughness: 1
            });
        }
        // ==========================================

        ctx.restore();
    }

    static drawEnemyProjectiles(rc: any, ctx: CanvasRenderingContext2D, projectiles: EnemyProjectile[], frame: number) {
        for (const p of projectiles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(frame * 0.3); 
            rc.circle(0, 0, p.radius * 2, { fill: '#c084fc', fillStyle: 'hachure', hachureGap: 3, stroke: '#9333ea', strokeWidth: 3, roughness: 2 });
            rc.circle(0, 0, p.radius, { fill: '#faf5ff', fillStyle: 'solid', stroke: 'none' });
            ctx.restore();
        }
    }

    static drawLightningArcs(rc: any, lightnings: any[]) {
        for (const l of lightnings) {
            rc.line(l.x1, l.y1, l.x2, l.y2, {
                stroke: '#eab308', strokeWidth: 4, roughness: 3, bowing: 2
            });
        }
    }

    static drawLiJing(rc: any, ctx: CanvasRenderingContext2D, hero: any, npcLiJing: any, dialogueActive: boolean) {
        const nx = npcLiJing.x; const ny = npcLiJing.y;
        rc.rectangle(nx - 20, ny - 30, 40, 70, { fill: '#3b82f6', fillStyle: 'hachure', roughness: 1 });
        rc.circle(nx, ny - 50, 30, { fill: '#fed7aa', fillStyle: 'solid', roughness: 1 });
        rc.polygon([[nx - 10, ny - 35], [nx + 10, ny - 35], [nx, ny - 15]], { fill: '#1f2937', fillStyle: 'solid' });
        rc.line(nx - 30, ny, nx - 30, ny - 60, { stroke: '#000', strokeWidth: 3, roughness: 1 });

        ctx.fillStyle = '#1e3a8a';
        ctx.font = 'bold 18px "Comic Sans MS", cursive, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('李靖', nx, ny + 60);

        const distLi = Math.sqrt(Math.pow(hero.x - nx, 2) + Math.pow(hero.y - ny, 2));
        if (distLi < 100 && !dialogueActive && hero.state !== 'UPGRADING') {
            ctx.fillStyle = '#1f2937';
            ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif';
            ctx.fillText('[按 F 交互]', nx, ny - 70); 
        }
        ctx.textAlign = 'left';
    }

    static drawTaiyi(rc: any, ctx: CanvasRenderingContext2D, hero: any, npcTaiyi: any, dialogueActive: boolean) {
        const tx = npcTaiyi.x; const ty = npcTaiyi.y;
        rc.ellipse(tx, ty - 25, 60, 70, { fill: '#10b981', fillStyle: 'hachure', roughness: 1.5 }); 
        rc.circle(tx, ty - 65, 30, { fill: '#fed7aa', fillStyle: 'solid', roughness: 1 }); 
        rc.ellipse(tx - 35, ty - 15, 15, 25, { fill: '#fbbf24', fillStyle: 'solid', stroke: 'none' }); 
        rc.circle(tx - 35, ty - 35, 10, { fill: '#fbbf24', fillStyle: 'solid', stroke: 'none' }); 

        ctx.fillStyle = '#064e3b';
        ctx.font = 'bold 18px "Comic Sans MS", cursive, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('太乙真人', tx, ty + 60);

        const distTaiyi = Math.sqrt(Math.pow(hero.x - tx, 2) + Math.pow(hero.y - ty, 2));
        if (distTaiyi < 100 && !dialogueActive && hero.state !== 'UPGRADING') {
            ctx.fillStyle = '#1f2937';
            ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif';
            ctx.fillText('[按 F 修炼]', tx, ty - 90); 
        }
        ctx.textAlign = 'left';
    }
}