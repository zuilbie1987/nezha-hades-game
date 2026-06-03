export class GameHUD {
    static draw(rc: any, ctx: CanvasRenderingContext2D, hero: any, currentScene: string) {
        // 血条
        rc.rectangle(20, 20, 200, 25, { fill: '#d1d5db', fillStyle: 'solid', roughness: 1 });
        rc.rectangle(20, 20, (hero.hp / hero.maxHp) * 200, 25, { fill: '#ef4444', fillStyle: 'solid', roughness: 1, stroke: 'none' });
        rc.rectangle(20, 20, 200, 25, { stroke: '#374151', strokeWidth: 3, roughness: 2 });
        
        // 冷却条
        if (hero.dashCooldown > 0) rc.rectangle(20, 55, (hero.dashCooldown / 40) * 100, 10, { fill: '#3b82f6', fillStyle: 'solid', roughness: 1, stroke: 'none' });
        if (hero.attackCooldown > 0) rc.rectangle(20, 70, (hero.attackCooldown / 20) * 100, 10, { fill: '#fbbf24', fillStyle: 'solid', roughness: 1, stroke: 'none' });
        
        // 场景文本
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 24px "Comic Sans MS", cursive, sans-serif';
        const sceneName = currentScene === 'HOME' ? '陈塘关府邸' : '试炼场';
        ctx.fillText(`魔童降世 - ${sceneName}`, 20, 115);

        // 死亡结算
        if (hero.state === 'DEAD') {
            ctx.fillStyle = 'rgba(244, 240, 234, 0.7)';
            ctx.fillRect(0, 0, 800, 600);
            ctx.fillStyle = '#b91c1c';
            ctx.font = 'bold 72px "Comic Sans MS", cursive, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', 400, 300);
            ctx.fillStyle = '#374151';
            ctx.font = 'bold 24px "Comic Sans MS", cursive, sans-serif';
            ctx.fillText('刷新页面重新挑战', 400, 350);
            ctx.textAlign = 'left'; 
        }
    }
}