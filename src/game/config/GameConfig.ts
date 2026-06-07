import type { DialogueLine } from '../entities/Types';

export const GameConfig = {
    UPGRADE_COST: 50,
    STONE_DROP_MIN: 5,
    STONE_DROP_MAX: 10,

    // 【新增】七宝莲池复活次数解锁价格（第1次，第2次，第3次）
    REVIVE_COSTS: [30, 100, 300],

    WEAPON_NAMES: {
        'RING': '乾坤圈', 'SASH': '混天绫', 'SPEAR': '火尖枪', 'WHEELS': '风火轮'
    } as Record<string, string>,

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
        ] as DialogueLine[],

        BOSS_TAIYI_ENCOUNTER: [
            { speaker: '太乙真人', text: '痴儿，你脑海中的暴戾之气太重，若破不了为师这九龙神火幻境，便乖乖回陈塘关禁闭吧！', color: '#10b981' },
            { speaker: '哪吒', text: '胖师傅，你这幻境也太无聊了！看我砸碎它回到现世！', color: '#dc2626' }
        ] as DialogueLine[],

        BOSS_AOBING_ENCOUNTER: [
            { speaker: '敖丙', text: '李哪吒！你这妖童竟敢来我东海生事，今日便要你神魂俱灭！', color: '#0ea5e9' },
            { speaker: '哪吒', text: '小泥鳅，本少爷刚从幻境里憋了一肚子火，正愁没处发泄！抽了你的龙筋！', color: '#dc2626' }
        ] as DialogueLine[],

        AOBING_DEFEATED: [
            { speaker: '哪吒', text: '小泥鳅，就这点本事也敢猖狂！抽了你的筋，回家给老爹做条腰带！', color: '#dc2626' },
            { speaker: '系统', text: '（你击杀了东海三太子！龙王震怒，水淹陈塘关！即将强制撤离...）', color: '#ef4444' }
        ] as DialogueLine[],

        BOSS_LIJING_ENCOUNTER: [
            { speaker: '李靖', text: '逆子！你竟敢打死东海三太子，惹下这等滔天大祸！今日我便大义灭亲，用这玲珑宝塔镇压你！', color: '#1d4ed8' },
            { speaker: '哪吒', text: '一人做事一人当！老头子，你若要杀我，我便连你也一起打！', color: '#dc2626' }
        ] as DialogueLine[],

        LIJING_DEFEATED: [
            { speaker: '李靖', text: '（吐血半跪）你...你这逆子，气煞我也！', color: '#1d4ed8' },
            { speaker: '哪吒', text: '我命由我不由天！谁也别想安排我！', color: '#dc2626' },
            { speaker: '系统', text: '（主线试炼完成！你已证明了魔童无所畏惧的实力！）', color: '#fbbf24' }
        ] as DialogueLine[],

        // ====== 【新增】NPC 奖励房间对话 ======
        NPC_AOGUANG: [
            { speaker: '敖广虚影', text: '小魔头，拿了这些龙宫秘宝，速速滚出本王的视野！', color: '#0ea5e9' },
            { speaker: '哪吒', text: '老泥鳅，这点钱就想打发小爷？下次我还要来！', color: '#dc2626' },
            { speaker: '系统', text: '（勒索成功！获得 150 金币！）', color: '#eab308' }
        ] as DialogueLine[],

        NPC_PIG: [
            { speaker: '神猪', text: '（呼噜噜... 吧唧吧唧... 嗝！）', color: '#f472b6' },
            { speaker: '哪吒', text: '胖师傅的坐骑？正好小爷饿了，把你的好吃的交出来！', color: '#dc2626' },
            { speaker: '神猪', text: '（惊醒！吐出一口粉色仙气笼罩了你，随后哼唧唧地飞走了）', color: '#f472b6' },
            { speaker: '系统', text: '（吸收仙气！生命上限永久提升 25 点，并恢复 25 点生命值！）', color: '#ef4444' }
        ] as DialogueLine[],

        // ====== 【新增】神兵重铸房间对话 ======
        NPC_BEASTS: [
            { speaker: '左结界兽', text: '站住！这可是太乙真人留下的青铜神锤，不许乱动！', color: '#059669' },
            { speaker: '右结界兽', text: '你瞎啊！这是小少爷！快把锤子拿来，帮少爷把法宝敲一敲！', color: '#d97706' },
            { speaker: '哪吒', text: '你们两个蠢货轻点敲！别把小爷的本命法宝给砸碎了！', color: '#dc2626' },
            { speaker: '系统', text: '（神兵重铸！你当前手持的武器发生了史诗级变异！）', color: '#6b7280' }
        ] as DialogueLine[]
    }
};