import type { Enemy, Obstacle, Door } from '../entities/Types';

export class RoomGenerator {
    // 生成带有随机障碍物和敌人的普通战斗房间
    static generateBattleRoom(mapWidth: number, mapHeight: number, heroX: number, heroY: number): { enemies: Enemy[], obstacles: Obstacle[] } {
        const obstacles: Obstacle[] = [];
        const types: ('ROCK' | 'BAMBOO' | 'POND')[] = ['ROCK', 'BAMBOO', 'POND'];
        const numObstacles = Math.floor(Math.random() * 4) + 6; 
        
        for (let i = 0; i < numObstacles; i++) {
            let ox = 200 + Math.random() * (mapWidth - 400);
            let oy = 200 + Math.random() * (mapHeight - 400);
            // 避开主角出生点
            const distToHero = Math.sqrt(Math.pow(ox - heroX, 2) + Math.pow(oy - heroY, 2));
            if (distToHero < 150) oy -= 200; 
            obstacles.push({ x: ox, y: oy, radius: 50 + Math.random() * 30, type: types[Math.floor(Math.random() * types.length)] });
        }

        // 【修改】混合生成近战与远程敌人
        const enemies: Enemy[] = [
            { id: 1, x: mapWidth / 2 - 200, y: 300, hp: 50, maxHp: 50, radius: 30, hitFlashTimer: 0, speed: 2, state: 'CHASING', attackTimer: 0, attackCooldown: 0, dirX: 0, dirY: 0, enemyType: 'MELEE' },
            { id: 2, x: mapWidth / 2 + 200, y: 300, hp: 50, maxHp: 50, radius: 30, hitFlashTimer: 0, speed: 2.5, state: 'CHASING', attackTimer: 0, attackCooldown: 0, dirX: 0, dirY: 0, enemyType: 'MELEE' },
            // 远程怪血少一点，但会在远处射击
            { id: 3, x: mapWidth / 2, y: 150, hp: 40, maxHp: 40, radius: 25, hitFlashTimer: 0, speed: 1.8, state: 'CHASING', attackTimer: 0, attackCooldown: 0, dirX: 0, dirY: 0, enemyType: 'RANGED' },
            { id: 4, x: mapWidth / 2 - 150, y: 150, hp: 40, maxHp: 40, radius: 25, hitFlashTimer: 0, speed: 1.8, state: 'CHASING', attackTimer: 0, attackCooldown: 0, dirX: 0, dirY: 0, enemyType: 'RANGED' }
        ];

        return { enemies, obstacles };
    }

    // 生成 Boss 房间
    static generateBossRoom(mapWidth: number): { enemies: Enemy[], obstacles: Obstacle[] } {
        const enemies: Enemy[] = [{ 
            id: 999, x: mapWidth / 2, y: 300, hp: 9999, maxHp: 9999, radius: 50, 
            hitFlashTimer: 0, speed: 1.5, state: 'CHASING', attackTimer: 0, attackCooldown: 100, 
            dirX: 0, dirY: 0, isBoss: true, name: '太乙真人', attackRound: 0 
        }];
        return { enemies, obstacles: [] }; // Boss 房没有障碍物
    }

    // 生成下一关的传送门（带有防地形碰撞机制）
    static spawnRewardDoors(mapWidth: number, mapHeight: number, obstacles: Obstacle[]): Door[] {
        const doors: Door[] = [];
        const rewardTypes: ('BOON' | 'HEAL')[] = ['BOON', 'HEAL'];
        
        for (let i = 0; i < 2; i++) {
            let px = mapWidth / 2 + (i === 0 ? -200 : 200);
            let py = 150;
            const radius = 40;
            let valid = false;
            let attempts = 0;
            
            while (!valid && attempts < 50) {
                valid = true;
                for (const obs of obstacles) {
                    const dist = Math.sqrt(Math.pow(px - obs.x, 2) + Math.pow(py - obs.y, 2));
                    if (dist < radius + obs.radius + 30) { 
                        valid = false;
                        px += (Math.random() > 0.5 ? 1 : -1) * 40; 
                        py += (Math.random() > 0.5 ? 1 : -1) * 40;
                        break;
                    }
                }
                attempts++;
            }
            px = Math.max(100, Math.min(px, mapWidth - 100));
            py = Math.max(100, Math.min(py, mapHeight - 100));
            doors.push({ x: px, y: py, radius, rewardType: rewardTypes[i] });
        }
        return doors;
    }
}