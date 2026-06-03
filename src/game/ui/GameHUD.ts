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
        // 根据不同场景显示名称
        let sceneName = '未知区域';
        if (currentScene === 'HOME') sceneName = '陈塘关府邸';
        else if (currentScene === 'BATTLE') sceneName = '试炼场';
        else if (currentScene === 'OASIS') sceneName = '莲池仙境';
        ctx.fillText(`魔童降世 - ${sceneName}`, 20, 115);

        // 【修复】动态居中的死亡结算与轮回提示
        if (hero.state === 'DEAD') {
            const screenW = window.innerWidth;
            const screenH = window.innerHeight;
            const cx = screenW / 2;
            const cy = screenH / 2;

            ctx.fillStyle = 'rgba(244, 240, 234, 0.7)';
            ctx.fillRect(0, 0, screenW, screenH);
            
            ctx.fillStyle = '#b91c1c';
            ctx.font = 'bold 72px "Comic Sans MS", cursive, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', cx, cy - 20);
            
            // 新增轮回提示
            ctx.fillStyle = '#374151';
            ctx.font = 'bold 24px "Comic Sans MS", cursive, sans-serif';
            ctx.fillText('[ 按 J 键回归莲池重塑金身 ]', cx, cy + 40);
            
            ctx.textAlign = 'left'; 
        }
    }
}