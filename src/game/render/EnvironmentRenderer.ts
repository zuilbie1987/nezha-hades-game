import type { Obstacle, Door } from '../entities/Types';

export class EnvironmentRenderer {
    static drawMap(rc: any, scene: string, width: number, height: number) {
        let bgColor = '#e5e7eb'; 
        if (scene === 'HOME') bgColor = '#f3f4f6'; 
        else if (scene === 'OASIS') bgColor = '#ecfccb'; 
        const strokeColor = scene === 'HOME' ? '#d1d5db' : '#9ca3af';

        rc.rectangle(0, 0, width, height, {
            fill: bgColor, fillStyle: 'hachure', hachureAngle: 30, hachureGap: 15, roughness: 2, strokeWidth: 3, stroke: strokeColor
        });

        if (scene === 'HOME') {
            rc.rectangle(300, 100, 200, 50, { fill: '#94a3b8', roughness: 1.5 });
        }
    }

    // 【修改】改为单体渲染，方便 Y 轴排序
    static drawObstacle(rc: any, obs: Obstacle) {
        if (obs.type === 'ROCK') {
            rc.circle(obs.x, obs.y, obs.radius * 2, { fill: '#9ca3af', fillStyle: 'hachure', hachureAngle: 60, hachureGap: 4, roughness: 2.5, stroke: '#4b5563', strokeWidth: 2 });
            rc.polygon([[obs.x - obs.radius * 0.8, obs.y + obs.radius/2], [obs.x, obs.y - obs.radius], [obs.x + obs.radius * 0.8, obs.y + obs.radius/2]], { stroke: '#374151', strokeWidth: 2, roughness: 2 });
        } else if (obs.type === 'BAMBOO') {
            rc.circle(obs.x, obs.y, obs.radius * 2, { fill: '#dcfce7', fillStyle: 'solid', stroke: 'none', roughness: 2 });
            for (let i=0; i<4; i++) {
                const bx = obs.x - obs.radius * 0.6 + (obs.radius * 0.4) * i + (Math.random() * 10 - 5);
                rc.line(bx, obs.y + obs.radius * 0.8, bx, obs.y - obs.radius * 1.2, { stroke: '#22c55e', strokeWidth: 4, roughness: 1.5 });
                rc.line(bx, obs.y - 10 + i*5, bx + 15, obs.y - 20 + i*5, { stroke: '#16a34a', strokeWidth: 2, roughness: 1 });
            }
        } else if (obs.type === 'POND') {
            rc.ellipse(obs.x, obs.y, obs.radius * 2.5, obs.radius * 1.5, { fill: '#bae6fd', fillStyle: 'hachure', hachureAngle: 0, hachureGap: 6, roughness: 1.5, stroke: '#38bdf8', strokeWidth: 2 });
            rc.curve([[obs.x - obs.radius/2, obs.y], [obs.x, obs.y + 5], [obs.x + obs.radius/2, obs.y - 5]], { stroke: '#0284c7', strokeWidth: 2, roughness: 1 });
        }
    }

    static drawDoors(rc: any, ctx: CanvasRenderingContext2D, doors: Door[], frame: number) {
        for (const door of doors) {
            ctx.save();
            ctx.translate(door.x, door.y);
            ctx.rotate(frame * 0.05);
            const doorColor = door.rewardType === 'BOON' ? '#fbbf24' : '#10b981';
            rc.ellipse(0, 0, door.radius*2, door.radius*2, { stroke: doorColor, strokeWidth: 4, roughness: 3, bowing: 2 });
            rc.ellipse(0, 0, door.radius*1.5, door.radius*1.5, { stroke: doorColor, strokeWidth: 2, roughness: 2 });
            ctx.restore();

            ctx.fillStyle = door.rewardType === 'BOON' ? '#fbbf24' : '#10b981';
            ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif';
            ctx.fillText(door.rewardType === 'BOON' ? '神明赐福' : '灵丹妙药', door.x - 35, door.y - 60);
        }
    }

    static drawHomePortal(rc: any, ctx: CanvasRenderingContext2D, portal: any, frame: number) {
        if (!portal.active) return;
        ctx.save();
        ctx.translate(portal.x, portal.y);
        ctx.rotate(frame * 0.05);
        rc.ellipse(0, 0, 80, 80, { stroke: '#8b5cf6', strokeWidth: 4, roughness: 3, bowing: 2 });
        rc.ellipse(0, 0, 60, 60, { stroke: '#c4b5fd', strokeWidth: 2, roughness: 2 });
        ctx.restore();
        ctx.fillStyle = '#8b5cf6';
        ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif';
        ctx.fillText('前往试炼场', portal.x - 40, portal.y - 60);
    }

    static drawOasis(rc: any, ctx: CanvasRenderingContext2D, hero: any, pool: any) {
        rc.ellipse(pool.x, pool.y, pool.radius * 2.5, pool.radius * 1.5, { fill: '#bae6fd', fillStyle: 'solid', stroke: '#38bdf8', strokeWidth: 2, roughness: 1.5 });
        rc.circle(pool.x, pool.y, 40, { fill: '#fbcfe8', fillStyle: 'solid', stroke: '#f472b6', strokeWidth: 2 });
        rc.circle(pool.x, pool.y, 20, { fill: '#fce7f3', fillStyle: 'solid', stroke: '#f472b6', strokeWidth: 1 });
        
        const distPool = Math.sqrt(Math.pow(hero.x - pool.x, 2) + Math.pow(hero.y - pool.y, 2));
        if (distPool < pool.radius + 50 && !pool.used) {
            ctx.fillStyle = '#1f2937';
            ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif';
            ctx.fillText('[按 F 沐浴莲池恢复气血]', pool.x - 95, pool.y - 60);
        }
    }

    static drawWeaponRack(rc: any, ctx: CanvasRenderingContext2D, rack: any, hero: any, unlockedWeapons: string[]) {
        rc.rectangle(rack.x - 40, rack.y - 10, 80, 20, { fill: '#78350f', fillStyle: 'hachure', roughness: 2, stroke: '#451a03' });
        rc.line(rack.x - 30, rack.y, rack.x - 30, rack.y - 50, { stroke: '#451a03', strokeWidth: 5, roughness: 1.5 });
        rc.line(rack.x + 30, rack.y, rack.x + 30, rack.y - 50, { stroke: '#451a03', strokeWidth: 5, roughness: 1.5 });
        rc.line(rack.x - 40, rack.y - 40, rack.x + 40, rack.y - 40, { stroke: '#451a03', strokeWidth: 3, roughness: 1 });

        const weaponNames: Record<string, string> = { 'RING': '乾坤圈', 'SASH': '混天绫', 'SPEAR': '火尖枪', 'WHEELS': '风火轮' };

        rc.line(rack.x - 20, rack.y - 40, rack.x - 20, rack.y - 80, { stroke: '#fbbf24', strokeWidth: 2, roughness: 2 });
        rc.line(rack.x + 20, rack.y - 40, rack.x + 20, rack.y - 70, { stroke: '#ef4444', strokeWidth: 2, roughness: 2 });

        const dist = Math.sqrt(Math.pow(hero.x - rack.x, 2) + Math.pow(hero.y - rack.y, 2));
        if (dist < 100) {
            ctx.fillStyle = '#1f2937';
            ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif';
            const currentIndex = unlockedWeapons.indexOf(hero.weapon);
            const nextWeapon = unlockedWeapons[(currentIndex + 1) % unlockedWeapons.length];
            ctx.fillText(`[按 F 装备: ${weaponNames[nextWeapon]}]`, rack.x - 65, rack.y - 95);
        }
    }
}