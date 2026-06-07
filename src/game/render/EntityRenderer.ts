import type { Enemy, EnemyProjectile } from '../entities/Types';

export class EntityRenderer {
    static drawEnemy(rc: any, ctx: CanvasRenderingContext2D, enemy: Enemy) {
        if (enemy.isBoss && enemy.name === '太乙真人') {
            ctx.save(); ctx.translate(enemy.x, enemy.y);
            rc.ellipse(0, -35, 80, 90, { fill: '#10b981', fillStyle: 'hachure', roughness: 2, hachureGap: 3 }); 
            rc.circle(0, -85, 40, { fill: '#fed7aa', fillStyle: 'solid', roughness: 1.5 }); 
            const gourdX = Math.cos(Date.now() / 300) * 60; const gourdY = Math.sin(Date.now() / 300) * 20 - 40;
            rc.ellipse(gourdX, gourdY, 20, 30, { fill: '#fbbf24', fillStyle: 'solid', stroke: '#b45309', strokeWidth: 2 });
            rc.circle(gourdX, gourdY - 20, 12, { fill: '#fbbf24', fillStyle: 'solid', stroke: '#b45309' });

            if (enemy.state === 'ATTACKING') {
                if (enemy.attackRound === 1) {
                    const radius = (60 - enemy.attackTimer) * 5; 
                    rc.circle(0, 0, radius, { stroke: '#3b82f6', strokeWidth: 4, roughness: 3 });
                } else if (enemy.attackRound === 2) {
                    ctx.fillStyle = '#b91c1c'; ctx.font = 'bold 48px "Comic Sans MS", cursive, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('九 龙 神 火 罩 ！', 0, -150);
                    const fireRadius = (120 - enemy.attackTimer) * 15;
                    rc.circle(0, 0, fireRadius, { fill: 'rgba(239, 68, 68, 0.4)', fillStyle: 'solid', stroke: '#dc2626', strokeWidth: 10, roughness: 5, bowing: 3 });
                }
            }
            const hpBarWidth = 100; const currentHpWidth = (enemy.hp / enemy.maxHp) * hpBarWidth;
            rc.rectangle(-hpBarWidth/2, -130, hpBarWidth, 8, { fill: '#374151', fillStyle: 'solid', roughness: 0.5 });
            rc.rectangle(-hpBarWidth/2, -130, currentHpWidth, 8, { fill: '#10b981', fillStyle: 'solid', roughness: 0.5, stroke: 'none' });
            
            if (enemy.burnTimer && enemy.burnTimer > 0) {
                ctx.fillStyle = '#f97316';
                for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc((Math.random() - 0.5) * enemy.radius * 2, -50 - Math.random() * enemy.radius * 1.5, 8, 0, Math.PI * 2); ctx.fill(); }
            }
            if (enemy.frostTimer && enemy.frostTimer > 0) {
                rc.rectangle(-enemy.radius/1.5, -90, enemy.radius * 1.3, 100, { fill: 'rgba(56, 189, 248, 0.3)', fillStyle: 'solid', stroke: '#0ea5e9', strokeWidth: 3, roughness: 1.5 });
            }
            ctx.restore(); return;
        }

        // ====== 【新增】绘制 Boss 李靖与玲珑宝塔大招 ======
        if (enemy.isBoss && enemy.name === '李靖') {
            ctx.save(); ctx.translate(enemy.x, enemy.y);
            // 将甲
            rc.polygon([[-25, 0], [25, 0], [35, -70], [-35, -70]], { fill: '#1d4ed8', fillStyle: 'cross-hatch', stroke: '#1e3a8a', strokeWidth: 2, roughness: 1.5 });
            // 披风
            rc.curve([[-30, -60], [-50, -20], [-40, 20]], { stroke: '#b91c1c', strokeWidth: 6, roughness: 2 });
            rc.curve([[30, -60], [50, -20], [40, 20]], { stroke: '#b91c1c', strokeWidth: 6, roughness: 2 });
            // 头部与发髻
            rc.circle(0, -80, 30, { fill: '#fed7aa', fillStyle: 'solid', stroke: '#9a3412', strokeWidth: 2 });
            rc.rectangle(-10, -110, 20, 15, { fill: '#000', fillStyle: 'solid' });

            if (enemy.state === 'ATTACKING') {
                ctx.fillStyle = '#1d4ed8'; ctx.font = 'bold 32px "Comic Sans MS", cursive, sans-serif'; ctx.textAlign = 'center'; 
                if (enemy.attackRound === 1) {
                    ctx.fillText('天 罡 剑 气 ！', 0, -130);
                    rc.line(0, -50, enemy.dirX * 100, -50 + enemy.dirY * 100, { stroke: '#fbbf24', strokeWidth: 8, roughness: 3 });
                } else {
                    ctx.fillText('玲 珑 宝 塔 ！', 0, -130);
                    // 宝塔发光投影
                    rc.polygon([[-40, -10], [40, -10], [0, -150]], { fill: 'rgba(250, 204, 21, 0.5)', fillStyle: 'solid', stroke: '#f59e0b', strokeWidth: 4, roughness: 2 });
                }
            }
            const hpBarWidth = 100; const currentHpWidth = (enemy.hp / enemy.maxHp) * hpBarWidth;
            rc.rectangle(-hpBarWidth/2, -140, hpBarWidth, 8, { fill: '#374151', fillStyle: 'solid', roughness: 0.5 });
            rc.rectangle(-hpBarWidth/2, -140, currentHpWidth, 8, { fill: '#3b82f6', fillStyle: 'solid', roughness: 0.5, stroke: 'none' });
            
            if (enemy.burnTimer && enemy.burnTimer > 0) { ctx.fillStyle = '#f97316'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc((Math.random() - 0.5) * enemy.radius * 2, -50 - Math.random() * enemy.radius * 1.5, 8, 0, Math.PI * 2); ctx.fill(); } }
            if (enemy.frostTimer && enemy.frostTimer > 0) { rc.rectangle(-enemy.radius/1.5, -100, enemy.radius * 1.3, 110, { fill: 'rgba(56, 189, 248, 0.3)', fillStyle: 'solid', stroke: '#0ea5e9', strokeWidth: 3, roughness: 1.5 }); }
            ctx.restore(); return;
        }

        // 【新增】绘制 Boss 敖丙
        if (enemy.isBoss && enemy.name === '敖丙') {
            ctx.save(); ctx.translate(enemy.x, enemy.y);
            // 冰蓝龙袍
            rc.polygon([[-30, 0], [30, 0], [40, -80], [-40, -80]], { fill: '#0284c7', fillStyle: 'hachure', roughness: 2 });
            rc.circle(0, -90, 35, { fill: '#e0f2fe', fillStyle: 'solid', stroke: '#0369a1', strokeWidth: 2 });
            // 龙角
            rc.curve([[ -20, -110 ], [ -35, -130 ], [ -15, -120 ]], { stroke: '#38bdf8', strokeWidth: 4, roughness: 2 });
            rc.curve([[ 20, -110 ], [ 35, -130 ], [ 15, -120 ]], { stroke: '#38bdf8', strokeWidth: 4, roughness: 2 });
            
            if (enemy.state === 'ATTACKING') {
                ctx.fillStyle = '#0284c7'; ctx.font = 'bold 32px "Comic Sans MS", cursive, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('冰 封 万 里！', 0, -150);
                rc.circle(0, 0, 80, { stroke: '#7dd3fc', strokeWidth: 6, roughness: 4 });
            }

            const hpBarWidth = 100; const currentHpWidth = (enemy.hp / enemy.maxHp) * hpBarWidth;
            rc.rectangle(-hpBarWidth/2, -140, hpBarWidth, 8, { fill: '#374151', fillStyle: 'solid', roughness: 0.5 });
            rc.rectangle(-hpBarWidth/2, -140, currentHpWidth, 8, { fill: '#ef4444', fillStyle: 'solid', roughness: 0.5, stroke: 'none' });
            
            if (enemy.burnTimer && enemy.burnTimer > 0) {
                ctx.fillStyle = '#f97316';
                for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc((Math.random() - 0.5) * enemy.radius * 2, -50 - Math.random() * enemy.radius * 1.5, 8, 0, Math.PI * 2); ctx.fill(); }
            }
            if (enemy.frostTimer && enemy.frostTimer > 0) {
                rc.rectangle(-enemy.radius/1.5, -100, enemy.radius * 1.3, 110, { fill: 'rgba(56, 189, 248, 0.3)', fillStyle: 'solid', stroke: '#0ea5e9', strokeWidth: 3, roughness: 1.5 });
            }
            ctx.restore(); return;
        }

        const isHit = enemy.hitFlashTimer > 0;
        const isAttacking = enemy.state === 'ATTACKING';
        const roughLevel = isHit ? 4 : (isAttacking ? 3 : 1.5);
        
        // 【修改】针对虾兵蟹将特化颜色
        let bodyFill = '#9ca3af'; let strokeColor = '#4b5563'; let headColor = '#d1d5db';
        if (enemy.name === '虾兵') { bodyFill = '#fca5a5'; strokeColor = '#b91c1c'; headColor = '#ef4444'; }
        else if (enemy.name === '蟹将') { bodyFill = '#fdba74'; strokeColor = '#c2410c'; headColor = '#ea580c'; }
        else if (enemy.name === '蚌精') { bodyFill = '#a78bfa'; strokeColor = '#6d28d9'; headColor = '#8b5cf6'; }
        // 【新增】陈塘关卫兵颜色特化 (铁甲风)
        else if (enemy.name === '府邸甲士') { bodyFill = '#94a3b8'; strokeColor = '#334155'; headColor = '#cbd5e1'; }
        else if (enemy.name === '府邸弓兵') { bodyFill = '#64748b'; strokeColor = '#1e293b'; headColor = '#94a3b8'; }
        else if (enemy.enemyType === 'RANGED') { bodyFill = '#d8b4fe'; strokeColor = '#9333ea'; headColor = '#a855f7'; }

        if (isHit) { bodyFill = '#fef2f2'; strokeColor = '#ef4444'; headColor = '#fca5a5'; }

        ctx.save(); ctx.translate(enemy.x, enemy.y);
        
        if (isAttacking && enemy.attackTimer < 20 && enemy.attackTimer > 5) {
            const angle = Math.atan2(enemy.dirY, enemy.dirX); ctx.rotate(angle);
            if (enemy.enemyType === 'RANGED') rc.circle(20, 0, 25, { fill: '#c084fc', fillStyle: 'solid', stroke: 'none' });
            else rc.polygon([[0, -10], [60, 0], [0, 10]], { fill: '#ef4444', fillStyle: 'solid', roughness: 3, stroke: 'none' });
            ctx.rotate(-angle); 
        }
        
        rc.rectangle(-10, -20, 20, 50, { fill: bodyFill, fillStyle: 'hachure', roughness: roughLevel, stroke: strokeColor });
        rc.line(-30, -5, 30, -5, { stroke: strokeColor, strokeWidth: 8, roughness: roughLevel });
        
        if (enemy.enemyType === 'RANGED') rc.polygon([[-20, -60], [20, -60], [20, -20], [-20, -20]], { fill: headColor, fillStyle: 'solid', roughness: roughLevel, stroke: strokeColor, strokeWidth: 2 });
        else rc.circle(0, -35, 30, { fill: headColor, fillStyle: 'solid', roughness: roughLevel, stroke: strokeColor, strokeWidth: 2 });

        if (enemy.burnTimer && enemy.burnTimer > 0) {
            ctx.fillStyle = '#f97316';
            for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc((Math.random() - 0.5) * enemy.radius * 1.2, -20 - Math.random() * enemy.radius, 6, 0, Math.PI * 2); ctx.fill(); }
        }
        if (enemy.frostTimer && enemy.frostTimer > 0) {
            rc.rectangle(-enemy.radius/2, -40, enemy.radius, 50, { fill: 'rgba(56, 189, 248, 0.3)', fillStyle: 'solid', stroke: '#0ea5e9', strokeWidth: 2, roughness: 1 });
        }
        ctx.restore();
    }

    static drawEnemyProjectiles(rc: any, ctx: CanvasRenderingContext2D, projectiles: EnemyProjectile[], frame: number) {
        for (const p of projectiles) {
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(frame * 0.3); 
            // 冰弹特效区别
            const isIce = p.damage > 10; 
            rc.circle(0, 0, p.radius * 2, { fill: isIce ? '#7dd3fc' : '#c084fc', fillStyle: 'hachure', hachureGap: 3, stroke: isIce ? '#0284c7' : '#9333ea', strokeWidth: 3, roughness: 2 });
            rc.circle(0, 0, p.radius, { fill: '#faf5ff', fillStyle: 'solid', stroke: 'none' });
            ctx.restore();
        }
    }

    static drawLightningArcs(rc: any, lightnings: any[]) {
        for (const l of lightnings) rc.line(l.x1, l.y1, l.x2, l.y2, { stroke: '#eab308', strokeWidth: 4, roughness: 3, bowing: 2 });
    }

    static drawLiJing(rc: any, ctx: CanvasRenderingContext2D, hero: any, npcLiJing: any, dialogueActive: boolean) {
        const nx = npcLiJing.x; const ny = npcLiJing.y;
        rc.rectangle(nx - 20, ny - 30, 40, 70, { fill: '#3b82f6', fillStyle: 'hachure', roughness: 1 });
        rc.circle(nx, ny - 50, 30, { fill: '#fed7aa', fillStyle: 'solid', roughness: 1 });
        rc.polygon([[nx - 10, ny - 35], [nx + 10, ny - 35], [nx, ny - 15]], { fill: '#1f2937', fillStyle: 'solid' });
        rc.line(nx - 30, ny, nx - 30, ny - 60, { stroke: '#000', strokeWidth: 3, roughness: 1 });
        ctx.fillStyle = '#1e3a8a'; ctx.font = 'bold 18px "Comic Sans MS", cursive, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('李靖', nx, ny + 60);

        const distLi = Math.sqrt(Math.pow(hero.x - nx, 2) + Math.pow(hero.y - ny, 2));
        if (distLi < 100 && !dialogueActive && hero.state !== 'UPGRADING') {
            ctx.fillStyle = '#1f2937'; ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif'; ctx.fillText('[按 F 交互]', nx, ny - 70); 
        }
        ctx.textAlign = 'left';
    }

    static drawTaiyi(rc: any, ctx: CanvasRenderingContext2D, hero: any, npcTaiyi: any, dialogueActive: boolean) {
        const tx = npcTaiyi.x; const ty = npcTaiyi.y;
        rc.ellipse(tx, ty - 25, 60, 70, { fill: '#10b981', fillStyle: 'hachure', roughness: 1.5 }); 
        rc.circle(tx, ty - 65, 30, { fill: '#fed7aa', fillStyle: 'solid', roughness: 1 }); 
        rc.ellipse(tx - 35, ty - 15, 15, 25, { fill: '#fbbf24', fillStyle: 'solid', stroke: 'none' }); 
        rc.circle(tx - 35, ty - 35, 10, { fill: '#fbbf24', fillStyle: 'solid', stroke: 'none' }); 
        ctx.fillStyle = '#064e3b'; ctx.font = 'bold 18px "Comic Sans MS", cursive, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('太乙真人', tx, ty + 60);

        const distTaiyi = Math.sqrt(Math.pow(hero.x - tx, 2) + Math.pow(hero.y - ty, 2));
        if (distTaiyi < 100 && !dialogueActive && hero.state !== 'UPGRADING') {
            ctx.fillStyle = '#1f2937'; ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif'; ctx.fillText('[按 F 修炼]', tx, ty - 90); 
        }
        ctx.textAlign = 'left';
    }

    // ====== 【重置】龙王敖广虚影 (正统中国龙造型) ======
    static drawAoGuang(rc: any, ctx: CanvasRenderingContext2D, hero: any, npc: any, interacted: boolean, dialogueActive: boolean, frame: number) {
        ctx.save();
        ctx.translate(npc.x, npc.y);
        
        // 呼吸般的全息投影效果
        const t = frame * 0.05;
        ctx.globalAlpha = 0.7 + Math.sin(t) * 0.2;

        // 1. 身体骨架 (瘦长蜿蜒的中国龙身体)
        const segments = 12;
        const bodyPoints = [];
        for (let i = 0; i <= segments; i++) {
            // 从上到下盘旋，龙首在最高处 (-220)，龙尾在最底部 (40)
            const py = -220 + i * 22; 
            // S型蜿蜒，加入时间 t 让它像在水流中游动
            const px = Math.sin(t + i * 0.6) * 45; 
            bodyPoints.push([px, py]);
        }

        // 2. 绘制龙尾 (在最后一个点)
        const tx = bodyPoints[segments][0];
        const ty = bodyPoints[segments][1];
        const tailSwing = Math.sin(t * 1.5) * 20;
        rc.polygon([[tx - 10, ty], [tx + 10, ty], [tx + tailSwing, ty + 40], [tx - 10 + tailSwing/2, ty + 30]], { fill: '#7dd3fc', fillStyle: 'solid', stroke: '#0284c7', strokeWidth: 2 });

        // 3. 绘制身体主干
        rc.curve(bodyPoints, { stroke: '#bae6fd', strokeWidth: 25, roughness: 1.5 });
        // 绘制身体龙鳞脊背线 (深色细线)
        rc.curve(bodyPoints, { stroke: '#0ea5e9', strokeWidth: 4, roughness: 2 });

        // 4. 龙爪 (附着在特定的身体曲折处)
        const drawClaw = (x: number, y: number, dir: number) => {
            const cx = x + 20 * dir;
            const cy = y + 10;
            // 手臂
            rc.line(x, y, cx, cy, { stroke: '#bae6fd', strokeWidth: 8, roughness: 1 });
            // 鹰爪尖
            rc.line(cx, cy, cx + 15 * dir, cy + 15, { stroke: '#0284c7', strokeWidth: 3 });
            rc.line(cx, cy, cx + 5 * dir, cy + 20, { stroke: '#0284c7', strokeWidth: 3 });
            rc.line(cx, cy, cx + 25 * dir, cy + 5, { stroke: '#0284c7', strokeWidth: 3 });
        };
        drawClaw(bodyPoints[3][0], bodyPoints[3][1], 1);    // 右前爪
        drawClaw(bodyPoints[5][0], bodyPoints[5][1], -1);   // 左前爪
        drawClaw(bodyPoints[8][0], bodyPoints[8][1], 1);    // 右后爪
        drawClaw(bodyPoints[10][0], bodyPoints[10][1], -1); // 左后爪

        // 5. 龙首
        const hx = bodyPoints[0][0];
        const hy = bodyPoints[0][1];

        // 龙发/鬃毛
        rc.circle(hx - 20, hy - 15, 25, { fill: '#38bdf8', fillStyle: 'solid', stroke: 'none' });
        rc.circle(hx + 20, hy - 15, 25, { fill: '#38bdf8', fillStyle: 'solid', stroke: 'none' });

        // 鹿角 (分支龙角)
        rc.curve([[hx - 10, hy - 20], [hx - 25, hy - 60], [hx - 15, hy - 90]], { stroke: '#0369a1', strokeWidth: 5, roughness: 2 });
        rc.line(hx - 22, hy - 50, hx - 40, hy - 65, { stroke: '#0369a1', strokeWidth: 4 }); // 侧枝
        rc.curve([[hx + 10, hy - 20], [hx + 25, hy - 60], [hx + 15, hy - 90]], { stroke: '#0369a1', strokeWidth: 5, roughness: 2 });
        rc.line(hx + 22, hy - 50, hx + 40, hy - 65, { stroke: '#0369a1', strokeWidth: 4 });

        // 瘦长的脸颊骨骼
        rc.polygon([[hx - 18, hy - 20], [hx + 18, hy - 20], [hx + 12, hy + 25], [hx - 12, hy + 25]], { fill: '#bae6fd', fillStyle: 'hachure', hachureGap: 4, stroke: '#0284c7', strokeWidth: 3 });
        // 突出宽大的龙鼻
        rc.ellipse(hx, hy + 25, 28, 20, { fill: '#7dd3fc', fillStyle: 'solid', stroke: '#0284c7', strokeWidth: 2 });
        
        // 鲶须 (细长且会随风飘动的龙须)
        const wx = Math.sin(t * 1.2) * 15;
        rc.curve([[hx - 12, hy + 25], [hx - 40, hy + 50 + wx], [hx - 60, hy + 80 - wx]], { stroke: '#38bdf8', strokeWidth: 3, roughness: 1.5 });
        rc.curve([[hx + 12, hy + 25], [hx + 40, hy + 50 - wx], [hx + 60, hy + 80 + wx]], { stroke: '#38bdf8', strokeWidth: 3, roughness: 1.5 });

        // 威严的倒八字眼
        rc.line(hx - 12, hy - 5, hx - 5, hy + 2, { stroke: '#0284c7', strokeWidth: 3 });
        rc.line(hx + 12, hy - 5, hx + 5, hy + 2, { stroke: '#0284c7', strokeWidth: 3 });

        ctx.restore();

        // 交互提示
        if (!interacted && !dialogueActive) {
            const dist = Math.sqrt(Math.pow(hero.x - npc.x, 2) + Math.pow(hero.y - npc.y, 2));
            if (dist < 150) {
                ctx.fillStyle = '#1f2937';
                ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif';
                // 文字高度上移，避免挡住高大的龙首
                ctx.fillText('[按 F 勒索龙宫秘宝]', npc.x - 70, npc.y - 250); 
            }
        }
    }

    // ====== 【新增】太乙的坐骑神猪 ======
    static drawFlyingPig(rc: any, ctx: CanvasRenderingContext2D, hero: any, npc: any, interacted: boolean, dialogueActive: boolean, frame: number) {
        // 如果交互完且对话结束，飞猪就溜走了，不再绘制
        if (interacted && !dialogueActive) return; 

        ctx.save();
        // 呼噜呼噜的呼吸起伏
        const breathe = Math.sin(frame * 0.05) * 5;
        ctx.translate(npc.x, npc.y + breathe);
        
        // 小翅膀
        rc.ellipse(-50, -20, 40, 20, { fill: '#fff', fillStyle: 'solid', stroke: '#9ca3af', strokeWidth: 2, roughness: 2 });
        rc.ellipse(50, -20, 40, 20, { fill: '#fff', fillStyle: 'solid', stroke: '#9ca3af', strokeWidth: 2, roughness: 2 });
        // 肥硕的身体
        rc.circle(0, 0, 120, { fill: '#fbcfe8', fillStyle: 'solid', stroke: '#db2777', strokeWidth: 3, roughness: 2 });
        // 猪鼻子
        rc.ellipse(0, 15, 40, 30, { fill: '#f472b6', fillStyle: 'solid', stroke: '#be185d', strokeWidth: 2 });
        rc.circle(-10, 15, 6, { fill: '#831843', fillStyle: 'solid' });
        rc.circle(10, 15, 6, { fill: '#831843', fillStyle: 'solid' });

        if (!interacted) {
            ctx.fillStyle = '#888';
            ctx.font = 'bold 24px "Comic Sans MS"';
            // Zzz 动画
            const zCount = Math.floor(frame / 30) % 4;
            ctx.fillText('Z'.repeat(zCount), 40, -60);
        }
        ctx.restore();

        if (!interacted && !dialogueActive) {
            const dist = Math.sqrt(Math.pow(hero.x - npc.x, 2) + Math.pow(hero.y - npc.y, 2));
            if (dist < 150) {
                ctx.fillStyle = '#1f2937';
                ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif';
                ctx.fillText('[按 F 抢夺蟠桃仙气]', npc.x - 70, npc.y - 80);
            }
        }
    }

    // ====== 【新增】青铜结界兽 (神兵重铸 NPC) ======
    static drawBarrierBeasts(rc: any, ctx: CanvasRenderingContext2D, hero: any, npc: any, interacted: boolean, dialogueActive: boolean, frame: number) {
        ctx.save();
        ctx.translate(npc.x, npc.y);
        
        // 呼吸跳动感
        const bounceLeft = Math.sin(frame * 0.1) * 4;
        const bounceRight = Math.cos(frame * 0.1) * 4;

        // 1. 绘制中央的巨大青铜神锤
        rc.rectangle(-10, -110, 20, 110, { fill: '#451a03', fillStyle: 'solid', stroke: '#292524', strokeWidth: 3 }); // 锤柄
        if (interacted) {
            // 被使用后锤子失去光泽
            rc.rectangle(-40, -140, 80, 40, { fill: '#6b7280', fillStyle: 'hachure', stroke: '#374151', strokeWidth: 3, roughness: 2 }); 
        } else {
            // 未使用时锤子闪闪发光
            rc.rectangle(-45, -145, 90, 50, { fill: '#fbbf24', fillStyle: 'hachure', hachureGap: 3, stroke: '#b45309', strokeWidth: 4, roughness: 2 }); 
            rc.circle(0, -120, 20, { stroke: '#fff', strokeWidth: 2 }); 
        }

        // 2. 左结界兽 (高瘦，独眼，绿青铜)
        ctx.save();
        ctx.translate(-50, bounceLeft);
        rc.rectangle(-20, -90, 40, 90, { fill: '#14532d', fillStyle: 'hachure', hachureAngle: 60, roughness: 2, stroke: '#064e3b', strokeWidth: 3 });
        rc.line(-10, -90, -20, -110, { stroke: '#064e3b', strokeWidth: 5, roughness: 2 }); // 左角
        rc.line(10, -90, 20, -110, { stroke: '#064e3b', strokeWidth: 5, roughness: 2 });  // 右角
        rc.circle(0, -65, 24, { fill: '#f8fafc', fillStyle: 'solid', stroke: '#064e3b', strokeWidth: 2 }); // 独眼
        rc.circle(0, -65, 8, { fill: '#000', fillStyle: 'solid' }); // 瞳孔
        rc.rectangle(-12, -30, 24, 12, { fill: '#fff', fillStyle: 'solid', stroke: '#000' }); // 龅牙
        rc.line(0, -30, 0, -18, { stroke: '#000', strokeWidth: 2 }); // 牙缝
        ctx.restore();

        // 3. 右结界兽 (矮胖，双眼，红青铜)
        ctx.save();
        ctx.translate(50, bounceRight);
        rc.circle(0, -45, 45, { fill: '#78350f', fillStyle: 'hachure', hachureAngle: -60, roughness: 2, stroke: '#451a03', strokeWidth: 3 });
        rc.circle(-15, -55, 16, { fill: '#f8fafc', fillStyle: 'solid', stroke: '#451a03', strokeWidth: 2 }); // 左眼
        rc.circle(-15, -55, 6, { fill: '#000', fillStyle: 'solid' }); 
        rc.circle(15, -55, 16, { fill: '#f8fafc', fillStyle: 'solid', stroke: '#451a03', strokeWidth: 2 }); // 右眼
        rc.circle(15, -55, 6, { fill: '#000', fillStyle: 'solid' }); 
        rc.ellipse(0, -20, 35, 15, { fill: '#000', fillStyle: 'solid' }); // 大嘴
        ctx.restore();

        ctx.restore();

        if (!interacted && !dialogueActive) {
            const dist = Math.sqrt(Math.pow(hero.x - npc.x, 2) + Math.pow(hero.y - npc.y, 2));
            if (dist < 150) {
                ctx.fillStyle = '#1f2937';
                ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif';
                ctx.fillText('[按 F 进行神兵重铸]', npc.x - 70, npc.y - 160); 
            }
        }
    }
}