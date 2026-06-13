import type { Projectile } from '../entities/Types';

export class HeroRenderer {
    static drawHero(rc: any, ctx: CanvasRenderingContext2D, hero: any, frame: number) {
        if (hero.state === 'DEAD') {
            const deathOpts = { roughness: 4, stroke: '#6b7280', strokeWidth: 2 };
            rc.ellipse(hero.x, hero.y + 20, 80, 40, { fill: '#9ca3af', fillStyle: 'hachure', hachureAngle: 0, ...deathOpts });
            rc.line(hero.x - 50, hero.y + 30, hero.x + 50, hero.y - 10, deathOpts);
            rc.line(hero.x - 30, hero.y - 20, hero.x + 60, hero.y + 40, deathOpts);
            return;
        }

        const isHit = hero.hitFlashTimer > 0;
        const colors = { red: isHit ? '#fef2f2' : '#dc2626', gold: isHit ? '#fef3c7' : '#fbbf24', skin: isHit ? '#ffedd5' : '#fed7aa', hair: isHit ? '#6b7280' : '#1f2937' };

        // ====== 【修改】分离普攻颜色和冲刺颜色 ======
        const attackColor = hero.boons.ATTACK?.color || '#fbbf24';
        const dashColor = hero.boons.DASH?.color || '#3b82f6';

        if (hero.state === 'NORMAL') {
            const breath = Math.sin(frame * 0.1) * 3;
            const rOpts = { roughness: isHit ? 3 : 1.5 }; 
            
            if (hero.weapon === 'SPEAR') {
                const spearY = hero.y - 30 + breath;
                rc.line(hero.x - 80, spearY + 20, hero.x + 80, spearY - 25, { stroke: '#6b7280', strokeWidth: 5, ...rOpts });
            } else if (hero.weapon === 'RING' && hero.attackCooldown <= 10) { 
                rc.circle(hero.x + 40, hero.y, 25, { stroke: colors.gold, strokeWidth: 4, ...rOpts });
            } else if (hero.weapon === 'SASH') {
                const sashWave = Math.sin(frame * 0.05) * 10;
                rc.curve([[hero.x - 60, hero.y + 20 - sashWave], [hero.x, hero.y + 40], [hero.x + 60, hero.y + 20 + sashWave]], { stroke: colors.red, strokeWidth: 6, roughness: 2 });
            }

            rc.circle(hero.x - 30, hero.y + 80 + breath, 30, { stroke: colors.gold, strokeWidth: 3, ...rOpts });
            rc.circle(hero.x + 30, hero.y + 80 + breath, 30, { stroke: colors.gold, strokeWidth: 3, ...rOpts });
            if (hero.weapon === 'WHEELS') {
                rc.curve([[hero.x - 40, hero.y + 90], [hero.x - 30, hero.y + 60], [hero.x - 10, hero.y + 80]], { stroke: '#ef4444', strokeWidth: 3, roughness: 2 });
                rc.curve([[hero.x + 20, hero.y + 90], [hero.x + 30, hero.y + 60], [hero.x + 50, hero.y + 80]], { stroke: '#ef4444', strokeWidth: 3, roughness: 2 });
            }

            rc.polygon([[hero.x - 20, hero.y], [hero.x + 20, hero.y], [hero.x + 25, hero.y + 50], [hero.x - 25, hero.y + 50]], { fill: colors.red, fillStyle: 'hachure' });
            const headY = hero.y - 40 + breath;
            rc.ellipse(hero.x, headY, 70, 60, { fill: colors.skin, fillStyle: 'solid', ...rOpts });
            rc.circle(hero.x - 30, headY - 35, 20, { fill: colors.hair, fillStyle: 'solid' });
            rc.circle(hero.x + 30, headY - 35, 20, { fill: colors.hair, fillStyle: 'solid' });
            rc.ellipse(hero.x - 15, headY + 5, 20, 12, { fill: '#9ca3af', fillStyle: 'solid', stroke: 'none' });
            rc.ellipse(hero.x + 15, headY + 5, 20, 12, { fill: '#9ca3af', fillStyle: 'solid', stroke: 'none' });
            const eyeColor = isHit ? '#fff' : '#000';
            rc.circle(hero.x - 15, headY + 5, 4, { fill: eyeColor, fillStyle: 'solid' });
            rc.circle(hero.x + 15, headY + 5, 4, { fill: eyeColor, fillStyle: 'solid' });
            rc.curve([[hero.x - 80, hero.y + 40], [hero.x - 50, hero.y + 80], [hero.x - 15, hero.y + 45]], { stroke: colors.red, strokeWidth: 8, ...rOpts });
            rc.curve([[hero.x + 80, hero.y + 40], [hero.x + 50, hero.y + 80], [hero.x + 15, hero.y + 45]], { stroke: colors.red, strokeWidth: 8, ...rOpts });
        } 
        else if (hero.state === 'DASHING') {
            ctx.save();
            ctx.translate(hero.x, hero.y);
            ctx.rotate(Math.atan2(hero.dirY, hero.dirX));
            // 【修改】冲刺使用 dashColor
            rc.line(-150, 0, -50, 0, { stroke: dashColor, strokeWidth: 5, roughness: 3 });
            rc.polygon([[-40, -30], [50, 0], [-40, 30]], { fill: colors.red, fillStyle: 'hachure', hachureGap: 3, roughness: 3, stroke: dashColor });
            ctx.restore();
        } 
        else if (hero.state === 'ATTACKING') {
            ctx.save();
            ctx.translate(hero.x, hero.y);
            ctx.rotate(Math.atan2(hero.dirY, hero.dirX));
            
            // 【修改】攻击使用 attackColor
            if (hero.weapon === 'SPEAR') {
                rc.line(30, -30, 160, -10, { stroke: colors.red, roughness: 3, strokeWidth: 2, bowing: 2 });
                rc.line(40, 30, 150, 10, { stroke: attackColor, roughness: 3, strokeWidth: 2, bowing: 2 });
                rc.line(-50, 0, 100, 0, { stroke: '#6b7280', strokeWidth: 6, roughness: 1 });
                rc.polygon([[100, -15], [160, 0], [100, 15]], { fill: attackColor, fillStyle: 'solid' });
            } else if (hero.weapon === 'RING') {
                rc.ellipse(10, 0, 60, 50, { fill: colors.skin, fillStyle: 'solid', roughness: 1.5 });
                rc.line(-20, 0, 40, 0, { stroke: colors.red, strokeWidth: 8, roughness: 2 });
            } else if (hero.weapon === 'SASH') {
                rc.ellipse(10, 0, 60, 50, { fill: colors.skin, fillStyle: 'solid', roughness: 1.5 });
                const sweep = 180 - (hero.attackTimer * 6); 
                rc.curve([[0, 0], [sweep, -80], [sweep + 40, 0], [sweep, 80], [0, 0]], { fill: 'rgba(220, 38, 38, 0.5)', fillStyle: 'solid', stroke: colors.red, strokeWidth: 4, roughness: 3 });
            } else if (hero.weapon === 'WHEELS') {
                rc.circle(0, 0, 80, { stroke: '#ef4444', strokeWidth: 6, roughness: 4 });
                rc.circle(0, 0, 60, { stroke: '#fbbf24', strokeWidth: 4, roughness: 3 });
                rc.polygon([[-40, -40], [60, 0], [-40, 40]], { fill: colors.red, fillStyle: 'hachure', stroke: 'none' });
            }
            
            if (hero.weapon !== 'WHEELS') rc.ellipse(-20, 0, 60, 40, { fill: colors.red, fillStyle: 'hachure', roughness: 2 });
            ctx.restore();
        }
    }

    static drawProjectiles(rc: any, ctx: CanvasRenderingContext2D, projectiles: Projectile[], frame: number) {
        for (const p of projectiles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(frame * 0.2); 
            // 【修补】飞盘颜色也使用传入的 color
            rc.circle(0, 0, 30, { stroke: p.color, strokeWidth: 5, roughness: 1.5 });
            rc.circle(0, 0, 20, { stroke: '#fef3c7', strokeWidth: 2, roughness: 1 });
            rc.curve([[0, 15], [-p.dirX * 30, 20], [-p.dirX * 50, 5]], { stroke: '#dc2626', strokeWidth: 3, roughness: 3 });
            ctx.restore();
        }
    }
}