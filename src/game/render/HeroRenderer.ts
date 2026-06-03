// src/game/render/HeroRenderer.ts
// 负责绘制主角，包括不同状态的表现

export class HeroRenderer {
    static draw(rc: any, ctx: CanvasRenderingContext2D, hero: any, frame: number) {
        if (hero.state === 'DEAD') {
            const deathOpts = { roughness: 4, stroke: '#6b7280', strokeWidth: 2 };
            rc.ellipse(hero.x, hero.y + 20, 80, 40, { fill: '#9ca3af', fillStyle: 'hachure', hachureAngle: 0, ...deathOpts });
            rc.line(hero.x - 50, hero.y + 30, hero.x + 50, hero.y - 10, deathOpts);
            rc.line(hero.x - 30, hero.y - 20, hero.x + 60, hero.y + 40, deathOpts);
            rc.line(hero.x - 70, hero.y + 50, hero.x + 40, hero.y + 60, { stroke: '#4b5563', strokeWidth: 4, roughness: 3 });
            return;
        }

        const isHit = hero.hitFlashTimer > 0;
        const colors = { red: isHit ? '#fef2f2' : '#dc2626', gold: isHit ? '#fef3c7' : '#fbbf24', skin: isHit ? '#ffedd5' : '#fed7aa', hair: isHit ? '#6b7280' : '#1f2937' };

        if (hero.state === 'NORMAL') {
            const breath = Math.sin(frame * 0.1) * 3;
            const rOpts = { roughness: isHit ? 3 : 1.5 }; 
            const spearY = hero.y - 30 + breath;
            rc.line(hero.x - 80, spearY + 20, hero.x + 80, spearY - 25, { stroke: '#6b7280', strokeWidth: 5, ...rOpts });
            rc.circle(hero.x - 30, hero.y + 80 + breath, 30, { stroke: colors.gold, strokeWidth: 3, ...rOpts });
            rc.circle(hero.x + 30, hero.y + 80 + breath, 30, { stroke: colors.gold, strokeWidth: 3, ...rOpts });
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
        } else if (hero.state === 'DASHING') {
            ctx.save();
            ctx.translate(hero.x, hero.y);
            ctx.rotate(Math.atan2(hero.dirY, hero.dirX));
            rc.line(-150, 0, -50, 0, { stroke: hero.boonColor, strokeWidth: 5, roughness: 3 });
            rc.polygon([[-40, -30], [50, 0], [-40, 30]], { fill: colors.red, fillStyle: 'hachure', hachureGap: 3, roughness: 3, stroke: hero.boonColor });
            ctx.restore();
        } else if (hero.state === 'ATTACKING') {
            ctx.save();
            ctx.translate(hero.x, hero.y);
            ctx.rotate(Math.atan2(hero.dirY, hero.dirX));
            rc.line(30, -30, 160, -10, { stroke: colors.red, roughness: 3, strokeWidth: 2, bowing: 2 });
            rc.line(40, 30, 150, 10, { stroke: hero.boonColor, roughness: 3, strokeWidth: 2, bowing: 2 });
            rc.line(-50, 0, 100, 0, { stroke: '#6b7280', strokeWidth: 6, roughness: 1 });
            rc.polygon([[100, -15], [160, 0], [100, 15]], { fill: hero.boonColor, fillStyle: 'solid' });
            rc.ellipse(-20, 0, 60, 40, { fill: colors.red, fillStyle: 'hachure', roughness: 2 });
            rc.ellipse(-10, -20, 40, 40, { fill: colors.skin, fillStyle: 'solid', roughness: 1.5 });
            ctx.restore();
        }
    }
}