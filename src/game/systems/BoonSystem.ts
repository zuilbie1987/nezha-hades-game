import type { Boon } from '../entities/Types';

export class BoonSystem {
    // 所有的神明赐福池
    private static pool: Boon[] = [
        {
            id: 'b1', 
            god: '太乙真人', 
            name: '醉仙望月', 
            // 结合：太乙的蓝色仙力化作火焰，附加持续燃烧，同时提升血量
            description: '攻击附带蓝色仙火(燃烧)，生命上限永久增加30点。', 
            color: '#3b82f6',
            apply: (hero) => { 
                hero.maxHp += 30; 
                hero.hp += 30; 
                hero.boonColor = '#3b82f6'; 
                hero.element = 'FIRE'; // 赋予火焰元素（DoT流血）
            }
        },
        {
            id: 'b2', 
            god: '敖丙', 
            name: '冰霜龙甲', 
            // 结合：水系龙族自带寒冰，附加减速，同时提升冲刺机动性
            description: '攻击附带极寒煞气(减速)，获得龙族机动性，冲刺速度极大提升。', 
            color: '#06b6d4',
            apply: (hero) => { 
                hero.dashSpeed += 15; 
                hero.boonColor = '#06b6d4'; 
                hero.element = 'ICE'; // 赋予冰冻元素（减速控制）
            }
        },
        {
            id: 'b3', 
            god: '申公豹', 
            name: '紫雷天降', 
            // 结合：狂暴雷电劈向四周，附加连锁闪电，同时增加攻击范围
            description: '攻击触发连锁闪电，狂暴雷力使突刺与弹射变得更远、更凶险。', 
            color: '#8b5cf6',
            apply: (hero) => { 
                hero.attackThrustSpeed += 5; 
                hero.boonColor = '#8b5cf6'; 
                hero.element = 'THUNDER'; // 赋予雷电元素（群体弹射）
            }
        },
        {
            id: 'b4', 
            god: '女娲', 
            name: '生生不息', 
            // 结合：作为大地之母，提供纯粹的生存保障，且不破坏玩家当前的元素流派
            description: '获得造化之力，你的血量瞬间恢复满状态，且保留当前武器元素。', 
            color: '#10b981',
            apply: (hero) => { 
                hero.hp = hero.maxHp; 
                hero.boonColor = '#10b981'; 
                // 注意：这里故意不设置 hero.element，这样就不会洗掉玩家之前拿到的火/冰/雷元素！
            }
        }
    ];

    static generateBoons(count: number = 3): Boon[] {
        // 洗牌算法随机抽取赐福
        const shuffled = [...this.pool].sort(() => 0.5 - Math.random());
        // 如果池子数量不足 count，会自动返回最大数量
        return shuffled.slice(0, count);
    }
}