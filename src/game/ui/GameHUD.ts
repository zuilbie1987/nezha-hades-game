export class GameHUD {
    static draw(rc: any, ctx: CanvasRenderingContext2D, hero: any, currentScene: string) {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        ctx.fillStyle = 'rgba(243, 244, 246, 0.85)';
        ctx.fillRect(0, 0, screenW, 70); // 顶部栏加宽以容纳莲花
        ctx.beginPath();
        ctx.moveTo(0, 70);
        ctx.lineTo(screenW, 70);
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#374151';
        ctx.textAlign = 'left';
        let sceneName = currentScene === 'HOME' ? '陈塘关府邸' : (currentScene === 'BATTLE' ? '试炼场' : '莲池仙境');
        ctx.font = 'bold 20px "Comic Sans MS", cursive, sans-serif';
        ctx.fillText(`【${sceneName}】`, 20, 42);

        ctx.font = '14px "Comic Sans MS", cursive, sans-serif';
        ctx.fillStyle = '#6b7280';
        ctx.fillText('指引: [WASD]移动 | [J]攻击 | [Space]冲刺 | [F]交互', 160, 41);

        const cx = screenW / 2;
        const hpWidth = 300;

        // ====== 【新增】绘制复活莲花图标 ======
        for (let i = 0; i < 3; i++) {
            const lx = cx - 40 + i * 40;
            const ly = 20; 
            if (i < hero.maxRevives) {
                if (i < hero.currentRevives) {
                    // 已解锁且可用：粉色饱满莲花
                    rc.ellipse(lx, ly, 24, 16, { fill: '#fbcfe8', fillStyle: 'solid', stroke: '#db2777', strokeWidth: 2, roughness: 1.5 });
                    rc.ellipse(lx, ly - 4, 12, 14, { fill: '#f472b6', fillStyle: 'solid', stroke: '#be185d', strokeWidth: 1.5, roughness: 1 });
                } else {
                    // 已解锁但已消耗：灰色空心轮廓
                    rc.ellipse(lx, ly, 24, 16, { stroke: '#6b7280', strokeWidth: 2, roughness: 2 });
                }
            } else {
                // 未解锁：淡淡的虚线阴影
                rc.ellipse(lx, ly, 16, 10, { stroke: '#d1d5db', strokeWidth: 1, roughness: 1 });
            }
        }

        // 血条统一下移至 Y = 40
        const hpY = 40;
        rc.rectangle(cx - hpWidth/2, hpY, hpWidth, 20, { fill: '#d1d5db', fillStyle: 'solid', roughness: 1, stroke: 'none' });
        rc.rectangle(cx - hpWidth/2, hpY, (hero.hp / hero.maxHp) * hpWidth, 20, { fill: '#ef4444', fillStyle: 'solid', roughness: 1, stroke: 'none' });
        rc.rectangle(cx - hpWidth/2, hpY, hpWidth, 20, { stroke: '#374151', strokeWidth: 3, roughness: 2 });
        
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`${Math.floor(hero.hp)} / ${hero.maxHp}`, cx, hpY + 15);

        if (hero.dashCooldown > 0) rc.rectangle(cx - hpWidth/2, hpY + 24, (hero.dashCooldown / 40) * 145, 6, { fill: '#3b82f6', fillStyle: 'solid', roughness: 1, stroke: 'none' });
        if (hero.attackCooldown > 0) rc.rectangle(cx + 5, hpY + 24, (hero.attackCooldown / 20) * 145, 6, { fill: '#fbbf24', fillStyle: 'solid', roughness: 1, stroke: 'none' });

        ctx.textAlign = 'right';
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 20px "Comic Sans MS", cursive, sans-serif';
        ctx.fillText(`💎 灵石: ${hero.spiritStones}`, screenW - 20, 42);

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
            ctx.fillText('[ 按 F 键回归莲池重塑金身 ]', cx, cy + 40);
        }
        
        ctx.textAlign = 'left'; 
    }
}