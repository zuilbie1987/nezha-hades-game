import type { Boon } from '../entities/Types';

export class BoonSystem {
    // 所有的神明赐福池
    private static pool: Boon[] = [
        {
            id: 'b1', god: '太乙真人', name: '醉仙望月', description: '攻击附带太乙的仙力，生命上限永久增加30点。', color: '#3b82f6',
            apply: (hero) => { hero.maxHp += 30; hero.hp += 30; hero.boonColor = '#3b82f6'; }
        },
        {
            id: 'b2', god: '敖丙', name: '冰霜龙甲', description: '获得龙族机动性，冲刺速度极大提升。', color: '#06b6d4',
            apply: (hero) => { hero.dashSpeed += 15; hero.boonColor = '#06b6d4'; }
        },
        {
            id: 'b3', god: '申公豹', name: '紫雷天降', description: '狂暴的雷电之力，每次突刺距离变得更长、更凶险。', color: '#8b5cf6',
            apply: (hero) => { hero.attackThrustSpeed += 5; hero.boonColor = '#8b5cf6'; }
        },
        {
            id: 'b4', god: '女娲', name: '生生不息', description: '获得造化之力，你的血量瞬间恢复满状态。', color: '#10b981',
            apply: (hero) => { hero.hp = hero.maxHp; hero.boonColor = '#10b981'; }
        }
    ];

    // 随机抽取指定数量（默认3个）不重复的赐福
    static generateBoons(count: number = 3): Boon[] {
        // 打乱数组
        const shuffled = [...this.pool].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
}