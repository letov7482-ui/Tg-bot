// ========== СОСТОЯНИЕ ==========
let state = {
    LC: 1000,
    QC: 0,
    energy: 100,
    maxEnergy: 100,
    tapValue: 15,
    profitPerHour: 0,
    critChance: 0.1,
    multiplier: 1,
    multiplierTimer: 0,
    robots: 0,
    farmLevel: 0,
    factoryLevel: 0,
    bankLevel: 0,
    neonFactoryLevel: 0,
    skins: { hat: false, glasses: false, chain: false },
    missions: { taps: 0, casinoWins: 0 },
    dailyWheel: 0,
    lastVisit: Date.now(),
    jackpot: 1000,
    passiveMultiplier: 1,
    soundOn: true,
    vibroOn: true,
    prestige: 0,
    lastAirdrop: 0,
    comboDone: false,
    achievements: [],
    dailyStreak: 0,
    lastDailyClaim: 0,
    level: 1,
    levelProgress: 0,
    tapUpgrade: 0,
    energyUpgrade: 0,
    critUpgrade: 0,
    passiveUpgrade: 0,
    bossHP: 100000,
    bossKilled: false,
    cards: [],
    cardBonus: 0,
    auctionItem: null,
    auctionTimer: 0,
    referralCode: '',
    referred: false,
    leaderboardBest: 0,
};

// ========== СОХРАНЕНИЕ ==========
function saveGame() {
    localStorage.setItem('neonHamster', JSON.stringify(state));
}

function loadGame() {
    const saved = localStorage.getItem('neonHamster');
    if (saved) {
        Object.assign(state, JSON.parse(saved));
    }
    const now = Date.now();
    const elapsed = Math.min(2 * 3600 * 1000, now - state.lastVisit);
    const offlineIncome = (state.robots * 20 + state.farmLevel * 50 + state.factoryLevel * 100 + state.bankLevel * 150 + state.neonFactoryLevel * 300) * (elapsed / 3600000);
    if (offlineIncome > 0) {
        state.LC += offlineIncome;
        showOfflineReward(offlineIncome);
    }
    state.lastVisit = now;
    calculateProfitPerHour();
    checkAchievements();
    if (now - state.lastDailyClaim > 86400000) {
        // Можно претендовать
    }
    if (now - state.lastAirdrop > 1800000) {
        alert('Аирдроп! +10,000 LC');
        state.LC += 10000;
        state.lastAirdrop = now;
        saveGame();
    }
    calculateLevel();
    generateDailyBoss();
    generateAuction();
}

function showOfflineReward(amount) {
    const el = document.getElementById('offline-reward');
    el.textContent = `Оффлайн: +${Math.floor(amount)} LC`;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 5000);
}

// ========== УРОВЕНЬ ==========
function calculateLevel() {
    const xpNeeded = 100 * (state.level + 1);
    if (state.levelProgress >= xpNeeded) {
        state.level++;
        state.levelProgress -= xpNeeded;
        state.maxEnergy += 10;
        state.tapValue += 2;
        alert('Хомяк вырос! Уровень ' + state.level);
    }
    document.getElementById('hamsterLevel').innerText = 'Уровень ' + state.level;
}

// ========== ДОСТИЖЕНИЯ ==========
function checkAchievements() {
    const achievements = [
        { id: 'tap100', name: '100 тапов', condition: state.missions.taps >= 100, reward: 1000 },
        { id: 'casino10', name: '10 побед в казино', condition: state.missions.casinoWins >= 10, reward: 5000 },
        { id: 'rich', name: 'Накопи 1M', condition: state.LC >= 1000000, reward: 10000 },
        { id: 'lvl5', name: 'Достигни 5 уровня', condition: state.level >= 5, reward: 20000 },
        { id: 'boss', name: 'Победи босса', condition: state.bossKilled, reward: 50000 },
    ];
    achievements.forEach(ach => {
        if (ach.condition && !state.achievements.includes(ach.id)) {
            state.achievements.push(ach.id);
            state.LC += ach.reward;
            alert('Достижение: ' + ach.name + '! +' + ach.reward + ' LC');
        }
    });
}

// ========== ПРИБЫЛЬ ==========
function calculateProfitPerHour() {
    state.profitPerHour = (state.robots * 100 + state.farmLevel * 250 + state.factoryLevel * 500 + state.bankLevel * 1000 + state.neonFactoryLevel * 2000 + state.level * 10) * (1 + state.prestige * 0.1) * (1 + state.cardBonus);
    document.getElementById('profit').innerText = '+' + Math.floor(state.profitPerHour).toLocaleString('ru-RU');
}

function updateUI() {
    document.getElementById('coinCount').innerText = Math.floor(state.LC).toLocaleString('ru-RU');
    document.getElementById('energyCount').innerText = `${Math.floor(state.energy)} / ${state.maxEnergy}`;
    document.getElementById('energyFill').style.width = (state.energy / state.maxEnergy * 100) + '%';
    calculateProfitPerHour();
    updateAvatar();
}

function updateAvatar() {
    let outfit = '';
    if (state.skins.hat) outfit += '🎩';
    if (state.skins.glasses) outfit += '🕶️';
    if (state.skins.chain) outfit += '⛓️';
    document.getElementById('avatar').innerText = outfit + '🐹';
}

// ========== ТАП ==========
function tap(e) {
    if (state.energy <= 0) return;
    state.energy -= 1;
    let gain = (state.tapValue + state.tapUpgrade * 5 + state.level * 2) * state.multiplier * state.passiveMultiplier * (1 + state.prestige * 0.1);
    if (Math.random() < state.critChance + state.critUpgrade * 0.01) {
        gain *= 10;
        playSound('crit');
        if (state.vibroOn) navigator.vibrate(100);
    } else {
        playSound('tap');
        if (state.vibroOn) navigator.vibrate(30);
    }
    state.LC += gain;
    state.missions.taps++;
    state.levelProgress += 1;
    calculateLevel();

    const ring = document.getElementById('hamster');
    ring.style.transform = 'scale(1.08)';
    setTimeout(() => ring.style.transform = 'scale(1)', 150);

    const rect = ring.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const floating = document.createElement('div');
    floating.className = 'floating-text';
    floating.innerText = '+' + Math.floor(gain);
    floating.style.left = (x - 20) + 'px';
    floating.style.top = (y - 40) + 'px';
    ring.appendChild(floating);
    setTimeout(() => floating.remove(), 800);

    updateUI();
    saveGame();
}

// ========== КАЗИНО ==========
function openCasino() { document.getElementById('casinoModal').style.display = 'flex'; document.getElementById('casino-result').textContent = ''; }

function spinSlot() {
    if (state.LC < 100) { alert('Мало денег!'); return; }
    state.LC -= 100;
    state.jackpot += 10;
    const symbols = ['🍒', '💎', '7️⃣', '🐹'];
    const reels = [symbols[Math.floor(Math.random()*4)], symbols[Math.floor(Math.random()*4)], symbols[Math.floor(Math.random()*4)]];
    document.getElementById('slot-machine').textContent = reels.join(' ');
    const res = document.getElementById('casino-result');
    if (reels[0] === '🐹' && reels[1] === '🐹' && reels[2] === '🐹') {
        state.LC += state.jackpot; state.QC += 10;
        res.innerHTML = `<span style="color:#ffd700;">ДЖЕКПОТ! +${state.jackpot} LC</span>`;
        state.jackpot = 1000; state.missions.casinoWins++; playSound('win');
    } else if (reels[0] === reels[1] && reels[1] === reels[2]) {
        state.LC += 1000; res.innerHTML = '<span style="color:#4caf50;">Выигрыш 1000 LC</span>';
        state.missions.casinoWins++; playSound('win');
    } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
        state.LC += 200; res.innerHTML = '<span style="color:#4caf50;">Выигрыш 200 LC</span>';
        state.missions.casinoWins++; playSound('win');
    } else {
        res.innerHTML = '<span style="color:#f44336;">Проигрыш</span>'; playSound('lose');
    }
    updateUI(); saveGame();
}

// ========== КОЛЕСО ==========
function openWheel() { document.getElementById('wheelModal').style.display = 'flex'; drawWheel(); }

function drawWheel() {
    const svg = document.getElementById('wheelSvg');
    let html = '';
    const segments = [
        { text: '+100', color: '#ffd700' }, { text: '+500', color: '#ff9800' },
        { text: '+5 QC', color: '#4caf50' }, { text: 'x2', color: '#2196f3' },
        { text: '+1000', color: '#9c27b0' }, { text: '+2 QC', color: '#00bcd4' },
        { text: 'x3', color: '#f44336' }, { text: '+2000', color: '#ff5722' }
    ];
    const angle = 360 / segments.length;
    for (let i = 0; i < segments.length; i++) {
        let start = (i * angle) - 90;
        let end = start + angle;
        let x1 = 100 + 100 * Math.cos(start * Math.PI / 180);
        let y1 = 100 + 100 * Math.sin(start * Math.PI / 180);
        let x2 = 100 + 100 * Math.cos(end * Math.PI / 180);
        let y2 = 100 + 100 * Math.sin(end * Math.PI / 180);
        html += `<path d="M100,100 L${x1},${y1} A100,100 0 0,1 ${x2},${y2} Z" fill="${segments[i].color}" stroke="#000" stroke-width="2"/>`;
        html += `<text x="100" y="100" fill="#fff" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="middle" transform="rotate(${start + angle/2}, 100, 100) translate(0, -60)">${segments[i].text}</text>`;
    }
    svg.innerHTML = html;
    svg.style.transform = 'rotate(0deg)';
}

function spinWheel() {
    const now = Date.now();
    if (now - state.dailyWheel < 24 * 3600 * 1000) { alert('Колесо будет доступно через ' + Math.ceil((24*3600*1000 - (now - state.dailyWheel))/3600000) + ' ч'); return; }
    state.dailyWheel = now;
    const svg = document.getElementById('wheelSvg');
    const result = document.getElementById('wheel-result');
    const randomIndex = Math.floor(Math.random() * 8);
    const angleToStop = 360 * 5 + (360 - (randomIndex * 45));
    svg.style.transition = 'transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)';
    svg.style.transform = `rotate(${angleToStop}deg)`;
    setTimeout(() => {
        const prizes = [
            { type: 'LC', amount: 100 }, { type: 'LC', amount: 500 },
            { type: 'QC', amount: 5 }, { type: 'MULT', amount: 2 },
            { type: 'LC', amount: 1000 }, { type: 'QC', amount: 2 },
            { type: 'MULT', amount: 3 }, { type: 'LC', amount: 2000 }
        ];
        const prize = prizes[randomIndex];
        if (prize.type === 'LC') { state.LC += prize.amount; result.innerHTML = `🎉 +${prize.amount} LC`; }
        else if (prize.type === 'QC') { state.QC += prize.amount; result.innerHTML = `🎉 +${prize.amount} QC`; }
        else { state.multiplierTimer = 600; state.multiplier = prize.amount; result.innerHTML = `🎉 Множитель x${prize.amount} на 10 минут!`; }
        updateUI(); saveGame(); playSound('win');
    }, 4000);
}

// ========== МАГАЗИН ==========
function openShop() { document.getElementById('shopModal').style.display = 'flex'; renderShop(); }

function renderShop() {
    const c = document.getElementById('shop-items');
    let html = '';
    // Улучшения тапа
    const tapCost = 500 * (state.tapUpgrade + 1);
    html += `<div class="item">Тап-урон +5 (${tapCost} LC) <button onclick="buyTapUpgrade()">Купить</button></div>`;
    // Улучшения энергии
    const energyCost = 300 * (state.energyUpgrade + 1);
    html += `<div class="item">Макс. энергия +10 (${energyCost} LC) <button onclick="buyEnergyUpgrade()">Купить</button></div>`;
    // Улучшения крита
    const critCost = 1000 * (state.critUpgrade + 1);
    html += `<div class="item">Шанс крита +1% (${critCost} LC) <button onclick="buyCritUpgrade()">Купить</button></div>`;
    // Улучшения пассивки
    const passiveCost = 2000 * (state.passiveUpgrade + 1);
    html += `<div class="item">Пассивный доход +2% (${passiveCost} LC) <button onclick="buyPassiveUpgrade()">Купить</button></div>`;
    // Скины
    if (!state.skins.hat) html += `<div class="item">Шляпа (1000 LC) <button onclick="buySkin('hat')">Купить</button></div>`;
    if (!state.skins.glasses) html += `<div class="item">Очки (2000 LC) <button onclick="buySkin('glasses')">Купить</button></div>`;
    if (!state.skins.chain) html += `<div class="item">Цепь (5000 LC) <button onclick="buySkin('chain')">Купить</button></div>`;
    // Роботы
    if (state.robots < 3) { const costs = [1000, 5000, 20000]; html += `<div class="item">Робот ур.${state.robots+1} (${costs[state.robots]} LC) <button onclick="buyRobot()">Купить</button></div>`; }
    if (state.farmLevel < 5) { const cost = 2000 * (state.farmLevel + 1); html += `<div class="item">Ферма ур.${state.farmLevel+1} (${cost} LC) <button onclick="buyFarm()">Купить</button></div>`; }
    if (state.factoryLevel < 5) { const cost = 5000 * (state.factoryLevel + 1); html += `<div class="item">Фабрика ур.${state.factoryLevel+1} (${cost} LC) <button onclick="buyFactory()">Купить</button></div>`; }
    if (state.bankLevel < 5) { const cost = 10000 * (state.bankLevel + 1); html += `<div class="item">Банк ур.${state.bankLevel+1} (${cost} LC) <button onclick="buyBank()">Купить</button></div>`; }
    if (state.neonFactoryLevel < 5) { const cost = 20000 * (state.neonFactoryLevel + 1); html += `<div class="item">Неоновый завод ур.${state.neonFactoryLevel+1} (${cost} LC) <button onclick="buyNeonFactory()">Купить</button></div>`; }
    c.innerHTML = html;
}

function buyTapUpgrade() { const cost = 500 * (state.tapUpgrade + 1); if (state.LC < cost) { alert('Не хватает'); return; } state.LC -= cost; state.tapUpgrade++; updateUI(); saveGame(); renderShop(); }
function buyEnergyUpgrade() { const cost = 300 * (state.energyUpgrade + 1); if (state.LC < cost) { alert('Не хватает'); return; } state.LC -= cost; state.energyUpgrade++; state.maxEnergy += 10; updateUI(); saveGame(); renderShop(); }
function buyCritUpgrade() { const cost = 1000 * (state.critUpgrade + 1); if (state.LC < cost) { alert('Не хватает'); return; } state.LC -= cost; state.critUpgrade++; updateUI(); saveGame(); renderShop(); }
function buyPassiveUpgrade() { const cost = 2000 * (state.passiveUpgrade + 1); if (state.LC < cost) { alert('Не хватает'); return; } state.LC -= cost; state.passiveUpgrade++; updateUI(); saveGame(); renderShop(); }

function buySkin(type) {
    const prices = { hat: 1000, glasses: 2000, chain: 5000 };
    if (state.LC < prices[type]) { alert('Не хватает LC'); return; }
    state.LC -= prices[type]; state.skins[type] = true;
    if (type === 'hat') state.maxEnergy += 50;
    if (type === 'glasses') state.critChance = 0.25;
    if (type === 'chain') state.robots += 1;
    updateUI(); saveGame(); renderShop();
}

function buyRobot() { const costs = [1000, 5000, 20000]; if (state.robots >= 3) return; const cost = costs[state.robots]; if (state.LC < cost) { alert('Не хватает'); return; } state.LC -= cost; state.robots++; updateUI(); saveGame(); renderShop(); }
function buyFarm() { if (state.farmLevel >= 5) return; const cost = 2000 * (state.farmLevel + 1); if (state.LC < cost) { alert('Не хватает'); return; } state.LC -= cost; state.farmLevel++; updateUI(); saveGame(); renderShop(); }
function buyFactory() { if (state.factoryLevel >= 5) return; const cost = 5000 * (state.factoryLevel + 1); if (state.LC < cost) { alert('Не хватает'); return; } state.LC -= cost; state.factoryLevel++; updateUI(); saveGame(); renderShop(); }
function buyBank() { if (state.bankLevel >= 5) return; const cost = 10000 * (state.bankLevel + 1); if (state.LC < cost) { alert('Не хватает'); return; } state.LC -= cost; state.bankLevel++; updateUI(); saveGame(); renderShop(); }
function buyNeonFactory() { if (state.neonFactoryLevel >= 5) return; const cost = 20000 * (state.neonFactoryLevel + 1); if (state.LC < cost) { alert('Не хватает'); return; } state.LC -= cost; state.neonFactoryLevel++; updateUI(); saveGame(); renderShop(); }

// ========== МИССИИ ==========
function openMissions() { document.getElementById('missionsModal').style.display = 'flex'; renderMissions(); }

function renderMissions() {
    const list = document.getElementById('missions-list');
    let html = '';
    if (state.missions.taps >= 50) { html += `<div class="mission">Сделать 50 тапов <button onclick="claimMission(1)">+500 LC</button></div>`; }
    else { html += `<div class="mission">Сделать 50 тапов (${state.missions.taps}/50)</div>`; }
    if (state.missions.casinoWins >= 3) { html += `<div class="mission">Выиграть 3 раза в казино <button onclick="claimMission(2)">+2 QC</button></div>`; }
    else { html += `<div class="mission">Выиграть 3 раза в казино (${state.missions.casinoWins}/3)</div>`; }
    list.innerHTML = html;
}

function claimMission(num) {
    if (num === 1 && state.missions.taps >= 50) { state.LC += 500; state.missions.taps = 0; }
    if (num === 2 && state.missions.casinoWins >= 3) { state.QC += 2; state.missions.casinoWins = 0; }
    updateUI(); saveGame(); renderMissions();
}

// ========== НАСТРОЙКИ ==========
function openSettings() { document.getElementById('settingsModal').style.display = 'flex'; }

function toggleSound() {
    state.soundOn = !state.soundOn;
    document.getElementById('soundBtn').innerText = state.soundOn ? 'Вкл' : 'Выкл';
    saveGame();
}

function toggleVibration() {
    state.vibroOn = !state.vibroOn;
    document.getElementById('vibroBtn').innerText = state.vibroOn ? 'Вкл' : 'Выкл';
    saveGame();
}

function doPrestige() {
    if (confirm('Сбросить прогресс ради +10% к доходу навсегда?')) {
        state.LC = 0; state.energy = 100; state.robots = 0; state.farmLevel = 0; state.factoryLevel = 0; state.bankLevel = 0; state.neonFactoryLevel = 0;
        state.prestige++;
        updateUI(); saveGame();
    }
}

function copyReferral() {
    const code = state.referralCode || 'REF123';
    const link = `https://t.me/Neon_Hamster_bot?start=${code}`;
    navigator.clipboard.writeText(link).then(() => alert('Скопировано!'));
}

// ========== ДОСТИЖЕНИЯ ==========
function openAchievements() { document.getElementById('achievementsModal').style.display = 'flex'; renderAchievements(); }

function renderAchievements() {
    const list = document.getElementById('achievements-list');
    const allAchievements = [
        { id: 'tap100', name: '100 тапов' },
        { id: 'casino10', name: '10 побед в казино' },
        { id: 'rich', name: 'Накопи 1M' },
        { id: 'lvl5', name: 'Достигни 5 уровня' },
        { id: 'boss', name: 'Победи босса' }
    ];
    let html = '';
    allAchievements.forEach(ach => {
        const unlocked = state.achievements.includes(ach.id);
        html += `<div class="achievement">${ach.name} ${unlocked ? '✅' : '❌'}</div>`;
    });
    list.innerHTML = html;
}

// ========== ЕЖЕДНЕВНАЯ НАГРАДА ==========
function openDaily() { document.getElementById('dailyModal').style.display = 'flex'; renderDaily(); }

function renderDaily() {
    const el = document.getElementById('daily-reward');
    const now = Date.now();
    if (now - state.lastDailyClaim > 86400000) {
        state.dailyStreak++;
        if (state.dailyStreak > 7) state.dailyStreak = 1;
        const rewards = [100, 200, 500, 1000, 2000, 5000, 10000];
        el.innerHTML = `День ${state.dailyStreak}: награда ${rewards[state.dailyStreak-1]} LC`;
    } else {
        const next = Math.ceil((86400000 - (now - state.lastDailyClaim)) / 3600000);
        el.innerHTML = `Следующая награда через ${next} ч`;
    }
}

function claimDaily() {
    const now = Date.now();
    if (now - state.lastDailyClaim > 86400000) {
        state.lastDailyClaim = now;
        state.dailyStreak++;
        if (state.dailyStreak > 7) state.dailyStreak = 1;
        const rewards = [100, 200, 500, 1000, 2000, 5000, 10000];
        state.LC += rewards[state.dailyStreak-1];
        alert('Награда получена! +' + rewards[state.dailyStreak-1] + ' LC');
        updateUI(); saveGame(); closeModal('dailyModal');
    } else {
        alert('Уже получил!');
    }
}

// ========== БОСС ==========
function openBoss() { document.getElementById('bossModal').style.display = 'flex'; renderBoss(); }

function generateDailyBoss() {
    if (Date.now() - state.lastVisit > 86400000 || state.bossHP <= 0) {
        state.bossHP = 100000 + state.level * 5000;
        state.bossKilled = false;
    }
}

function renderBoss() {
    const info = document.getElementById('boss-info');
    info.innerHTML = `Здоровье: ${state.bossHP} / ${100000 + state.level * 5000}<br>Урон за тап: ${state.tapValue + state.tapUpgrade * 5}`;
}

function attackBoss() {
    if (state.bossHP <= 0) { alert('Босс уже побежден! Жди нового.'); return; }
    const damage = state.tapValue + state.tapUpgrade * 5 + state.level * 2;
    state.bossHP -= damage;
    if (state.bossHP <= 0) {
        state.bossKilled = true;
        state.LC += 50000;
        alert('Босс побежден! +50,000 LC');
        checkAchievements();
    }
    renderBoss();
    updateUI(); saveGame();
}

// ========== МИНИ-ИГРЫ ==========
function openMiniGames() { document.getElementById('miniGamesModal').style.display = 'flex'; document.getElementById('mini-result').textContent = ''; }

function playCoinFlip() {
    if (state.LC < 50) { alert('Недостаточно LC'); return; }
    state.LC -= 50;
    const result = Math.random() < 0.5 ? 'Орёл' : 'Решка';
    const guess = prompt('Орёл или Решка? (введите 1 для Орла, 2 для Решки)');
    const guessText = guess === '1' ? 'Орёл' : guess === '2' ? 'Решка' : null;
    if (guessText === result) {
        state.LC += 100;
        document.getElementById('mini-result').innerText = 'Победа! +100 LC';
        playSound('win');
    } else {
        document.getElementById('mini-result').innerText = 'Проигрыш';
        playSound('lose');
    }
    updateUI(); saveGame();
}

function playGuessNumber() {
    if (state.LC < 20) { alert('Недостаточно LC'); return; }
    state.LC -= 20;
    const guess = prompt('Угадай число от 1 до 10');
    const target = Math.floor(Math.random() * 10) + 1;
    if (parseInt(guess) === target) {
        state.QC += 2;
        document.getElementById('mini-result').innerText = 'Угадал! +2 QC';
        playSound('win');
    } else {
        document.getElementById('mini-result').innerText = 'Не угадал! Было ' + target;
        playSound('lose');
    }
    updateUI(); saveGame();
}

// ========== КАРТОЧКИ ==========
function openCards() { document.getElementById('cardsModal').style.display = 'flex'; renderCards(); }

function renderCards() {
    const list = document.getElementById('cards-collection');
    let html = 'У тебя карточек: ' + state.cards.length;
    if (state.cards.length > 0) {
        html += '<br>' + state.cards.join(', ');
    }
    list.innerHTML = html;
}

function drawCard() {
    if (state.LC < 500) { alert('Недостаточно LC'); return; }
    state.LC -= 500;
    const rarities = ['Обычная', 'Редкая', 'Эпическая', 'Легендарная'];
    const rarity = rarities[Math.floor(Math.random() * rarities.length)];
    let bonus = 0;
    if (rarity === 'Обычная') bonus = 1;
    else if (rarity === 'Редкая') bonus = 3;
    else if (rarity === 'Эпическая') bonus = 5;
    else bonus = 10;
    state.cardBonus += bonus * 0.01;
    state.cards.push(rarity);
    alert('Выпала карта: ' + rarity + ' (+' + bonus + '% к доходу)');
    renderCards();
    updateUI(); saveGame();
}

// ========== АУКЦИОН ==========
function openAuction() { document.getElementById('auctionModal').style.display = 'flex'; renderAuction(); }

function generateAuction() {
    if (!state.auctionItem || state.auctionTimer <= 0) {
        const items = ['Шляпа', 'Очки', 'Цепь', 'Робот', 'Ферма'];
        state.auctionItem = items[Math.floor(Math.random() * items.length)];
        state.auctionTimer = 7200; // 2 часа
    }
}

function renderAuction() {
    const items = document.getElementById('auction-items');
    let html = '';
    if (state.auctionItem) {
        let cost = 1000;
        if (state.auctionItem === 'Очки') cost = 2000;
        if (state.auctionItem === 'Цепь') cost = 5000;
        if (state.auctionItem === 'Робот') cost = 8000;
        if (state.auctionItem === 'Ферма') cost = 12000;
        html += `<div class="item">${state.auctionItem} - скидка 90% (${Math.floor(cost * 0.1)} LC) <button onclick="buyAuction()">Купить</button></div>`;
    }
    items.innerHTML = html;
}

function buyAuction() {
    let cost = 1000;
    if (state.auctionItem === 'Очки') cost = 2000;
    if (state.auctionItem === 'Цепь') cost = 5000;
    if (state.auctionItem === 'Робот') cost = 8000;
    if (state.auctionItem === 'Ферма') cost = 12000;
    const price = Math.floor(cost * 0.1);
    if (state.LC < price) { alert('Не хватает LC'); return; }
    state.LC -= price;
    // Применяем покупку
    if (state.auctionItem === 'Шляпа') state.skins.hat = true;
    else if (state.auctionItem === 'Очки') state.skins.glasses = true;
    else if (state.auctionItem === 'Цепь') state.skins.chain = true;
    else if (state.auctionItem === 'Робот') state.robots++;
    else if (state.auctionItem === 'Ферма') state.farmLevel++;
    state.auctionItem = null;
    state.auctionTimer = 0;
    alert('Куплено!');
    updateUI(); saveGame(); renderAuction();
}

// ========== ШИФР ==========
function openCipher() { document.getElementById('cipherModal').style.display = 'flex'; document.getElementById('cipher-result').textContent = ''; }

function checkCipher() {
    const input = document.getElementById('cipherInput').value;
    const today = new Date();
    const code = (today.getMonth() + 1) * 100 + today.getDate(); // пример: 1015 для 15 октября
    if (input === String(code)) {
        state.LC += 1000000;
        document.getElementById('cipher-result').innerText = 'Код верный! +1,000,000 LC';
        playSound('win');
    } else {
        document.getElementById('cipher-result').innerText = 'Неверный код';
        playSound('lose');
    }
    updateUI(); saveGame();
}

// ========== ЛИДЕРБОРД ==========
function openLeaderboard() { document.getElementById('leaderboardModal').style.display = 'flex'; renderLeaderboard(); }

function renderLeaderboard() {
    const best = state.leaderboardBest;
    const current = Math.floor(state.LC);
    if (current > best) {
        state.leaderboardBest = current;
        saveGame();
    }
    document.getElementById('leaderboard-list').innerText = 'Твой лучший результат: ' + state.leaderboardBest.toLocaleString();
}

// ========== ЗАКРЫТИЕ МОДАЛОК ==========
function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});

// ========== ПАССИВНЫЙ ДОХОД ==========
setInterval(() => {
    const passive = (state.robots * 100 + state.farmLevel * 250 + state.factoryLevel * 500 + state.bankLevel * 1000 + state.neonFactoryLevel * 2000 + state.level * 10) * state.multiplier * (1 + state.prestige * 0.1) * (1 + state.cardBonus) * (1 + state.passiveUpgrade * 0.02);
    state.LC += passive / 3600;
    if (state.energy < state.maxEnergy) {
        state.energy += 1;
        if (state.energy > state.maxEnergy) state.energy = state.maxEnergy;
    }
    if (state.multiplierTimer > 0) {
        state.multiplierTimer--;
        if (state.multiplierTimer === 0) state.multiplier = 1;
    }
    if (state.auctionTimer > 0) {
        state.auctionTimer--;
        if (state.auctionTimer === 0) {
            state.auctionItem = null;
            generateAuction();
            renderAuction();
        }
    }
    updateUI(); saveGame();
}, 1000);

// ========== БУСТ ==========
function activateBoost() {
    if (state.energy < 50) { alert('Нужно 50 энергии!'); return; }
    state.energy -= 50;
    state.multiplier = 2;
    state.multiplierTimer = 60;
    alert('Буст: x2 на 1 минуту!');
    updateUI(); saveGame();
}

// ========== ЗВУКИ ==========
function playSound(type) {
    if (!state.soundOn) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        if (type === 'win') { osc.frequency.value = 700; gain.gain.setValueAtTime(0.2, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5); osc.start(); osc.stop(ctx.currentTime + 0.5); }
        else if (type === 'lose') { osc.frequency.value = 200; gain.gain.setValueAtTime(0.2, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3); osc.start(); osc.stop(ctx.currentTime + 0.3); }
        else if (type === 'crit') { osc.frequency.value = 1200; gain.gain.setValueAtTime(0.3, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4); osc.start(); osc.stop(ctx.currentTime + 0.4); }
        else { osc.frequency.value = 800; gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1); osc.start(); osc.stop(ctx.currentTime + 0.1); }
    } catch(e) {}
}

// ========== TELEGRAM ==========
if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
loadGame();
updateUI();
saveGame();
checkAchievements();
