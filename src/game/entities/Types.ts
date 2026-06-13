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
export interface DialogueLine { speaker: string; text: string; color: string; }

// ====== 【新增】定义赐福槽位类型 ======
export type BoonSlot = 'ATTACK' | 'DASH' | 'PASSIVE';
// --- 新增：神明赐福数据结构 ---
export interface Boon {
    id: string;
    god: string;       
    name: string;      
    description: string; 
    color: string;     
    slot: BoonSlot;         // 【新增】标记该赐福属于哪个槽位
    element?: ElementType;  // 【新增】标记该赐福附带的异常元素
}

// --- 新增：地形障碍物 ---
export interface Obstacle { x: number; y: number; radius: number; type: 'ROCK' | 'BAMBOO' | 'POND' | 'CORAL'; }

// ====== 【修改】加入 SHOP 商店门类型 ======
export type RewardType = 'BOON' | 'HEAL' | 'GOLD' | 'MAX_HP' | 'HAMMER' | 'BOSS' | 'SHOP';
// --- 新增：门的数据结构，玩家通过门进入下一层，门上会显示奖励类型（如赐福、治疗等）
export interface Door { x: number; y: number; radius: number; rewardType: RewardType; }

export type WeaponType = 'SPEAR' | 'RING' | 'SASH' | 'WHEELS'; 

export interface Projectile {
    x: number; y: number; dirX: number; dirY: number;
    speed: number; damage: number; bouncesLeft: number;  
    hitEnemies: number[]; state: 'FLYING' | 'RETURNING'; color: string;        
}

export type ElementType = 'NORMAL' | 'FIRE' | 'THUNDER' | 'ICE';

// ====== 【新增】伤害飘字数据结构 ======
export interface DamageText {
    x: number; y: number;          // 当前坐标
    value: number;                 // 伤害数值
    isCrit: boolean;               // 是否暴击
    life: number; maxLife: number; // 剩余寿命与总寿命（用于计算淡出）
    vx: number; vy: number;        // X和Y轴的飘动速度
}