import type { Boon } from '../entities/Types';

export class BoonUI {
    static draw(rc: any, ctx: CanvasRenderingContext2D, boons: Boon[]) {
        if (!boons || boons.length === 0) return;

        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, screenW, screenH);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 36px "Comic Sans MS", cursive, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('选择神明赐福', screenW / 2, Math.max(100, screenH * 0.15));

        const cardWidth = 240;
        const cardHeight = 360;
        const gap = 40;
        const totalWidth = cardWidth * 3 + gap * 2;
        const startX = (screenW - totalWidth) / 2; 
        const startY = Math.max(160, (screenH - cardHeight) / 2);

        for (let i = 0; i < boons.length; i++) {
            const boon = boons[i];
            const x = startX + i * (cardWidth + gap);

            rc.rectangle(x, startY, cardWidth, cardHeight, {
                fill: '#f1f5f9', fillStyle: 'solid', stroke: boon.color, strokeWidth: 3, roughness: 1.5
            });

            ctx.fillStyle = boon.color;
            ctx.font = 'bold 24px "Comic Sans MS", cursive, sans-serif';
            ctx.fillText(boon.god, x + cardWidth / 2, startY + 40);

            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 20px "Comic Sans MS", cursive, sans-serif';
            ctx.fillText(boon.name, x + cardWidth / 2, startY + 80);

            ctx.fillStyle = '#475569';
            ctx.font = '16px "Comic Sans MS", cursive, sans-serif';
            const words = boon.description.split('');
            let line = '';
            let textY = startY + 130;
            
            for (let j = 0; j < words.length; j++) {
                line += words[j];
                if (ctx.measureText(line).width > cardWidth - 40 || j === words.length - 1) {
                    ctx.fillText(line, x + cardWidth / 2, textY);
                    line = '';
                    textY += 24;
                }
            }

            ctx.fillStyle = '#9ca3af';
            ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif';
            ctx.fillText(`[ 按 ${i + 1} 选择 ]`, x + cardWidth / 2, startY + cardHeight - 30);
        }
        ctx.textAlign = 'left';
    }
}