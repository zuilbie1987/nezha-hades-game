export class DialogueUI {
    static draw(rc: any, ctx: CanvasRenderingContext2D, frame: number, dialogue: any) {
        if (!dialogue.active || dialogue.index >= dialogue.lines.length) return;

        const line = dialogue.lines[dialogue.index];
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        const boxW = 600;
        const boxH = 220; 
        const boxX = (screenW - boxW) / 2;
        const boxY = (screenH - boxH) / 2;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        
        rc.rectangle(boxX, boxY, boxW, boxH, { stroke: line.color || '#374151', strokeWidth: 4, roughness: 2 });
        rc.rectangle(boxX + 5, boxY + 5, boxW - 10, boxH - 10, { stroke: '#9ca3af', strokeWidth: 2, roughness: 1.5 });

        ctx.fillStyle = line.color || '#1f2937';
        ctx.font = 'bold 26px "Comic Sans MS", cursive, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`【 ${line.speaker} 】`, boxX + 30, boxY + 45);

        ctx.fillStyle = '#374151';
        ctx.font = '22px "Comic Sans MS", cursive, sans-serif';
        
        const maxWidth = boxW - 80; 
        const lineHeight = 36;      
        let textX = boxX + 40;
        let textY = boxY + 100;

        let currentLine = '';
        const chars = line.text.split('');
        
        for (let i = 0; i < chars.length; i++) {
            const testLine = currentLine + chars[i];
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxWidth && i > 0) {
                ctx.fillText(currentLine, textX, textY);
                currentLine = chars[i]; 
                textY += lineHeight;
            } else {
                currentLine = testLine;
            }
        }
        ctx.fillText(currentLine, textX, textY);

        // 【修复】将 Date.now() 替换为基于 frame 变量的帧数计算
        // 游戏引擎是 60 FPS，所以 frame % 60 < 30 正好是每秒钟前半秒显示，后半秒隐藏
        if (frame % 60 < 30) {
            ctx.fillStyle = '#6b7280';
            ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('▼ 按 F 继续', boxX + boxW - 30, boxY + boxH - 25);
        }
        
        ctx.textAlign = 'left';
    }
}