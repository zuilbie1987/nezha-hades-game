import type { Boon } from '../entities/Types';

export class BoonSystem {
    // 全新的槽位细分赐福池
    private static pool: Boon[] = [
        // ====== 普攻槽 (ATTACK) ======
        { id: 'a1', slot: 'ATTACK', element: 'FIRE', god: '魔童本源', name: '魔火普攻', description: '普攻附带魔童真火，使敌人陷入(燃烧)持续掉血。', color: '#ef4444' },
        { id: 'a2', slot: 'ATTACK', element: 'ICE', god: '敖丙', name: '寒霜普攻', description: '普攻附带极寒煞气，使敌人(减速)50%。', color: '#06b6d4' },
        { id: 'a3', slot: 'ATTACK', element: 'THUNDER', god: '申公豹', name: '狂雷普攻', description: '普攻触发(连锁闪电)，在敌人间疯狂弹射。', color: '#8b5cf6' },
        
        // ====== 冲刺槽 (DASH) ======
        { id: 'd1', slot: 'DASH', god: '魔童本源', name: '风火冲刺', description: '冲刺距离变远，且冷却时间小幅缩短。', color: '#f97316' },
        { id: 'd2', slot: 'DASH', god: '敖丙', name: '冰龙冲刺', description: '获得龙族机动性，冲刺速度极大提升。', color: '#38bdf8' },
        { id: 'd3', slot: 'DASH', god: '申公豹', name: '闪电冲刺', description: '冲刺如闪电般频繁，冷却时间大幅缩短。', color: '#a855f7' },
        
        // ====== 被动槽 (PASSIVE) ======
        { id: 'p1', slot: 'PASSIVE', god: '殷夫人', name: '慈母血阵', description: '每次击杀敌人时，有20%概率恢复 5 点生命。', color: '#10b981' },
        { id: 'p2', slot: 'PASSIVE', god: '太乙真人', name: '造化青莲', description: '在战场上，每半秒自动恢复 1 点生命。', color: '#34d399' },
        { id: 'p3', slot: 'PASSIVE', god: '申公豹', name: '豹子胆', description: '造成暴击时，附加 20 点真实伤害！', color: '#c084fc' }
    ];

    static generateBoons(count: number = 3): Boon[] {
        const shuffled = [...this.pool].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
}