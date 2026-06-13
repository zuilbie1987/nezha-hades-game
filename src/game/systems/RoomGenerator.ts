import type { Enemy, Obstacle, Door, RewardType } from '../entities/Types';

export class RoomGenerator {
    static generateBattleRoom(mapWidth: number, mapHeight: number, heroX: number, heroY: number, storyPhase: number): { enemies: Enemy[], obstacles: Obstacle[] } {
        const obstacles: Obstacle[] = [];
        const types: ('ROCK' | 'BAMBOO' | 'POND' | 'CORAL')[] = storyPhase === 0 ? ['ROCK', 'BAMBOO', 'POND'] : (storyPhase === 1 ? ['ROCK', 'CORAL', 'POND'] : ['ROCK', 'BAMBOO']);
        const numObstacles = Math.floor(Math.random() * 4) + 6; 
        
        for (let i = 0; i < numObstacles; i++) {
            let ox = 200 + Math.random() * (mapWidth - 400); let oy = 200 + Math.random() * (mapHeight - 400);
            const distToHero = Math.sqrt(Math.pow(ox - heroX, 2) + Math.pow(oy - heroY, 2));
            if (distToHero < 150) oy -= 200; 
            obstacles.push({ x: ox, y: oy, radius: 50 + Math.random() * 30, type: types[Math.floor(Math.random() * types.length)] });
        }

        const enemies: Enemy[] = [];
        if (storyPhase === 0) {
            enemies.push({ id: 1, x: mapWidth / 2 - 200, y: 300, hp: 50, maxHp: 50, radius: 30, hitFlashTimer: 0, speed: 2, state: 'CHASING', attackTimer: 0, attackCooldown: 0, dirX: 0, dirY: 0, enemyType: 'MELEE', name: '幻影守卫' });
            enemies.push({ id: 2, x: mapWidth / 2 + 200, y: 300, hp: 50, maxHp: 50, radius: 30, hitFlashTimer: 0, speed: 2.5, state: 'CHASING', attackTimer: 0, attackCooldown: 0, dirX: 0, dirY: 0, enemyType: 'MELEE', name: '幻影守卫' });
            enemies.push({ id: 3, x: mapWidth / 2, y: 150, hp: 40, maxHp: 40, radius: 25, hitFlashTimer: 0, speed: 1.8, state: 'CHASING', attackTimer: 0, attackCooldown: 0, dirX: 0, dirY: 0, enemyType: 'RANGED', name: '幻影法师' });
        } else if (storyPhase === 1) {
            enemies.push({ id: 1, x: mapWidth / 2 - 200, y: 300, hp: 70, maxHp: 70, radius: 35, hitFlashTimer: 0, speed: 1.5, state: 'CHASING', attackTimer: 0, attackCooldown: 0, dirX: 0, dirY: 0, enemyType: 'MELEE', name: '蟹将' });
            enemies.push({ id: 2, x: mapWidth / 2 + 200, y: 300, hp: 40, maxHp: 40, radius: 28, hitFlashTimer: 0, speed: 2.8, state: 'CHASING', attackTimer: 0, attackCooldown: 0, dirX: 0, dirY: 0, enemyType: 'MELEE', name: '虾兵' });
            enemies.push({ id: 3, x: mapWidth / 2, y: 150, hp: 50, maxHp: 50, radius: 25, hitFlashTimer: 0, speed: 1.8, state: 'CHASING', attackTimer: 0, attackCooldown: 0, dirX: 0, dirY: 0, enemyType: 'RANGED', name: '蚌精' });
        } else {
            // ====== 【新增】阶段 2：陈塘关卫兵 ======
            enemies.push({ id: 1, x: mapWidth / 2 - 200, y: 300, hp: 100, maxHp: 100, radius: 35, hitFlashTimer: 0, speed: 1.8, state: 'CHASING', attackTimer: 0, attackCooldown: 0, dirX: 0, dirY: 0, enemyType: 'MELEE', name: '府邸甲士' });
            enemies.push({ id: 2, x: mapWidth / 2 + 200, y: 300, hp: 80, maxHp: 80, radius: 30, hitFlashTimer: 0, speed: 2.2, state: 'CHASING', attackTimer: 0, attackCooldown: 0, dirX: 0, dirY: 0, enemyType: 'MELEE', name: '府邸甲士' });
            enemies.push({ id: 3, x: mapWidth / 2, y: 150, hp: 60, maxHp: 60, radius: 25, hitFlashTimer: 0, speed: 1.5, state: 'CHASING', attackTimer: 0, attackCooldown: 0, dirX: 0, dirY: 0, enemyType: 'RANGED', name: '府邸弓兵' });
        }
        return { enemies, obstacles };
    }

    static generateBossRoom(mapWidth: number, storyPhase: number): { enemies: Enemy[], obstacles: Obstacle[] } {
        if (storyPhase === 0) {
            return { enemies: [{ id: 999, x: mapWidth / 2, y: 300, hp: 9999, maxHp: 9999, radius: 50, hitFlashTimer: 0, speed: 1.5, state: 'CHASING', attackTimer: 0, attackCooldown: 100, dirX: 0, dirY: 0, enemyType: 'BOSS', isBoss: true, name: '太乙真人', attackRound: 0 }], obstacles: [] };
        } else if (storyPhase === 1) {
            return { enemies: [{ id: 998, x: mapWidth / 2, y: 300, hp: 1200, maxHp: 1200, radius: 45, hitFlashTimer: 0, speed: 2.2, state: 'CHASING', attackTimer: 0, attackCooldown: 80, dirX: 0, dirY: 0, enemyType: 'BOSS', isBoss: true, name: '敖丙', attackRound: 0 }], obstacles: [] };
        } else {
            // ====== 【新增】阶段 2：李靖 Boss ======
            return { enemies: [{ id: 997, x: mapWidth / 2, y: 300, hp: 2000, maxHp: 2000, radius: 45, hitFlashTimer: 0, speed: 2.5, state: 'CHASING', attackTimer: 0, attackCooldown: 70, dirX: 0, dirY: 0, enemyType: 'BOSS', isBoss: true, name: '李靖', attackRound: 0 }], obstacles: [] };
        }
    }

    static spawnRewardDoors(mapWidth: number, mapHeight: number, obstacles: Obstacle[], currentLevel: number): Door[] {
        if (currentLevel >= 4) {
            return [{ x: mapWidth / 2, y: 150, radius: 50, rewardType: 'BOSS' }];
        }

        const doors: Door[] = [];
        // ====== 【修改】将 SHOP 加入随机门池子 ======
        const allRewards: RewardType[] = ['BOON', 'HEAL', 'GOLD', 'MAX_HP', 'HAMMER', 'SHOP'];
        const shuffled = allRewards.sort(() => 0.5 - Math.random());
        const selectedRewards = [shuffled[0], shuffled[1]];

        for (let i = 0; i < 2; i++) {
            let px = mapWidth / 2 + (i === 0 ? -200 : 200); let py = 150;
            let valid = false; let attempts = 0;
            while (!valid && attempts < 50) {
                valid = true;
                for (const obs of obstacles) {
                    const dist = Math.sqrt(Math.pow(px - obs.x, 2) + Math.pow(py - obs.y, 2));
                    if (dist < 40 + obs.radius + 30) { valid = false; px += (Math.random() > 0.5 ? 1 : -1) * 40; py += (Math.random() > 0.5 ? 1 : -1) * 40; break; }
                }
                attempts++;
            }
            px = Math.max(100, Math.min(px, mapWidth - 100)); py = Math.max(100, Math.min(py, mapHeight - 100));
            doors.push({ x: px, y: py, radius: 40, rewardType: selectedRewards[i] });
        }
        return doors;
    }
}