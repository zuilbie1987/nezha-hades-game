export class ShopUI {
    static draw(rc: any, ctx: CanvasRenderingContext2D, hero: any, stock: boolean[]) {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        // 半透明遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, screenW, screenH);

        const boxW = 700;
        const boxH = 450;
        const bx = (screenW - boxW) / 2;
        const by = (screenH - boxH) / 2;

        // 黑紫色的黑市底板
        rc.rectangle(bx, by, boxW, boxH, { 
            fill: '#2e1065', fillStyle: 'solid', stroke: '#9333ea', strokeWidth: 4, roughness: 1.5 
        });

        // 标题
        ctx.fillStyle = '#d8b4fe';
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px "Comic Sans MS", cursive, sans-serif';
        ctx.fillText('申公豹的黑市', screenW / 2, by + 60);

        // 玩家当前状态
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 20px "Comic Sans MS", cursive, sans-serif';
        ctx.fillText(`当前金币: ${hero.gold}   |   最大生命值: ${hero.maxHp}`, screenW / 2, by + 100);

        ctx.textAlign = 'left';
        ctx.font = '22px "Comic Sans MS", cursive, sans-serif';
        
        // 商品 1：仙力盲盒
        if (stock[0]) {
            ctx.fillStyle = hero.gold >= 150 ? '#f8fafc' : '#6b7280';
            ctx.fillText(`[ 按 1 ] 仙力盲盒 (随机获得一个神明赐福) - 150 金币`, bx + 50, by + 180);
        } else {
            ctx.fillStyle = '#4b5563';
            ctx.fillText(`[ 已售罄 ] 仙力盲盒`, bx + 50, by + 180);
        }

        // 商品 2：九转大还丹
        if (stock[1]) {
            ctx.fillStyle = hero.gold >= 50 ? '#f8fafc' : '#6b7280';
            ctx.fillText(`[ 按 2 ] 九转大还丹 (恢复 50 点生命值) - 50 金币`, bx + 50, by + 250);
        } else {
            ctx.fillStyle = '#4b5563';
            ctx.fillText(`[ 已售罄 ] 九转大还丹`, bx + 50, by + 250);
        }

        // ====== 核心需求商品：邪术血契 ======
        if (stock[2]) {
            ctx.fillStyle = '#ef4444';
            ctx.fillText(`[ 按 3 ] 邪术契约 (生命上限减半，获得 150 金币) - 代价: 鲜血`, bx + 50, by + 320);
        } else {
            ctx.fillStyle = '#4b5563';
            ctx.fillText(`[ 契约已结 ] 邪术契约`, bx + 50, by + 320);
        }

        ctx.fillStyle = '#9ca3af';
        ctx.textAlign = 'center';
        ctx.fillText('[ 按 F 离开黑市继续前行 ]', screenW / 2, by + 410);
        ctx.textAlign = 'left';
    }
}