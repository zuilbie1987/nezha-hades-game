export class UpgradeUI {
    static draw(rc: any, ctx: CanvasRenderingContext2D, hero: any) {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        // 半透明黑色遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, screenW, screenH);

        const boxW = 600;
        const boxH = 400;
        const bx = (screenW - boxW) / 2;
        const by = (screenH - boxH) / 2;

        // 菜单底板 (太乙真人的绿色主题)
        rc.rectangle(bx, by, boxW, boxH, { 
            fill: '#f8fafc', fillStyle: 'solid', stroke: '#10b981', strokeWidth: 4, roughness: 1.5 
        });

        // 标题
        ctx.fillStyle = '#10b981';
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px "Comic Sans MS", cursive, sans-serif';
        ctx.fillText('太乙真人的造化炉', screenW / 2, by + 60);

        // 当前货币
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 24px "Comic Sans MS", cursive, sans-serif';
        ctx.fillText(`当前灵石: ${hero.spiritStones}`, screenW / 2, by + 110);

        // 升级选项
        ctx.textAlign = 'left';
        ctx.font = '24px "Comic Sans MS", cursive, sans-serif';
        
        // 动态判断颜色（灵石够不够）
        const cost = 50;
        ctx.fillStyle = hero.spiritStones >= cost ? '#1f2937' : '#9ca3af';
        ctx.fillText(`[ 按 1 ] 强健体魄 (血量上限+20) - 消耗: ${cost} 灵石`, bx + 60, by + 180);
        
        ctx.fillText(`[ 按 2 ] 淬炼火尖 (攻击力+5)   - 消耗: ${cost} 灵石`, bx + 60, by + 240);
        
        ctx.fillText(`[ 按 3 ] 混天护体 (防御力+2)   - 消耗: ${cost} 灵石`, bx + 60, by + 300);

        // 底部提示
        ctx.fillStyle = '#9ca3af';
        ctx.textAlign = 'center';
        ctx.fillText('[ 按 F 离开 ]', screenW / 2, by + 360);
        
        // 恢复默认对齐
        ctx.textAlign = 'left';
    }
}