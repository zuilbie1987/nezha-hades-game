export interface Enemy {
    id: number;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    radius: number;
    hitFlashTimer: number; 
    speed: number;
    state: 'CHASING' | 'ATTACKING';
    attackTimer: number;    
    attackCooldown: number; 
    dirX: number; 
    dirY: number; 
}

export interface DialogueLine {
    speaker: string;
    text: string;
    color: string;
}