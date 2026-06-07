import type { Obstacle, Door } from '../entities/Types';

export class EnvironmentRenderer {
    static drawMap(rc: any, scene: string, width: number, height: number, storyPhase: number) {
        let bgColor = '#e5e7eb'; 
        let strokeColor = '#9ca3af';
        
        if (scene === 'HOME') { 
            rc.rectangle(0, 0, width, height, { fill: '#f3f4f6', fillStyle: 'hachure', hachureAngle: 30, hachureGap: 15, roughness: 2, strokeWidth: 3, stroke: '#d1d5db', seed: 100 });
            rc.rectangle(20, 20, width - 40, height - 40, { stroke: '#4b5563', strokeWidth: 6, roughness: 2.5, seed: 101 });
            rc.rectangle(40, 40, width - 80, height - 80, { stroke: '#9ca3af', strokeWidth: 2, roughness: 1.5, seed: 102 });
            for (let i = 60; i < width - 60; i += 100) { rc.rectangle(i, 20, 60, 20, { fill: '#6b7280', fillStyle: 'solid', stroke: '#374151', roughness: 1, seed: i }); }
            rc.line(width / 2, 350, width / 2, height - 80, { stroke: '#d1d5db', strokeWidth: 50, roughness: 2, seed: 103 });
            rc.line(80, 600, width - 80, 600, { stroke: '#d1d5db', strokeWidth: 50, roughness: 2, seed: 104 });
            rc.circle(width / 2, 600, 100, { stroke: '#9ca3af', strokeWidth: 4, roughness: 2, seed: 105 });
            rc.rectangle(width / 2 - 250, 80, 500, 270, { fill: '#e5e7eb', fillStyle: 'solid', stroke: '#9ca3af', strokeWidth: 4, roughness: 2, seed: 106 });
            rc.rectangle(width / 2 - 200, 120, 400, 190, { fill: '#cbd5e1', fillStyle: 'cross-hatch', stroke: '#6b7280', seed: 107 });
            rc.rectangle(80, 400, width / 2 - 130, 450, { fill: '#fef2f2', fillStyle: 'zigzag', hachureGap: 10, stroke: '#fca5a5', strokeWidth: 3, roughness: 2, seed: 108 });
            rc.rectangle(width / 2 + 50, 400, width / 2 - 130, 450, { fill: '#f0fdf4', fillStyle: 'dots', stroke: '#86efac', strokeWidth: 3, roughness: 2, seed: 109 });
            return; 
        }
        // 【修改】NPC 房间使用静谧的背景色
        else if (scene === 'OASIS' || scene === 'NPC_ROOM') { bgColor = '#ecfccb'; }
        else if (scene === 'BATTLE') {
            bgColor = storyPhase === 0 ? '#e5e7eb' : '#ccfbf1'; 
            strokeColor = storyPhase === 0 ? '#9ca3af' : '#5eead4';
        }

        rc.rectangle(0, 0, width, height, { fill: bgColor, fillStyle: 'hachure', hachureAngle: 30, hachureGap: 15, roughness: 2, strokeWidth: 3, stroke: strokeColor, seed: 1 });
    }

    static drawObstacle(rc: any, obs: Obstacle) {
        const obsSeed = Math.floor(obs.x + obs.y); 
        if (obs.type === 'ROCK') {
            rc.circle(obs.x, obs.y, obs.radius * 2, { fill: '#9ca3af', fillStyle: 'hachure', hachureAngle: 60, hachureGap: 4, roughness: 2.5, stroke: '#4b5563', strokeWidth: 2, seed: obsSeed });
            rc.polygon([[obs.x - obs.radius * 0.8, obs.y + obs.radius/2], [obs.x, obs.y - obs.radius], [obs.x + obs.radius * 0.8, obs.y + obs.radius/2]], { stroke: '#374151', strokeWidth: 2, roughness: 2, seed: obsSeed + 1 });
        } else if (obs.type === 'BAMBOO') {
            rc.circle(obs.x, obs.y, obs.radius * 2, { fill: '#dcfce7', fillStyle: 'solid', stroke: 'none', roughness: 2, seed: obsSeed });
            for (let i=0; i<4; i++) {
                const bx = obs.x - obs.radius * 0.6 + (obs.radius * 0.4) * i + (((obsSeed + i) % 10) - 5);
                rc.line(bx, obs.y + obs.radius * 0.8, bx, obs.y - obs.radius * 1.2, { stroke: '#22c55e', strokeWidth: 4, roughness: 1.5, seed: obsSeed + 2 + i });
            }
        } else if (obs.type === 'CORAL') {
            rc.circle(obs.x, obs.y, obs.radius * 2, { fill: '#fce7f3', fillStyle: 'solid', stroke: 'none', roughness: 2, seed: obsSeed });
            rc.curve([[obs.x, obs.y], [obs.x - 20, obs.y - obs.radius], [obs.x - 10, obs.y - obs.radius - 20]], { stroke: '#f43f5e', strokeWidth: 8, roughness: 2, seed: obsSeed + 1 });
            rc.curve([[obs.x, obs.y], [obs.x + 20, obs.y - obs.radius + 10], [obs.x + 30, obs.y - obs.radius - 10]], { stroke: '#f43f5e', strokeWidth: 6, roughness: 2, seed: obsSeed + 2 });
        } else if (obs.type === 'POND') {
            rc.ellipse(obs.x, obs.y, obs.radius * 2.5, obs.radius * 1.5, { fill: '#bae6fd', fillStyle: 'hachure', hachureAngle: 0, hachureGap: 6, roughness: 1.5, stroke: '#38bdf8', strokeWidth: 2, seed: obsSeed });
        }
    }

    static drawDoors(rc: any, ctx: CanvasRenderingContext2D, doors: Door[], frame: number) {
        for (const door of doors) {
            ctx.save(); ctx.translate(door.x, door.y); ctx.rotate(frame * 0.05);
            let doorColor = '#fff'; let iconText = ''; let label = '';
            switch (door.rewardType) {
                case 'BOON': doorColor = '#fbbf24'; iconText = '☯'; label = '神明赐福'; break;
                case 'HEAL': doorColor = '#10b981'; iconText = '❤'; label = '莲池仙境'; break;
                case 'GOLD': doorColor = '#eab308'; iconText = '🪙'; label = '龙宫秘宝'; break;
                case 'MAX_HP': doorColor = '#ef4444'; iconText = '🍖'; label = '蟠桃灵根'; break;
                case 'HAMMER': doorColor = '#6b7280'; iconText = '🔨'; label = '神兵重铸'; break;
            }
            rc.ellipse(0, 0, door.radius*2, door.radius*2, { stroke: doorColor, strokeWidth: 4, roughness: 3, bowing: 2 });
            rc.ellipse(0, 0, door.radius*1.5, door.radius*1.5, { stroke: doorColor, strokeWidth: 2, roughness: 2 });
            ctx.restore();
            ctx.fillStyle = doorColor; ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(label, door.x, door.y - 60);
            ctx.font = '24px Arial'; ctx.fillText(iconText, door.x, door.y + 8); ctx.textAlign = 'left';
        }
    }

    static drawHomePortal(rc: any, ctx: CanvasRenderingContext2D, portal: any, frame: number) {
        if (!portal.active) return;
        ctx.save(); ctx.translate(portal.x, portal.y); ctx.rotate(frame * 0.05);
        rc.ellipse(0, 0, 80, 80, { stroke: '#8b5cf6', strokeWidth: 4, roughness: 3, bowing: 2 });
        rc.ellipse(0, 0, 60, 60, { stroke: '#c4b5fd', strokeWidth: 2, roughness: 2 });
        ctx.restore(); ctx.fillStyle = '#8b5cf6'; ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif'; ctx.fillText('前往试炼', portal.x - 35, portal.y - 60);
    }

    static drawOasis(rc: any, ctx: CanvasRenderingContext2D, hero: any, pool: any) {
        rc.ellipse(pool.x, pool.y, pool.radius * 2.5, pool.radius * 1.5, { fill: '#bae6fd', fillStyle: 'solid', stroke: '#38bdf8', strokeWidth: 2, roughness: 1.5 });
        rc.circle(pool.x, pool.y, 40, { fill: '#fbcfe8', fillStyle: 'solid', stroke: '#f472b6', strokeWidth: 2 });
        const distPool = Math.sqrt(Math.pow(hero.x - pool.x, 2) + Math.pow(hero.y - pool.y, 2));
        if (distPool < pool.radius + 50 && !pool.used) { ctx.fillStyle = '#1f2937'; ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif'; ctx.fillText('[按 F 沐浴莲池恢复气血]', pool.x - 95, pool.y - 60); }
    }

    static drawWeaponRack(rc: any, ctx: CanvasRenderingContext2D, rack: any, hero: any, unlockedWeapons: string[]) {
        const rackSeed = 200;
        rc.rectangle(rack.x - 40, rack.y - 10, 80, 20, { fill: '#78350f', fillStyle: 'hachure', roughness: 2, stroke: '#451a03', seed: rackSeed });
        rc.line(rack.x - 30, rack.y, rack.x - 30, rack.y - 50, { stroke: '#451a03', strokeWidth: 5, roughness: 1.5, seed: rackSeed + 1 });
        rc.line(rack.x + 30, rack.y, rack.x + 30, rack.y - 50, { stroke: '#451a03', strokeWidth: 5, roughness: 1.5, seed: rackSeed + 2 });
        rc.line(rack.x - 40, rack.y - 40, rack.x + 40, rack.y - 40, { stroke: '#451a03', strokeWidth: 3, roughness: 1, seed: rackSeed + 3 });
        const weaponNames: Record<string, string> = { 'RING': '乾坤圈', 'SASH': '混天绫', 'SPEAR': '火尖枪', 'WHEELS': '风火轮' };
        rc.line(rack.x - 20, rack.y - 40, rack.x - 20, rack.y - 80, { stroke: '#fbbf24', strokeWidth: 2, roughness: 2, seed: rackSeed + 4 });
        rc.line(rack.x + 20, rack.y - 40, rack.x + 20, rack.y - 70, { stroke: '#ef4444', strokeWidth: 2, roughness: 2, seed: rackSeed + 5 });
        const dist = Math.sqrt(Math.pow(hero.x - rack.x, 2) + Math.pow(hero.y - rack.y, 2));
        if (dist < 100) { ctx.fillStyle = '#1f2937'; ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif'; const currentIndex = unlockedWeapons.indexOf(hero.weapon); const nextWeapon = unlockedWeapons[(currentIndex + 1) % unlockedWeapons.length]; ctx.fillText(`[按 F 装备: ${weaponNames[nextWeapon]}]`, rack.x - 65, rack.y - 95); }
    }

    static drawHomeLotusPool(rc: any, ctx: CanvasRenderingContext2D, pool: any, hero: any, costs: number[]) {
        const poolSeed = 300;
        rc.ellipse(pool.x, pool.y, pool.radius * 2, pool.radius * 1.5, { fill: '#fbcfe8', fillStyle: 'hachure', hachureAngle: 45, hachureGap: 5, stroke: '#f472b6', strokeWidth: 3, roughness: 2, seed: poolSeed });
        rc.circle(pool.x, pool.y - 10, 30, { fill: '#f472b6', fillStyle: 'solid', stroke: '#db2777', strokeWidth: 2 }); 
        const dist = Math.sqrt(Math.pow(hero.x - pool.x, 2) + Math.pow(hero.y - pool.y, 2));
        if (dist < pool.radius + 50 && hero.state !== 'UPGRADING') {
            ctx.fillStyle = '#1f2937'; ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif';
            if (hero.maxRevives < 3) ctx.fillText(`[按 F 消耗 ${costs[hero.maxRevives]} 灵石凝聚本命莲花]`, pool.x - 120, pool.y - 60);
            else ctx.fillText(`[七宝莲池：本命莲花已至大乘]`, pool.x - 110, pool.y - 60);
        }
    }
}