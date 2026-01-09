import { Engine } from './engine.js';
import { Vec3 } from './utils.js';
import { Projectile } from './objects.js'; 

export function handleYujiSkill(fighter, slot) {
    const inDomain = Engine.domain.active && Engine.domain.owner === fighter;

    // SKILL 1: DIVERGENT FIST -> BLACK FLASH
    if (slot === 1) {
        // If pressed during the specific window (approx 0.3s after first hit)
        if (fighter.waitingForTiming) {
            // Window is between 15 and 25 frames (approx 0.25s - 0.4s)
            if (fighter.bfWindow >= 10 && fighter.bfWindow <= 30) {
                fighter.bfChain = Math.min(fighter.bfChain + 1, 4);
                triggerBlackFlash(fighter);
                fighter.bfWindow = 0; 
                // Reset window for next chain
                fighter.waitingForTiming = true;
            } else {
                Engine.spawnParticle(fighter.pos, '#888', 'text', 'MISSED TIMING');
                fighter.waitingForTiming = false; 
                fighter.bfChain = 0; 
                fighter.cds.s1 = 40;
            }
            return true; 
        } else {
            // First Hit: Divergent Fist
            if (fighter.cds.s1 > 0) return true;
            fighter.ce -= 20; 
            fighter.cds.s1 = 20; // Short CD to allow combo if missed
            fighter.state = 'ATTACK'; 
            
            // Divergent Fist Effect
            fighter.attack('HEAVY');
            Engine.spawnParticle(fighter.pos, '#0088ff', 'text', 'DIVERGENT FIST');
            Engine.spawnParticle(fighter.pos.add(new Vec3(fighter.facing * 40, -50, 0)), '#0088ff', 'burst');
            
            // Start Window
            fighter.waitingForTiming = true; 
            fighter.bfWindow = 0;
            return true;
        }
    }

    // SKILL 2: PIERCING BLOOD (Charging)
    if (slot === 2) {
        if (fighter.cds.s2 > 0 || fighter.ce < 40) return true;
        fighter.ce -= 40;
        fighter.cds.s2 = fighter.maxCds.s2;
        fighter.state = 'CHARGING_PB';
        fighter.chargeTimer = 0;
        Engine.spawnParticle(fighter.pos, '#b91c1c', 'text', 'CONVERGENCE');
        return true;
    }

    // SKILL 3: DISMANTLE (Melee Slash)
    if (slot === 3) {

        if (fighter.cds.ult > 0 || fighter.ce < 50) return true;
        fighter.ce -= 50;
        fighter.cds.ult = 60;
        fighter.state = 'ATTACK';
        
        // Visuals
        Engine.spawnParticle(fighter.pos, '#fff', 'text', 'DISMANTLE');
        Engine.screenShake = 5;
        
        // Logic: Hitscan in front
        setTimeout(() => {
            const t = Engine.fighters.find(f => f !== fighter);
            if (t && fighter.pos.dist(t.pos) < 120 && Math.abs(fighter.pos.z - t.pos.z) < 50) {
                 // Create Slashes visuals on enemy
                 for(let i=0; i<3; i++) {
                     setTimeout(() => {
                         Engine.spawnParticle(t.pos.add(new Vec3((Math.random()-0.5)*40, (Math.random()-0.5)*60, 0)), '#fff', 'spark');
                     }, i*50);
                 }
                 t.takeDamage(90, fighter);
                 Engine.spawnParticle(t.pos, '#ff0055', 'burst');
            } else {
                 Engine.spawnParticle(fighter.pos.add(new Vec3(fighter.facing*50, -50, 0)), '#888', 'text', 'MISS');
            }
            fighter.state = 'IDLE';
        }, 200);
        return true;
    }

    // SKILL 4: MANJI KICK (Counter)
    if (slot === 4) {
        if (fighter.cds.p > 0 || fighter.ce < 30) return true;
        fighter.ce -= 30;
        fighter.cds.p = fighter.maxCds.p;
        fighter.state = 'COUNTER_STANCE';
        fighter.manjiCounterWindow = 40; // 0.6 seconds active
        Engine.spawnParticle(fighter.pos, '#fff', 'text', 'STANCE');
        return true;
    }

    return false;
}

function triggerBlackFlash(fighter) {
    const isAuto = false;
    fighter.state = 'ATTACK'; 
    fighter.vel.x = fighter.facing * 25; // Lunge forward
    
    setTimeout(() => {
        const t = Engine.fighters.find(f => f !== fighter);
        if(t && fighter.pos.dist(t.pos) < 120) {
            // Visuals
            Engine.spawnLightning(t.pos, '#b91c1c'); 
            Engine.spawnLightning(t.pos.add(new Vec3(10,0,10)), '#000');
            Engine.screenShake = 30 + (fighter.bfChain * 10);
            
            // Invert colors momentarily
            const cvs = document.getElementById('gameCanvas'); 
            if(cvs) cvs.style.filter = 'invert(1)';
            setTimeout(() => { if(cvs) cvs.style.filter = 'none'; }, 100);
            
            // Damage Calculation (Power of 2.5 simulation via scaling)
            let dmg = 60 * (1 + (fighter.bfChain * 0.5)); 
            t.takeDamage(dmg, fighter);
            
            fighter.domainGauge = Math.min(100, fighter.domainGauge + 20);
            Engine.spawnParticle(t.pos.add(new Vec3(0,-100,0)), '#fff', 'text', 'BLACK FLASH x'+fighter.bfChain);
            
            // Extend window slightly for next chain
            fighter.bfWindow = 0;
            fighter.waitingForTiming = true;
        } else { 
            Engine.spawnParticle(fighter.pos, '#888', 'text', 'WHIFF'); 
            fighter.bfChain = 0; 
            fighter.waitingForTiming = false;
        }
        fighter.state = 'IDLE';
    }, 50);
}

export function drawYujiDomain(ctx, engine) {
    // HOMETOWN DOMAIN (Snowy Station Vibe)
    
    // Sky
    const grad = ctx.createLinearGradient(0, 0, 0, engine.height);
    grad.addColorStop(0, '#88ccff');
    grad.addColorStop(1, '#ddeeff');
    ctx.fillStyle = grad; 
    ctx.fillRect(0, 0, engine.width, engine.height);

    // Snow Ground
    ctx.fillStyle = '#fff';
    const floorY = engine.project(new Vec3(0, 300, 0)).y;
    ctx.fillRect(0, floorY, engine.width, engine.height - floorY);

    // Train Tracks / Station lines
    ctx.strokeStyle = '#555'; ctx.lineWidth = 4;
    const p1 = engine.project(new Vec3(-2000, 300, 0));
    const p2 = engine.project(new Vec3(2000, 300, 0));
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    
    // Falling Snow
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 100; i++) {
        const x = (Math.sin(Date.now()*0.0001 + i) * engine.width + engine.width/2) % engine.width;
        const y = (Date.now()*0.2 + i*50) % engine.height;
        ctx.fillRect(x, y, 3, 3);
    }

    // "Soul Station" Signs (Abstract)
    const signPos = engine.project(new Vec3(0, 100, -500));
    ctx.fillStyle = '#1a4'; 
    ctx.fillRect(signPos.x - 50*signPos.s, signPos.y, 100*signPos.s, 40*signPos.s);
}