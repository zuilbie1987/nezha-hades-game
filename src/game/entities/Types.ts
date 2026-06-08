// ...保留原有的 Enemy 和 DialogueLine 接口...
export interface EnemyProjectile {
    x: number; y: number;
    dirX: number; dirY: number;
    speed: number; damage: number; radius: number;
    ownerId: number; // 【新增】记录发射者的怪物 ID
    bounces: number; // 【新增】记录反弹次数
}

export interface Enemy {
    id: number;
    x: number; y: number;
    hp: number; maxHp: number; radius: number;
    hitFlashTimer: number; speed: number;
    state: 'CHASING' | 'ATTACKING';
    attackTimer: number; attackCooldown: number;
    dirX: number; dirY: number;
    
    // 【修改】加入怪物类型区分
    enemyType?: 'MELEE' | 'RANGED' | 'BOSS'; 
    isBoss?: boolean;
    name?: string;
    attackRound?: number; 
    // 【新增】元素异常状态计时器（单位：逻辑帧）
    burnTimer?: number;   // 燃烧剩余时间
    frostTimer?: number;  // 冰冻减速剩余时间
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
export interface Obstacle { x: number; y: number; radius: number; type: 'ROCK' | 'BAMBOO' | 'POND' | 'CORAL'; }

// --- 新增：奖励类型定义 ---
export type RewardType = 'BOON' | 'HEAL' | 'GOLD' | 'MAX_HP' | 'HAMMER' | 'BOSS';
// --- 新增：门的数据结构，玩家通过门进入下一层，门上会显示奖励类型（如赐福、治疗等）
export interface Door { x: number; y: number; radius: number; rewardType: RewardType; }

export type WeaponType = 'SPEAR' | 'RING' | 'SASH' | 'WHEELS'; 

export interface Projectile {
    x: number; 
    y: number;
    dirX: number; 
    dirY: number;
    speed: number;
    damage: number;       
    bouncesLeft: number;  
    hitEnemies: number[]; 
    state: 'FLYING' | 'RETURNING'; 
    color: string;        
}
// 【新增】元素类型定义
export type ElementType = 'NORMAL' | 'FIRE' | 'THUNDER' | 'ICE';

