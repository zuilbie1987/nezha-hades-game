export class GameHUD {
    static draw(rc: any, ctx: CanvasRenderingContext2D, hero: any, currentScene: string) {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        ctx.fillStyle = 'rgba(243, 244, 246, 0.85)';
        ctx.fillRect(0, 0, screenW, 70); 
        ctx.beginPath(); ctx.moveTo(0, 70); ctx.lineTo(screenW, 70);
        ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 2; ctx.stroke();

        ctx.fillStyle = '#374151'; ctx.textAlign = 'left';
        let sceneName = currentScene === 'HOME' ? '陈塘关府邸' : (currentScene === 'BATTLE' ? '试炼场' : (currentScene === 'NPC_ROOM' ? '神秘遭遇' : '莲池仙境'));
        ctx.font = 'bold 20px "Comic Sans MS", cursive, sans-serif';
        ctx.fillText(`【${sceneName}】`, 20, 42);

        ctx.font = '14px "Comic Sans MS", cursive, sans-serif'; ctx.fillStyle = '#6b7280';
        ctx.fillText('指引: [WASD]移动 | [J]攻击 | [Space]冲刺 | [F]交互', 160, 41);

        const cx = screenW / 2; const hpWidth = 300;

        for (let i = 0; i < 3; i++) {
            const lx = cx - 40 + i * 40; const ly = 20; 
            if (i < hero.maxRevives) {
                if (i < hero.currentRevives) {
                    rc.ellipse(lx, ly, 24, 16, { fill: '#fbcfe8', fillStyle: 'solid', stroke: '#db2777', strokeWidth: 2, roughness: 1.5 });
                    rc.ellipse(lx, ly - 4, 12, 14, { fill: '#f472b6', fillStyle: 'solid', stroke: '#be185d', strokeWidth: 1.5, roughness: 1 });
                } else { rc.ellipse(lx, ly, 24, 16, { stroke: '#6b7280', strokeWidth: 2, roughness: 2 }); }
            } else { rc.ellipse(lx, ly, 16, 10, { stroke: '#d1d5db', strokeWidth: 1, roughness: 1 }); }
        }

        const hpY = 40;
        rc.rectangle(cx - hpWidth/2, hpY, hpWidth, 20, { fill: '#d1d5db', fillStyle: 'solid', roughness: 1, stroke: 'none' });
        rc.rectangle(cx - hpWidth/2, hpY, (hero.hp / hero.maxHp) * hpWidth, 20, { fill: '#ef4444', fillStyle: 'solid', roughness: 1, stroke: 'none' });
        rc.rectangle(cx - hpWidth/2, hpY, hpWidth, 20, { stroke: '#374151', strokeWidth: 3, roughness: 2 });
        
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 14px Arial';
        ctx.fillText(`${Math.floor(hero.hp)} / ${hero.maxHp}`, cx, hpY + 15);

        if (hero.dashCooldown > 0) rc.rectangle(cx - hpWidth/2, hpY + 24, (hero.dashCooldown / 40) * 145, 6, { fill: '#3b82f6', fillStyle: 'solid', roughness: 1, stroke: 'none' });
        if (hero.attackCooldown > 0) rc.rectangle(cx + 5, hpY + 24, (hero.attackCooldown / 20) * 145, 6, { fill: '#fbbf24', fillStyle: 'solid', roughness: 1, stroke: 'none' });

        ctx.textAlign = 'right'; ctx.fillStyle = '#10b981'; ctx.font = 'bold 20px "Comic Sans MS", cursive, sans-serif';
        ctx.fillText(`💎 灵石: ${hero.spiritStones}`, screenW - 20, 32);
        ctx.fillStyle = '#eab308'; ctx.fillText(`🪙 金币: ${hero.gold}`, screenW - 20, 58);

        // ====== 【新增】渲染当前流派的侧边栏 ======
        ctx.textAlign = 'left';
        let by = 100;
        ctx.fillStyle = '#6b7280';
        ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif';
        ctx.fillText('【当前流派】', 20, by);
        
        const slots = [{ key: 'ATTACK', label: '普攻' }, { key: 'DASH', label: '冲刺' }, { key: 'PASSIVE', label: '被动' }];
        for (let i = 0; i < slots.length; i++) {
            const slot = slots[i];
            const boon = hero.boons[slot.key as 'ATTACK'|'DASH'|'PASSIVE'];
            by += 25;
            if (boon) {
                ctx.fillStyle = boon.color;
                ctx.fillText(`[${slot.label}] ${boon.name}`, 20, by);
            } else {
                ctx.fillStyle = '#9ca3af';
                ctx.fillText(`[${slot.label}] 未装备`, 20, by);
            }
        }

        if (hero.state === 'DEAD') {
            const cy = screenH / 2;
            ctx.fillStyle = 'rgba(244, 240, 234, 0.7)'; ctx.fillRect(0, 0, screenW, screenH);
            ctx.fillStyle = '#b91c1c'; ctx.font = 'bold 72px "Comic Sans MS", cursive, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', cx, cy - 20);
            ctx.fillStyle = '#374151'; ctx.font = 'bold 24px "Comic Sans MS", cursive, sans-serif';
            ctx.fillText('[ 按 F 键回归莲池重塑金身 ]', cx, cy + 40);
        }
        ctx.textAlign = 'left'; 
    }
}