// ...保留原有的 Enemy 和 DialogueLine 接口...
export interface Enemy {
    id: number;
    x: number; y: number;
    hp: number; maxHp: number; radius: number;
    hitFlashTimer: number; speed: number;
    state: 'CHASING' | 'ATTACKING';
    attackTimer: number; attackCooldown: number;
    dirX: number; dirY: number;
    
    // 【新增】Boss 专属属性
    isBoss?: boolean;
    name?: string;
    attackRound?: number; // 记录当前是第几轮攻击
}
export interface DialogueLine { /*...*/ speaker: string; text: string; color: string; }

// --- 新增：神明赐福数据结构 ---
export interface Boon {
    id: string;
    god: string;       // 神明名称
    name: string;      // 赐福技能名
    description: string; // 效果描述
    color: string;     // 神明代表色（太乙蓝、申公豹紫等）
    // apply 函数：当玩家选择该赐福时，直接修改主角的属性
    apply: (hero: any) => void; 
}

// --- 新增：地形障碍物 ---
export interface Obstacle {
    x: number;
    y: number;
    radius: number;
    type: 'ROCK' | 'BAMBOO' | 'POND'; // 新增：障碍物类型（山石、竹林、水潭）
}

// --- 新增：奖励门 ---
export interface Door {
    x: number;
    y: number;
    radius: number;
    rewardType: 'BOON' | 'HEAL'; // 门后对应的奖励类型
}