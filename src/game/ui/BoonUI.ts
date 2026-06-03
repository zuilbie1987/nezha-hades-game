import type { Boon } from '../entities/Types';

export class BoonUI {
    static draw(rc: any, ctx: CanvasRenderingContext2D, boons: Boon[]) {
        if (!boons || boons.length === 0) return;

        // 1. 画一个半透明的黑色遮罩，让背后的游戏画面变暗（时间暂停感）
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, 800, 600);

        // 2. 标题
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 36px "Comic Sans MS", cursive, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('选择神明赐福', 400, 100);

        // 3. 卡片排版计算
        const cardWidth = 200;
        const cardHeight = 320;
        const gap = 40;
        // 总宽度: 3张卡 + 2个间隙 = 680。 起点 X: (800 - 680) / 2 = 60
        const startX = 60; 
        const startY = 150;

        // 4. 遍历绘制 3 张卡片
        for (let i = 0; i < boons.length; i++) {
            const boon = boons[i];
            const x = startX + i * (cardWidth + gap);

            // 卡片底板
            rc.rectangle(x, startY, cardWidth, cardHeight, {
                fill: '#f1f5f9', // 纸张色
                fillStyle: 'solid',
                stroke: boon.color, // 边框颜色跟随神明
                strokeWidth: 3,
                roughness: 1.5
            });

            // 神仙名字
            ctx.fillStyle = boon.color;
            ctx.font = 'bold 24px "Comic Sans MS", cursive, sans-serif';
            ctx.fillText(boon.god, x + cardWidth / 2, startY + 40);

            // 赐福技能名
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 20px "Comic Sans MS", cursive, sans-serif';
            ctx.fillText(boon.name, x + cardWidth / 2, startY + 80);

            // 分行绘制描述文本 (简单拆分法)
            ctx.fillStyle = '#475569';
            ctx.font = '16px "Comic Sans MS", cursive, sans-serif';
            const words = boon.description.split('');
            let line = '';
            let textY = startY + 130;
            
            // 极简的手写文本自动换行逻辑
            for (let j = 0; j < words.length; j++) {
                line += words[j];
                if (ctx.measureText(line).width > cardWidth - 40 || j === words.length - 1) {
                    ctx.fillText(line, x + cardWidth / 2, textY);
                    line = '';
                    textY += 24;
                }
            }

            // 底部操作提示
            ctx.fillStyle = '#9ca3af';
            ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif';
            ctx.fillText(`[ 按 ${i + 1} 选择 ]`, x + cardWidth / 2, startY + cardHeight - 30);
        }

        // 恢复文字对齐基准
        ctx.textAlign = 'left';
    }
}