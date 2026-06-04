export class GameHUD {
    static draw(rc: any, ctx: CanvasRenderingContext2D, hero: any, currentScene: string) {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        ctx.fillStyle = 'rgba(243, 244, 246, 0.85)';
        ctx.fillRect(0, 0, screenW, 50);
        ctx.beginPath();
        ctx.moveTo(0, 50);
        ctx.lineTo(screenW, 50);
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#374151';
        ctx.textAlign = 'left';
        let sceneName = currentScene === 'HOME' ? '陈塘关府邸' : (currentScene === 'BATTLE' ? '试炼场' : '莲池仙境');
        ctx.font = 'bold 20px "Comic Sans MS", cursive, sans-serif';
        ctx.fillText(`【${sceneName}】`, 20, 32);

        ctx.font = '14px "Comic Sans MS", cursive, sans-serif';
        ctx.fillStyle = '#6b7280';
        ctx.fillText('指引: [WASD]移动 | [J]攻击 | [Space]冲刺 | [F]交互', 160, 31);

        const cx = screenW / 2;
        const hpWidth = 300;
        rc.rectangle(cx - hpWidth/2, 12, hpWidth, 20, { fill: '#d1d5db', fillStyle: 'solid', roughness: 1, stroke: 'none' });
        rc.rectangle(cx - hpWidth/2, 12, (hero.hp / hero.maxHp) * hpWidth, 20, { fill: '#ef4444', fillStyle: 'solid', roughness: 1, stroke: 'none' });
        rc.rectangle(cx - hpWidth/2, 12, hpWidth, 20, { stroke: '#374151', strokeWidth: 3, roughness: 2 });
        
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`${Math.floor(hero.hp)} / ${hero.maxHp}`, cx, 27);

        if (hero.dashCooldown > 0) rc.rectangle(cx - hpWidth/2, 36, (hero.dashCooldown / 40) * 145, 6, { fill: '#3b82f6', fillStyle: 'solid', roughness: 1, stroke: 'none' });
        if (hero.attackCooldown > 0) rc.rectangle(cx + 5, 36, (hero.attackCooldown / 20) * 145, 6, { fill: '#fbbf24', fillStyle: 'solid', roughness: 1, stroke: 'none' });

        ctx.textAlign = 'right';
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 20px "Comic Sans MS", cursive, sans-serif';
        ctx.fillText(`💎 灵石: ${hero.spiritStones}`, screenW - 20, 32);

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
            // 【修改】将 J 键改为了 F 键
            ctx.fillText('[ 按 F 键回归莲池重塑金身 ]', cx, cy + 40);
        }
        
        ctx.textAlign = 'left'; 
    }
}