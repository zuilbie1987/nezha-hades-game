export class GameHUD {
    static draw(rc: any, ctx: CanvasRenderingContext2D, hero: any, currentScene: string) {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        // 【新增】顶部半透明信息栏背景
        ctx.fillStyle = 'rgba(243, 244, 246, 0.85)';
        ctx.fillRect(0, 0, screenW, 50);
        ctx.beginPath();
        ctx.moveTo(0, 50);
        ctx.lineTo(screenW, 50);
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 2;
        ctx.stroke();

        // --- 1. 左侧：场景名称与操作指引 ---
        ctx.fillStyle = '#374151';
        ctx.textAlign = 'left';
        let sceneName = currentScene === 'HOME' ? '陈塘关府邸' : (currentScene === 'BATTLE' ? '试炼场' : '莲池仙境');
        ctx.font = 'bold 20px "Comic Sans MS", cursive, sans-serif';
        ctx.fillText(`【${sceneName}】`, 20, 32);

        // 操作指引
        ctx.font = '14px "Comic Sans MS", cursive, sans-serif';
        ctx.fillStyle = '#6b7280';
        ctx.fillText('指引: [WASD]移动 | [J]攻击 | [Space]冲刺 | [F]交互', 160, 31);

        // --- 2. 中间：居中的血条与冷却状态 ---
        const cx = screenW / 2;
        const hpWidth = 300;
        rc.rectangle(cx - hpWidth/2, 12, hpWidth, 20, { fill: '#d1d5db', fillStyle: 'solid', roughness: 1, stroke: 'none' });
        rc.rectangle(cx - hpWidth/2, 12, (hero.hp / hero.maxHp) * hpWidth, 20, { fill: '#ef4444', fillStyle: 'solid', roughness: 1, stroke: 'none' });
        rc.rectangle(cx - hpWidth/2, 12, hpWidth, 20, { stroke: '#374151', strokeWidth: 3, roughness: 2 });
        
        // 血量数值
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`${Math.floor(hero.hp)} / ${hero.maxHp}`, cx, 27);

        // 冲刺与攻击冷却条 (贴在血条下方)
        if (hero.dashCooldown > 0) rc.rectangle(cx - hpWidth/2, 36, (hero.dashCooldown / 40) * 145, 6, { fill: '#3b82f6', fillStyle: 'solid', roughness: 1, stroke: 'none' });
        if (hero.attackCooldown > 0) rc.rectangle(cx + 5, 36, (hero.attackCooldown / 20) * 145, 6, { fill: '#fbbf24', fillStyle: 'solid', roughness: 1, stroke: 'none' });

        // --- 3. 右侧：灵石数量 ---
        ctx.textAlign = 'right';
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 20px "Comic Sans MS", cursive, sans-serif';
        ctx.fillText(`💎 灵石: ${hero.spiritStones}`, screenW - 20, 32);

        // --- 4. 死亡结算居中画面 ---
        if (hero.state === 'DEAD') {
            const cy = screenH / 2;
            ctx.fillStyle = 'rgba(244, 240, 234, 0.7)';
            ctx.fillRect(0, 0, screenW, screenH);
            
            ctx.fillStyle = '#b91c1c';
            ctx.font = 'bold 72px "Comic Sans MS", cursive, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', cx, cy - 20);
            
            ctx.fillStyle = '#374151';
            ctx.font = 'bold 24px "Comic Sans MS", cursive, sans-serif';
            ctx.fillText('[ 按 J 键回归莲池重塑金身 ]', cx, cy + 40);
        }
        
        ctx.textAlign = 'left'; // 重置对齐方式防污染
    }
}