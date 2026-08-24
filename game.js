// ========== ИНИЦИАЛИЗАЦИЯ ==========
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mapCanvas = document.getElementById('mapCanvas');
const mapCtx = mapCanvas.getContext('2d');
const minimap = document.getElementById('minimap');
const miniCtx = minimap.getContext('2d');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// ========== КОНСТАНТЫ ==========
const RARITY = {
    common: { name: 'Обычный', color: '#b0bec5', mult: 1 },
    rare: { name: 'Редкий', color: '#2196f3', mult: 1.5 },
    epic: { name: 'Эпический', color: '#9c27b0', mult: 2 },
    mythic: { name: 'Мифический', color: '#ff9800', mult: 2.5 },
    legendary: { name: 'Легендарный', color: '#ffd700', mult: 3 }
};

const WEAPONS = {
    pistol: { name: 'Пистолет', damage: 15, fireRate: 400, range: 300, ammo: '9mm', price: 0 },
    uzi: { name: 'Узи', damage: 10, fireRate: 100, range: 250, ammo: '9mm', price: 500 },
    shotgun: { name: 'Дробовик', damage: 40, fireRate: 800, range: 200, ammo: '12ga', price: 1200, pellets: 5 },
    ak47: { name: 'АК-47', damage: 30, fireRate: 250, range: 400, ammo: '7.62', price: 1500 },
    m4: { name: 'M4', damage: 25, fireRate: 150, range: 450, ammo: '5.56', price: 2500 },
    sniper: { name: 'Снайперка', damage: 80, fireRate: 1500, range: 600, ammo: '7.62', price: 5000 },
    minigun: { name: 'Пулемёт', damage: 15, fireRate: 50, range: 350, ammo: '5.56', price: 8000 },
    laser: { name: 'Лазер', damage: 20, fireRate: 80, range: 500, ammo: 'energy', price: 12000 },
    flamethrower: { name: 'Огнемёт', damage: 12, fireRate: 60, range: 200, ammo: 'fuel', price: 15000 }
};

const ARMORS = [
    { level: 1, name: 'Броня 1', price: 200, reduction: 5 },
    { level: 2, name: 'Броня 2', price: 500, reduction: 10 },
    { level: 3, name: 'Броня 3', price: 1200, reduction: 20 },
    { level: 4, name: 'Броня 4', price: 2500, reduction: 30 },
    { level: 5, name: 'Броня 5', price: 5000, reduction: 40 },
    { level: 6, name: 'Броня 6', price: 10000, reduction: 50 }
];
const HELMETS = [
    { level: 1, name: 'Шлем 1', price: 100, reduction: 5 },
    { level: 2, name: 'Шлем 2', price: 300, reduction: 10 },
    { level: 3, name: 'Шлем 3', price: 800, reduction: 15 },
    { level: 4, name: 'Шлем 4', price: 1500, reduction: 25 },
    { level: 5, name: 'Шлем 5', price: 3000, reduction: 35 },
    { level: 6, name: 'Шлем 6', price: 6000, reduction: 45 }
];
const BACKPACKS = [
    { level: 1, name: 'Рюкзак 1', price: 100, ammoBonus: 20, healthBonus: 1 },
    { level: 2, name: 'Рюкзак 2', price: 300, ammoBonus: 50, healthBonus: 2 },
    { level: 3, name: 'Рюкзак 3', price: 700, ammoBonus: 100, healthBonus: 3 },
    { level: 4, name: 'Рюкзак 4', price: 1500, ammoBonus: 200, healthBonus: 5 },
    { level: 5, name: 'Рюкзак 5', price: 3000, ammoBonus: 300, healthBonus: 7 },
    { level: 6, name: 'Рюкзак 6', price: 6000, ammoBonus: 500, healthBonus: 10 }
];

// ========== ИГРОК ==========
let player = {
    x: canvas.width/2, y: canvas.height/2,
    hp: 100, maxHp: 100,
    speed: 3,
    direction: 0,
    money: 0,
    xp: 0, level: 1, xpToNext: 100,
    armor: 0, helmet: 0, backpack: 0,
    ammo: 30, maxAmmo: 120,
    healthPacks: 2,
    weapon: { ...WEAPONS.pistol, rarity: 'common' },
    inventory: [],
    damageBonus: 0,
    speedBonus: 0,
    defenseBonus: 0,
    boostMult: 1,
    boostTimer: 0,
    boostName: ''
};

// ========== БОТЫ ==========
let bots = [];
function spawnBots(count) {
    for (let i = 0; i < count; i++) {
        const elite = Math.random() < 0.15;
        const boss = Math.random() < 0.03;
        const bot = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            hp: boss ? 300 : (elite ? 150 : 100),
            maxHp: boss ? 300 : (elite ? 150 : 100),
            damage: boss ? 25 : (elite ? 15 : 10),
            speed: boss ? 1.5 : (elite ? 2 : 1.5),
            range: boss ? 300 : (elite ? 250 : 200),
            direction: 0,
            lastShot: 0,
            fireRate: boss ? 600 : (elite ? 800 : 1000),
            isDead: false,
            elite: elite,
            boss: boss,
            color: boss ? '#8e24aa' : (elite ? '#ff9800' : '#e53935'),
            armor: boss ? 3 : 0,
            helmet: boss ? 2 : 0,
            weapon: boss ? WEAPONS.minigun : (elite ? WEAPONS.ak47 : WEAPONS.pistol)
        };
        bots.push(bot);
    }
}
spawnBots(7);

// ========== ЛУТБОКСЫ / СУНДУКИ ==========
let lootboxes = [];
let chests = [];
function spawnChests() {
    for (let i = 0; i < 10; i++) {
        chests.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            opened: false,
            rarity: ['common','rare','epic','mythic','legendary'][Math.floor(Math.random()*5)]
        });
    }
}
spawnChests();

// ========== УКРЫТИЯ ==========
let obstacles = [];
function generateObstacles() {
    for (let i = 0; i < 15; i++) {
        obstacles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            width: 40 + Math.random() * 60,
            height: 40 + Math.random() * 60,
            color: '#3e2723'
        });
    }
}
generateObstacles();

// ========== ЗОНА ==========
let zone = { x: canvas.width/2, y: canvas.height/2, radius: Math.max(canvas.width, canvas.height) };
let lastZoneShrink = Date.now();
let zoneShrinkInterval = 8000;
function updateZone() {
    const now = Date.now();
    if (now - lastZoneShrink > zoneShrinkInterval) {
        zone.radius -= 15;
        if (zone.radius < 80) zone.radius = 80;
        lastZoneShrink = now;
    }
    const dist = Math.sqrt((player.x - zone.x)**2 + (player.y - zone.y)**2);
    if (dist > zone.radius) {
        player.hp -= 3;
        document.getElementById('zoneWarning').style.display = 'block';
    } else {
        document.getElementById('zoneWarning').style.display = 'none';
    }
    if (player.hp <= 0) {
        player.hp = 100;
        alert('Ты погиб! Деньги сохраняются.');
        player.x = canvas.width/2;
        player.y = canvas.height/2;
        bots = bots.filter(b => b.isDead === false);
        spawnBots(7);
        document.getElementById('hpBar').innerText = `❤️ 100`;
    }
}

// ========== ТОЧКА ВЫХОДА ==========
let extraction = { x: 0, y: 0, radius: 40, active: true };

function generateExtraction() {
    // Размещаем точку выхода далеко от центра, в углу
    const side = Math.floor(Math.random() * 4);
    const margin = 100;
    switch(side) {
        case 0: // верх
            extraction.x = Math.random() * canvas.width;
            extraction.y = margin;
            break;
        case 1: // право
            extraction.x = canvas.width - margin;
            extraction.y = Math.random() * canvas.height;
            break;
        case 2: // низ
            extraction.x = Math.random() * canvas.width;
            extraction.y = canvas.height - margin;
            break;
        case 3: // лево
            extraction.x = margin;
            extraction.y = Math.random() * canvas.height;
            break;
    }
    extraction.active = true;
}
generateExtraction();

// ========== ПУЛИ ==========
let bullets = [];
function shoot(x, y, dir, owner, damage, range) {
    bullets.push({
        x, y, dir, speed: 8, damage, range, owner,
        color: owner === 'player' ? '#ffd700' : '#ff5252'
    });
}

// ========== ДЖОЙСТИК ==========
let joystickActive = false;
let joystickX = 0, joystickY = 0;
const joystick = document.getElementById('joystick');
const joystickKnob = document.getElementById('joystickKnob');

joystick.addEventListener('pointerdown', e => {
    joystickActive = true;
    updateJoystick(e);
});
joystick.addEventListener('pointermove', e => {
    if (joystickActive) updateJoystick(e);
});
joystick.addEventListener('pointerup', () => {
    joystickActive = false;
    joystickKnob.style.transform = 'translate(0,0)';
    joystickX = 0; joystickY = 0;
});

function updateJoystick(e) {
    const rect = joystick.getBoundingClientRect();
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const maxDist = rect.width/2 - 10;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > maxDist) {
        dx = (dx/dist) * maxDist;
        dy = (dy/dist) * maxDist;
    }
    joystickX = dx / maxDist;
    joystickY = dy / maxDist;
    joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
}

// ========== СТРЕЛЬБА ==========
let isFiring = false;
const fireBtn = document.getElementById('fireBtn');
fireBtn.addEventListener('pointerdown', () => { isFiring = true; });
fireBtn.addEventListener('pointerup', () => { isFiring = false; });

let lastShotTime = 0;
function tryShoot() {
    const now = Date.now();
    if (isFiring && now - lastShotTime > player.weapon.fireRate) {
        if (player.ammo <= 0) return;
        player.ammo--;
        lastShotTime = now;
        const muzzleX = player.x + Math.cos(player.direction) * 20;
        const muzzleY = player.y + Math.sin(player.direction) * 20;
        const dmg = player.weapon.damage * RARITY[player.weapon.rarity].mult * player.damageBonus * player.boostMult;
        shoot(muzzleX, muzzleY, player.direction, 'player', dmg, player.weapon.range);
        document.getElementById('ammoBar').innerText = `🔫 ${player.ammo}/${player.maxAmmo}`;
    }
}

let aimAngle = 0;
canvas.addEventListener('pointermove', e => {
    const rect = canvas.getBoundingClientRect();
    aimAngle = Math.atan2(e.clientY - rect.top - player.y, e.clientX - rect.left - player.x);
});

// ========== ЛУТ ==========
function generateLoot(rarity) {
    const mult = RARITY[rarity].mult;
    const itemType = Math.random();
    if (itemType < 0.4) {
        const weaponKeys = Object.keys(WEAPONS);
        const weaponKey = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
        const base = WEAPONS[weaponKey];
        return {
            type: 'weapon', key: weaponKey, rarity: rarity,
            name: `${RARITY[rarity].name} ${base.name}`,
            damage: Math.floor(base.damage * mult),
            fireRate: Math.floor(base.fireRate / mult),
            range: Math.floor(base.range * mult),
            ammo: base.ammo,
            price: Math.floor(base.price * mult) || 100
        };
    } else if (itemType < 0.7) {
        const armor = ARMORS[Math.floor(Math.random() * ARMORS.length)];
        return { type: 'armor', level: armor.level, rarity: rarity, name: `${RARITY[rarity].name} ${armor.name}`, reduction: Math.floor(armor.reduction * mult), price: Math.floor(armor.price * mult) };
    } else if (itemType < 0.9) {
        const helmet = HELMETS[Math.floor(Math.random() * HELMETS.length)];
        return { type: 'helmet', level: helmet.level, rarity: rarity, name: `${RARITY[rarity].name} ${helmet.name}`, reduction: Math.floor(helmet.reduction * mult), price: Math.floor(helmet.price * mult) };
    } else {
        return { type: 'ammo', rarity: rarity, name: `${RARITY[rarity].name} Патроны`, amount: Math.floor(30 * mult), price: Math.floor(50 * mult) };
    }
}

function openLootbox(lb) {
    const loot = generateLoot(lb.rarity);
    player.inventory.push(loot);
    lb.opened = true;
    lootboxes = lootboxes.filter(b => !b.opened);
    alert(`Лут: ${loot.name}`);
}

function openChest(ch) {
    const loot = generateLoot(ch.rarity);
    player.inventory.push(loot);
    ch.opened = true;
    chests = chests.filter(c => !c.opened);
    alert(`Сундук: ${loot.name}`);
}

function tryLoot() {
    for (let i = 0; i < lootboxes.length; i++) {
        const lb = lootboxes[i];
        const dist = Math.sqrt((player.x - lb.x)**2 + (player.y - lb.y)**2);
        if (dist < 30 && !lb.opened) openLootbox(lb);
    }
    for (let i = 0; i < chests.length; i++) {
        const ch = chests[i];
        const dist = Math.sqrt((player.x - ch.x)**2 + (player.y - ch.y)**2);
        if (dist < 30 && !ch.opened) openChest(ch);
    }
}

// ========== ОБНОВЛЕНИЕ ==========
function update() {
    player.x += joystickX * player.speed * (1 + player.speedBonus * 0.1);
    player.y += joystickY * player.speed * (1 + player.speedBonus * 0.1);
    player.x = Math.max(20, Math.min(canvas.width-20, player.x));
    player.y = Math.max(20, Math.min(canvas.height-20, player.y));
    player.direction = aimAngle;
    tryShoot();
    tryLoot();
    updateZone();
    
    // Проверка точки выхода
    const distToExtract = Math.sqrt((player.x - extraction.x)**2 + (player.y - extraction.y)**2);
    if (distToExtract < extraction.radius && extraction.active) {
        document.getElementById('extractBtn').style.display = 'block';
    } else {
        document.getElementById('extractBtn').style.display = 'none';
    }
    
    // Бусты
    if (player.boostTimer > 0) {
        player.boostTimer--;
        if (player.boostTimer === 0) {
            player.boostMult = 1;
            document.getElementById('boostIndicator').style.display = 'none';
        }
    }
    
    // Пули
    bullets.forEach((bullet, index) => {
        bullet.x += Math.cos(bullet.dir) * bullet.speed;
        bullet.y += Math.sin(bullet.dir) * bullet.speed;
        bullet.range -= bullet.speed;
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height || bullet.range <= 0) {
            bullets.splice(index, 1);
            return;
        }
        if (bullet.owner === 'player') {
            bots.forEach((bot, bi) => {
                if (!bot.isDead) {
                    const dist = Math.sqrt((bullet.x - bot.x)**2 + (bullet.y - bot.y)**2);
                    if (dist < 20) {
                        let dmg = bullet.damage;
                        if (bot.armor) dmg *= (100 - ARMORS[bot.armor-1].reduction) / 100;
                        if (bot.helmet) dmg *= (100 - HELMETS[bot.helmet-1].reduction) / 100;
                        bot.hp -= dmg;
                        bullets.splice(index, 1);
                        if (bot.hp <= 0) {
                            bot.isDead = true;
                            const rarity = bot.boss ? 'legendary' : (bot.elite ? ['rare','epic','mythic'][Math.floor(Math.random()*3)] : ['common','rare'][Math.floor(Math.random()*2)]);
                            lootboxes.push({ x: bot.x, y: bot.y, rarity: rarity, opened: false });
                            player.money += bot.boss ? 500 : (bot.elite ? 300 : 100);
                            player.xp += bot.boss ? 50 : (bot.elite ? 30 : 10);
                            document.getElementById('money').innerText = `💰 ${player.money}`;
                            checkLevelUp();
                        }
                    }
                }
            });
        }
        if (bullet.owner === 'bot') {
            const dist = Math.sqrt((bullet.x - player.x)**2 + (bullet.y - player.y)**2);
            if (dist < 25) {
                let dmg = bullet.damage;
                if (player.armor > 0) dmg *= (100 - ARMORS[player.armor-1].reduction) / 100;
                if (player.helmet > 0) dmg *= (100 - HELMETS[player.helmet-1].reduction) / 100;
                dmg *= (100 - player.defenseBonus) / 100;
                player.hp -= dmg;
                bullets.splice(index, 1);
                document.getElementById('hpBar').innerText = `❤️ ${Math.max(0, Math.floor(player.hp))}`;
            }
        }
    });
    
    // Боты ИИ
    bots.forEach(bot => {
        if (!bot.isDead) {
            const dx = player.x - bot.x;
            const dy = player.y - bot.y;
            bot.direction = Math.atan2(dy, dx);
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > 150) {
                bot.x += Math.cos(bot.direction) * bot.speed;
                bot.y += Math.sin(bot.direction) * bot.speed;
            }
            if (dist < bot.range) {
                const now = Date.now();
                if (now - bot.lastShot > bot.fireRate) {
                    bot.lastShot = now;
                    const dmg = bot.weapon ? bot.weapon.damage : bot.damage;
                    shoot(bot.x, bot.y, bot.direction, 'bot', dmg, 300);
                }
            }
            bot.x = Math.max(20, Math.min(canvas.width-20, bot.x));
            bot.y = Math.max(20, Math.min(canvas.height-20, bot.y));
        }
    });
}

// ========== РЕНДЕР ==========
function draw() {
    ctx.fillStyle = '#1a1f2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    // Укрытия
    obstacles.forEach(ob => {
        ctx.fillStyle = ob.color;
        ctx.fillRect(ob.x, ob.y, ob.width, ob.height);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(ob.x, ob.y, ob.width, ob.height);
    });
    // Зона
    ctx.strokeStyle = 'rgba(33,150,243,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI*2);
    ctx.stroke();
    // Точка выхода
    if (extraction.active) {
        ctx.fillStyle = '#4caf50';
        ctx.beginPath();
        ctx.arc(extraction.x, extraction.y, 20, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ВЫХОД', extraction.x, extraction.y - 25);
    }
    // Сундуки
    chests.forEach(ch => {
        if (!ch.opened) {
            ctx.fillStyle = RARITY[ch.rarity].color;
            ctx.fillRect(ch.x - 10, ch.y - 10, 20, 20);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(ch.x - 10, ch.y - 10, 20, 20);
        }
    });
    // Лутбоксы
    lootboxes.forEach(lb => {
        ctx.fillStyle = RARITY[lb.rarity].color;
        ctx.beginPath();
        ctx.arc(lb.x, lb.y, 8, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();
    });
    // Боты
    bots.forEach(bot => {
        if (!bot.isDead) {
            ctx.fillStyle = bot.color;
            ctx.beginPath();
            ctx.arc(bot.x, bot.y, 15, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(bot.x-15, bot.y-25, 30, 5);
            ctx.fillStyle = '#4caf50';
            ctx.fillRect(bot.x-15, bot.y-25, 30*(bot.hp/bot.maxHp), 5);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(bot.x, bot.y);
            ctx.lineTo(bot.x + Math.cos(bot.direction)*15, bot.y + Math.sin(bot.direction)*15);
            ctx.stroke();
        }
    });
    // Игрок
    ctx.fillStyle = '#2196f3';
    ctx.beginPath();
    ctx.arc(player.x, player.y, 20, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = player.weapon.color || '#fff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + Math.cos(player.direction)*25, player.y + Math.sin(player.direction)*25);
    ctx.stroke();
    // Пули
    bullets.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI*2);
        ctx.fill();
    });
}

// ========== МИНИКАРТА ==========
function drawMinimap() {
    miniCtx.clearRect(0,0,140,140);
    miniCtx.fillStyle = 'rgba(0,0,0,0.6)';
    miniCtx.fillRect(0,0,140,140);
    const scale = 140 / Math.max(canvas.width, canvas.height);
    // Укрытия
    miniCtx.fillStyle = '#3e2723';
    obstacles.forEach(ob => {
        miniCtx.fillRect(ob.x * scale, ob.y * scale, ob.width * scale, ob.height * scale);
    });
    // Точка выхода
    miniCtx.fillStyle = '#4caf50';
    miniCtx.beginPath();
    miniCtx.arc(extraction.x * scale, extraction.y * scale, 4, 0, Math.PI*2);
    miniCtx.fill();
    // Игрок
    miniCtx.fillStyle = '#2196f3';
    miniCtx.beginPath();
    miniCtx.arc(player.x * scale, player.y * scale, 3, 0, Math.PI*2);
    miniCtx.fill();
    // Боты
    bots.forEach(bot => {
        if (!bot.isDead) {
            miniCtx.fillStyle = bot.color;
            miniCtx.beginPath();
            miniCtx.arc(bot.x * scale, bot.y * scale, 2, 0, Math.PI*2);
            miniCtx.fill();
        }
    });
    // Зона
    miniCtx.strokeStyle = '#2196f3';
    miniCtx.beginPath();
    miniCtx.arc(zone.x * scale, zone.y * scale, zone.radius * scale, 0, Math.PI*2);
    miniCtx.stroke();
}

// ========== БОЛЬШАЯ КАРТА ==========
function openMap() {
    document.getElementById('mapModal').style.display = 'flex';
    drawFullMap();
}

function closeMap() {
    document.getElementById('mapModal').style.display = 'none';
}

function drawFullMap() {
    mapCtx.clearRect(0,0,mapCanvas.width,mapCanvas.height);
    mapCtx.fillStyle = '#1a1f2a';
    mapCtx.fillRect(0,0,mapCanvas.width,mapCanvas.height);
    const scale = mapCanvas.width / Math.max(canvas.width, canvas.height);
    // Укрытия
    obstacles.forEach(ob => {
        mapCtx.fillStyle = ob.color;
        mapCtx.fillRect(ob.x * scale, ob.y * scale, ob.width * scale, ob.height * scale);
    });
    // Точка выхода
    mapCtx.fillStyle = '#4caf50';
    mapCtx.beginPath();
    mapCtx.arc(extraction.x * scale, extraction.y * scale, 8, 0, Math.PI*2);
    mapCtx.fill();
    mapCtx.fillStyle = '#fff';
    mapCtx.font = 'bold 12px Arial';
    mapCtx.textAlign = 'center';
    mapCtx.fillText('ВЫХОД', extraction.x * scale, extraction.y * scale - 12);
    // Боссы и элитные
    bots.forEach(bot => {
        if (!bot.isDead) {
            mapCtx.fillStyle = bot.color;
            mapCtx.beginPath();
            mapCtx.arc(bot.x * scale, bot.y * scale, bot.boss ? 6 : 3, 0, Math.PI*2);
            mapCtx.fill();
            if (bot.boss) {
                mapCtx.fillStyle = '#fff';
                mapCtx.font = 'bold 10px Arial';
                mapCtx.fillText('БОСС', bot.x * scale, bot.y * scale - 8);
            }
        }
    });
    // Игрок
    mapCtx.fillStyle = '#2196f3';
    mapCtx.beginPath();
    mapCtx.arc(player.x * scale, player.y * scale, 5, 0, Math.PI*2);
    mapCtx.fill();
    // Зона
    mapCtx.strokeStyle = 'rgba(33,150,243,0.7)';
    mapCtx.lineWidth = 2;
    mapCtx.beginPath();
    mapCtx.arc(zone.x * scale, zone.y * scale, zone.radius * scale, 0, Math.PI*2);
    mapCtx.stroke();
}

// ========== ВЫХОД С КАРТЫ ==========
function extract() {
    if (!extraction.active) return;
    // Расчёт наград за выход
    const lootValue = player.inventory.reduce((sum, item) => sum + (item.price || 0), 0);
    const survivalBonus = Math.floor(player.hp) * 5;
    const totalMoney = player.money + lootValue + survivalBonus;
    const totalXP = player.xp + 50;
    
    alert(`Выход с катки!\n💰 Деньги: ${totalMoney}\n✨ Опыт: ${totalXP}`);
    
    // Сохраняем прогресс
    player.money = totalMoney;
    player.xp = totalXP;
    player.inventory = [];
    player.healthPacks = 2;
    player.hp = 100;
    
    // Сброс карты
    bots = [];
    spawnBots(7);
    chests = [];
    spawnChests();
    lootboxes = [];
    generateExtraction();
    zone = { x: canvas.width/2, y: canvas.height/2, radius: Math.max(canvas.width, canvas.height) };
    lastZoneShrink = Date.now();
    
    // Обновляем интерфейс
    document.getElementById('money').innerText = `💰 ${player.money}`;
    document.getElementById('lootBar').innerText = `🎒 ${player.inventory.length}`;
    document.getElementById('extractBtn').style.display = 'none';
    checkLevelUp();
}

// ========== УРОВНИ ==========
function checkLevelUp() {
    while (player.xp >= player.xpToNext) {
        player.xp -= player.xpToNext;
        player.level++;
        player.xpToNext = Math.floor(player.xpToNext * 1.5);
        player.maxHp += 10;
        player.hp = player.maxHp;
        player.damageBonus += 0.05;
        player.speedBonus += 0.02;
        player.defenseBonus += 0.02;
        alert(`Уровень повышен! Новый уровень: ${player.level}`);
    }
    document.getElementById('levelBar').innerText = `⭐ Уровень ${player.level}`;
    document.getElementById('xpBar').innerText = `✨ ${player.xp}/${player.xpToNext}`;
}

// ========== МАГАЗИН / ИНВЕНТАРЬ ==========
function switchTab(tab) {
    document.getElementById('tabShop').classList.toggle('active', tab === 'shop');
    document.getElementById('tabInv').classList.toggle('active', tab === 'inv');
    document.getElementById('tabQuests').classList.toggle('active', tab === 'quests');
    document.getElementById('shopItems').style.display = tab === 'shop' ? 'block' : 'none';
    document.getElementById('invItems').style.display = tab === 'inv' ? 'block' : 'none';
    document.getElementById('questItems').style.display = tab === 'quests' ? 'block' : 'none';
    if (tab === 'shop') renderShop();
    else if (tab === 'inv') renderInventory();
    else renderQuests();
}

function renderShop() {
    const el = document.getElementById('shopItems');
    let html = '';
    for (const key in WEAPONS) {
        const w = WEAPONS[key];
        if (w.price > 0) {
            html += `<div class="item">${w.name} (${w.damage} урон) — $${w.price} <button onclick="buyWeapon('${key}')">Купить</button></div>`;
        }
    }
    ARMORS.forEach((a, i) => {
        html += `<div class="item">${a.name} (${a.reduction}% защиты) — $${a.price} <button onclick="buyArmor(${i+1})">Купить</button></div>`;
    });
    HELMETS.forEach((h, i) => {
        html += `<div class="item">${h.name} (${h.reduction}% защиты) — $${h.price} <button onclick="buyHelmet(${i+1})">Купить</button></div>`;
    });
    BACKPACKS.forEach((b, i) => {
        html += `<div class="item">${b.name} (+${b.ammoBonus} патронов) — $${b.price} <button onclick="buyBackpack(${i+1})">Купить</button></div>`;
    });
    html += `<div class="item">Патроны (30) — $50 <button onclick="buyAmmo()">Купить</button></div>`;
    html += `<div class="item">Аптечка (+50 HP) — $100 <button onclick="buyHealthPack()">Купить</button></div>`;
    html += `<div class="item">Буст урона x2 (30 сек) — $500 <button onclick="buyBoost()">Купить</button></div>`;
    el.innerHTML = html;
}

function buyWeapon(key) {
    const w = WEAPONS[key];
    if (player.money < w.price) { alert('Недостаточно денег'); return; }
    player.money -= w.price;
    player.weapon = { ...w, rarity: 'common' };
    player.maxAmmo = w.ammo === '9mm' ? 120 : 90;
    player.ammo = player.maxAmmo;
    document.getElementById('money').innerText = `💰 ${player.money}`;
    renderShop();
}

function buyArmor(level) {
    const a = ARMORS[level-1];
    if (player.money < a.price) { alert('Недостаточно денег'); return; }
    player.money -= a.price;
    player.armor = level;
    document.getElementById('money').innerText = `💰 ${player.money}`;
    renderShop();
}

function buyHelmet(level) {
    const h = HELMETS[level-1];
    if (player.money < h.price) { alert('Недостаточно денег'); return; }
    player.money -= h.price;
    player.helmet = level;
    document.getElementById('money').innerText = `💰 ${player.money}`;
    renderShop();
}

function buyBackpack(level) {
    const b = BACKPACKS[level-1];
    if (player.money < b.price) { alert('Недостаточно денег'); return; }
    player.money -= b.price;
    player.backpack = level;
    player.maxAmmo = 120 + b.ammoBonus;
    player.healthPacks += b.healthBonus;
    document.getElementById('money').innerText = `💰 ${player.money}`;
    renderShop();
}

function buyAmmo() {
    if (player.money < 50) { alert('Недостаточно денег'); return; }
    player.money -= 50;
    player.ammo = Math.min(player.maxAmmo, player.ammo + 30);
    document.getElementById('money').innerText = `💰 ${player.money}`;
    document.getElementById('ammoBar').innerText = `🔫 ${player.ammo}/${player.maxAmmo}`;
    renderShop();
}

function buyHealthPack() {
    if (player.money < 100) { alert('Недостаточно денег'); return; }
    player.money -= 100;
    player.healthPacks++;
    document.getElementById('money').innerText = `💰 ${player.money}`;
    renderShop();
}

function buyBoost() {
    if (player.money < 500) { alert('Недостаточно денег'); return; }
    player.money -= 500;
    player.boostMult = 2;
    player.boostTimer = 30;
    document.getElementById('boostIndicator').style.display = 'block';
    document.getElementById('money').innerText = `💰 ${player.money}`;
    renderShop();
}

function renderInventory() {
    const el = document.getElementById('invItems');
    let html = '';
    if (player.inventory.length === 0) html = '<p>Пусто</p>';
    player.inventory.forEach((item, i) => {
        html += `<div class="item rarity-${item.rarity}">${item.name} <button onclick="equipItem(${i})">Надеть</button> <button class="sell" onclick="sellItem(${i})">Продать</button></div>`;
    });
    html += `<hr><h4>Текущее снаряжение:</h4>`;
    html += `<div>Оружие: ${player.weapon.name} (${player.weapon.rarity})</div>`;
    html += `<div>Броня: ${player.armor > 0 ? ARMORS[player.armor-1].name : 'Нет'}</div>`;
    html += `<div>Шлем: ${player.helmet > 0 ? HELMETS[player.helmet-1].name : 'Нет'}</div>`;
    html += `<div>Рюкзак: ${player.backpack > 0 ? BACKPACKS[player.backpack-1].name : 'Нет'}</div>`;
    html += `<div>Аптечки: ${player.healthPacks}</div>`;
    el.innerHTML = html;
}

function equipItem(index) {
    const item = player.inventory[index];
    if (item.type === 'weapon') {
        player.weapon = { ...WEAPONS[item.key], rarity: item.rarity, damage: item.damage, fireRate: item.fireRate, range: item.range };
        player.maxAmmo = item.ammo === '9mm' ? 120 : 90 + (player.backpack > 0 ? BACKPACKS[player.backpack-1].ammoBonus : 0);
        player.ammo = player.maxAmmo;
    } else if (item.type === 'armor') {
        player.armor = item.level;
    } else if (item.type === 'helmet') {
        player.helmet = item.level;
    }
    player.inventory.splice(index, 1);
    renderInventory();
    updateUI();
}

function sellItem(index) {
    const item = player.inventory[index];
    player.money += item.price || 50;
    player.inventory.splice(index, 1);
    document.getElementById('money').innerText = `💰 ${player.money}`;
    renderInventory();
}

function toggleShop() {
    const modal = document.getElementById('shopModal');
    if (modal.style.display === 'flex') {
        modal.style.display = 'none';
    } else {
        modal.style.display = 'flex';
        switchTab('shop');
    }
}

// ========== ЗАДАНИЯ ==========
let quests = {
    kills: 0, needKills: 5,
    loot: 0, needLoot: 3,
    extract: 0, needExtract: 1
};

function renderQuests() {
    const el = document.getElementById('questItems');
    let html = `<div class="item">Убить ботов: ${quests.kills}/${quests.needKills} <button onclick="claimQuest('kills')">Награда</button></div>`;
    html += `<div class="item">Собрать лут: ${quests.loot}/${quests.needLoot} <button onclick="claimQuest('loot')">Награда</button></div>`;
    html += `<div class="item">Выйти с катки: ${quests.extract}/${quests.needExtract} <button onclick="claimQuest('extract')">Награда</button></div>`;
    el.innerHTML = html;
}

function claimQuest(type) {
    const rewards = { kills: 500, loot: 300, extract: 1000 };
    if (type === 'kills' && quests.kills >= quests.needKills) {
        player.money += rewards.kills;
        quests.kills = 0;
        alert('Задание выполнено! +500 денег');
    } else if (type === 'loot' && quests.loot >= quests.needLoot) {
        player.money += rewards.loot;
        quests.loot = 0;
        alert('Задание выполнено! +300 денег');
    } else if (type === 'extract' && quests.extract >= quests.needExtract) {
        player.money += rewards.extract;
        quests.extract = 0;
        alert('Задание выполнено! +1000 денег');
    }
    document.getElementById('money').innerText = `💰 ${player.money}`;
    renderQuests();
}

// ========== ОБНОВЛЕНИЕ HUD ==========
function updateUI() {
    document.getElementById('hpBar').innerText = `❤️ ${Math.max(0, Math.floor(player.hp))}`;
    document.getElementById('ammoBar').innerText = `🔫 ${player.ammo}/${player.maxAmmo}`;
    document.getElementById('money').innerText = `💰 ${player.money}`;
    document.getElementById('lootBar').innerText = `🎒 ${player.inventory.length}`;
    document.getElementById('levelBar').innerText = `⭐ Уровень ${player.level}`;
    document.getElementById('xpBar').innerText = `✨ ${player.xp}/${player.xpToNext}`;
}

// ========== ГЛАВНЫЙ ЦИКЛ ==========
let lastTime = 0;
function gameLoop(time) {
    const dt = time - lastTime;
    lastTime = time;
    
    update();
    draw();
    drawMinimap();
    updateUI();
    
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
