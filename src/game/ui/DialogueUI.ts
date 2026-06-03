import type { DialogueLine } from '../entities/Types';

export class DialogueUI {
    static draw(rc: any, ctx: CanvasRenderingContext2D, frame: number, dialogue: { active: boolean, index: number, lines: DialogueLine[] }) {
        if (!dialogue.active || !dialogue.lines[dialogue.index]) return;

        const currentLine = dialogue.lines[dialogue.index];
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        
        const boxWidth = Math.min(800, screenW - 40);
        const boxHeight = 150;
        const boxX = (screenW - boxWidth) / 2;
        const boxY = screenH - boxHeight - 40; // 固定在屏幕正下方

        rc.rectangle(boxX, boxY, boxWidth, boxHeight, {
            fill: '#f8fafc', fillStyle: 'solid', stroke: '#333', strokeWidth: 4, roughness: 2, bowing: 1
        });

        ctx.fillStyle = currentLine.color;
        ctx.font = 'bold 28px "Comic Sans MS", cursive, sans-serif';
        ctx.fillText(`${currentLine.speaker}：`, boxX + 30, boxY + 50);

        ctx.fillStyle = '#1f2937';
        ctx.font = '24px "Comic Sans MS", cursive, sans-serif';
        ctx.fillText(currentLine.text, boxX + 30, boxY + 100);

        if (frame % 60 < 30) {
            ctx.fillStyle = '#9ca3af';
            ctx.font = 'italic 16px "Comic Sans MS", cursive, sans-serif';
            ctx.fillText('按 F 继续', boxX + boxWidth - 100, boxY + boxHeight - 20);
        }
    }
}