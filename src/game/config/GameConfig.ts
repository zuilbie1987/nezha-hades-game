import type { DialogueLine } from '../entities/Types';

export const GameConfig = {
    // 基础数值设定
    UPGRADE_COST: 50, // 太乙真人修炼消耗的灵石
    STONE_DROP_MIN: 5, // 怪物掉落灵石下限
    STONE_DROP_MAX: 10, // 怪物掉落灵石上限

    // 武器展示名称
    WEAPON_NAMES: {
        'RING': '乾坤圈',
        'SASH': '混天绫',
        'SPEAR': '火尖枪',
        'WHEELS': '风火轮'
    } as Record<string, string>,

    // 剧情剧本库
    DIALOGUES: {
        LI_JING: [
            { speaker: '李靖', text: '逆子！你又去哪里惹是生非了？', color: '#1d4ed8' },
            { speaker: '哪吒', text: '我命由我不由天！是他们先欺负人的！', color: '#dc2626' }
        ] as DialogueLine[],
        
        TAIYI_UNLOCK_SPEAR: [
            { speaker: '太乙真人', text: '徒儿啊，你竟然只拿着乾坤圈就去闯阵，难怪连为师一招都接不下！', color: '#10b981' },
            { speaker: '哪吒', text: '师傅偏心！乾坤圈近战太吃亏了！', color: '#dc2626' },
            { speaker: '太乙真人', text: '罢了罢了，这柄真正的【火尖枪】便传授于你，去打破天命吧！', color: '#10b981' },
            { speaker: '系统', text: '（已解锁武器：火尖枪。攻击力永久提升 20 点！）', color: '#fbbf24' }
        ] as DialogueLine[],
        
        TAIYI_UNLOCK_WHEELS: [
            { speaker: '太乙真人', text: '连火尖枪都败下阵来，看来是机动性不足。这【风火轮】你也一并拿去！', color: '#10b981' },
            { speaker: '哪吒', text: '早点拿出来不就好了！看我这次不把试炼场掀翻！', color: '#dc2626' },
            { speaker: '系统', text: '（已解锁武器：风火轮。化身烈焰旋风冲散敌人！）', color: '#fbbf24' }
        ] as DialogueLine[],

        EMPTY_RACK: [
            { speaker: '系统', text: '武器架上空空如也，或许哪天能获得一把长柄神兵...', color: '#4b5563' }
        ] as DialogueLine[]
    }
};