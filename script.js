// Core constants
const JAIL_DURATION = 5000;   // 5s
const KETCHUP_DURATION = 7000; // 7s
const PEEL_DURATION = 10000;   // 10s
const PUNCHER_DURATION = 3000; // 3s

// Hate thresholds for tools
// punch: always
// jail: ≥50
// buy: ≥100
// ketchup: ≥150
// pet: ≥200
// peel: ≥500
const UNLOCKS = {
    jail: 50,
    buy: 100,
    ketchup: 150,
    pet: 200,
    peel: 500
};

let hateLevel = 0;
let respectLevel = 0;

let selectedTool = null;
let jailActive = false;
let jailTimeout = null;

let punchBuffActive = false;
let punchTimes = [];
let punchBuffTimeout = null;

let debuffs = {
    jail: null,
    puncher: null,
    ketchup: [],
    peel: []
};

let peelActiveCount = 0;

// DOM elements
const debuffBar = document.getElementById('debuffBar');
const hateDisplay = document.getElementById('hateLevel');
const respectDisplay = document.getElementById('respectLevel');
const tomato = document.getElementById('tomato');
const notificationBar = document.getElementById('notificationBar');
const playerLevelBar = document.getElementById('playerLevelBar');

const punchTool = document.querySelector('.tool-btn[data-action="punch"]');
const jailTool = document.querySelector('.tool-btn[data-action="jail"]');
const buyTool = document.querySelector('.tool-btn[data-action="buy"]');
const ketchupTool = document.querySelector('.tool-btn[data-action="ketchup"]');
const petTool = document.querySelector('.tool-btn[data-action="pet"]');
const peelTool = document.querySelector('.tool-btn[data-action="peel"]');

const tools = [punchTool, jailTool, buyTool, ketchupTool, petTool, peelTool];

// Player levels
function getPlayerLevelText(h) {
    if (h < -150) return {text:"Below Bottom", emoji:"🕳"};
    if (h < -50) return {text:"Negative vibes", emoji:"🕊"};
    if (h < 0) return {text:"I hate you now", emoji:"😡"};
    if (h < 50) return {text:"Not a hater", emoji:"😊"};
    if (h < 100) return {text:"Low", emoji:"😐"};
    if (h < 150) return {text:"Mild Hater", emoji:"🤔"};
    if (h < 200) return {text:"Hater", emoji:"😠"};
    if (h < 500) return {text:"Serious Hater", emoji:"🔥"};
    if (h < 1000) return {text:"Hardcore Hater", emoji:"💀"};
    if (h < 5000) return {text:"Insane Hater", emoji:"👿"};
    return {text:"Awesome Hater", emoji:"🦾"};
}

// Update respect = hate
function updateLevels() {
    respectLevel = hateLevel;
}

// Update UI state
function updateUI() {
    hateDisplay.textContent = hateLevel;
    respectDisplay.textContent = respectLevel;

    updateToolLocking();
    updateNotification();
    updatePlayerLevelBar();
    renderDebuffs();
}

// Lock/unlock tools based on hateLevel and conditions
function updateToolLocking() {
    toggleLock(jailTool, hateLevel < UNLOCKS.jail || jailActive);
    toggleLock(buyTool, hateLevel < UNLOCKS.buy);
    toggleLock(ketchupTool, hateLevel < UNLOCKS.ketchup);
    toggleLock(petTool, hateLevel < UNLOCKS.pet);
    toggleLock(peelTool, hateLevel < UNLOCKS.peel);

    // If jail is active and selectedTool not punch, reset
    if (jailActive && selectedTool && selectedTool !== 'punch') {
        resetSelectedTool();
    }
}

function toggleLock(btn, condition) {
    if (condition) btn.classList.add('locked'); else btn.classList.remove('locked');
}

function updateNotification() {
    if (jailActive) {
        if (!selectedTool) {
            notificationBar.textContent = "Tomato is in jail! Only punch works.";
        } else if (selectedTool !== 'punch') {
            notificationBar.textContent = "Tomato in jail! Only punch is allowed.";
        } else {
            notificationBar.textContent = "Tomato in jail!";
        }
        return;
    }

    if (!selectedTool) {
        notificationBar.textContent = "Please select a tool below.";
    } else {
        notificationBar.textContent = `Selected tool: ${toolName(selectedTool)}`;
    }
}

function toolName(action) {
    switch(action) {
        case 'punch': return "Punch";
        case 'jail': return "Jail";
        case 'buy': return "Buy";
        case 'ketchup': return "Ketchup";
        case 'pet': return "Pet";
        case 'peel': return "Peel";
    }
    return "";
}

function updatePlayerLevelBar() {
    const levelInfo = getPlayerLevelText(hateLevel);
    playerLevelBar.textContent = levelInfo.emoji + " " + levelInfo.text;
}

// Handle tool selection
tools.forEach(tool => {
    tool.addEventListener('click', () => {
        const action = tool.getAttribute('data-action');
        if (tool.classList.contains('locked')) return;
        toggleToolSelection(tool, action);
    });
});

function toggleToolSelection(button, action) {
    if (jailActive && action !== 'punch') return;
    if (selectedTool === action) {
        resetSelectedTool();
    } else {
        resetAllToolsUI();
        selectedTool = action;
        button.textContent = '❌';
    }
    updateUI();
}

function resetSelectedTool() {
    if (!selectedTool) return;
    const btn = tools.find(t => t.getAttribute('data-action') === selectedTool);
    if (btn) btn.textContent = getEmojiForTool(selectedTool);
    selectedTool = null;
}

function resetAllToolsUI() {
    tools.forEach(t => {
        const tAction = t.getAttribute('data-action');
        t.textContent = getEmojiForTool(tAction);
    });
}

function getEmojiForTool(action) {
    switch(action) {
        case 'punch': return '👊';
        case 'jail': return '🔒';
        case 'buy': return '💲';
        case 'ketchup': return '🥫';
        case 'pet': return '🤚';
        case 'peel': return '🔪';
    }
    return '❌';
}

// Tomato click actions
tomato.addEventListener('click', () => {
    if (!selectedTool) return;
    if (jailActive && selectedTool !== 'punch') return;

    let hateChange = calculateHateChange(selectedTool);
    hateLevel += hateChange;
    updateLevels();
    updateUI();
});

function calculateHateChange(action) {
    const ketchupPlus = debuffs.ketchup.length;
    const peelPlus = peelActiveCount * 2;
    let base = 0;

    switch(action) {
        case 'punch':
            let punchBase = 1;
            if (jailActive) punchBase += 1;       // Jail +1 to punches
            if (punchBuffActive) punchBase += 1;  // Puncher buff +1
            base = punchBase + ketchupPlus + peelPlus;
            recordPunch();
            break;
        case 'jail':
            // +5 hate
            base = 5 + ketchupPlus + peelPlus;
            setJail(true, JAIL_DURATION);
            break;
        case 'buy':
            // buy = -25 hate
            base = -25 + ketchupPlus + peelPlus;
            break;
        case 'ketchup':
            // +10 hate + ketchup debuff
            base = 10 + ketchupPlus + peelPlus;
            addKetchupDebuff(KETCHUP_DURATION);
            break;
        case 'pet':
            // Pet = -50
            base = -50 + ketchupPlus + peelPlus;
            break;
        case 'peel':
            // +15 hate + peel debuff
            base = 15 + ketchupPlus + peelPlus;
            addPeelDebuff(PEEL_DURATION);
            break;
    }
    return base;
}

// Jail handling
function setJail(state, duration) {
    jailActive = state;
    if (state) {
        addJailDebuff(duration);
    } else {
        removeDebuff('jail');
    }
    updateUI();
}

// Punch buff logic
function recordPunch() {
    const now = Date.now();
    punchTimes.push(now);
    // keep only last 3s
    punchTimes = punchTimes.filter(t => now - t <= 3000);

    if (punchTimes.length >= 5 && !punchBuffActive) {
        activatePunchBuff(PUNCHER_DURATION);
    }
}

function activatePunchBuff(duration) {
    punchBuffActive = true;
    addPuncherDebuff();
    if (punchBuffTimeout) clearTimeout(punchBuffTimeout);
    punchBuffTimeout = setTimeout(() => {
        removeDebuff('puncher');
    }, duration);
    updateUI();
}

// Debuffs rendering
function renderDebuffs() {
    debuffBar.innerHTML = '';
    if (jailActive && debuffs.jail) debuffBar.appendChild(debuffs.jail);
    if (punchBuffActive && debuffs.puncher) debuffBar.appendChild(debuffs.puncher);
    debuffs.ketchup.forEach(k => debuffBar.appendChild(k));
    debuffs.peel.forEach(p => debuffBar.appendChild(p));
}

// Debuff add/remove
function addJailDebuff(duration) {
    removeDebuff('jail');
    let d = createDebuffElement('🔒', {
        name: 'Jail',
        effect: '+1 to punches',
        duration: '5s',
        emoji: '🚧'
    });
    debuffs.jail = d;
    if (jailTimeout) clearTimeout(jailTimeout);
    jailTimeout = setTimeout(() => {
        setJail(false);
    }, duration);
}

function addKetchupDebuff(duration) {
    let d = createDebuffElement('🥫', {
        name: 'Ketchup',
        effect: 'All actions +1 hate',
        duration: '7s',
        emoji: '💧'
    });
    debuffs.ketchup.push(d);
    setTimeout(() => {
        let index = debuffs.ketchup.indexOf(d);
        if (index !== -1) {
            debuffs.ketchup.splice(index, 1);
            updateUI();
        }
    }, duration);
    updateUI();
}

function addPeelDebuff(duration) {
    let d = createDebuffElement('🔪', {
        name: 'Peel',
        effect: 'All actions +2 hate',
        duration: '10s',
        emoji: '⚔️'
    });
    debuffs.peel.push(d);
    peelActiveCount++;
    setTimeout(() => {
        let index = debuffs.peel.indexOf(d);
        if (index !== -1) {
            debuffs.peel.splice(index, 1);
            peelActiveCount--;
            updateUI();
        }
    }, duration);
    updateUI();
}

function addPuncherDebuff() {
    removeDebuff('puncher');
    let d = createDebuffElement('👊🔥', {
        name: 'Puncher',
        effect: '+1 to punches',
        duration: '3s',
        emoji: '⚡'
    });
    debuffs.puncher = d;
}

function removeDebuff(type) {
    if (type === 'jail') {
        debuffs.jail = null;
        jailActive = false;
    } else if (type === 'puncher') {
        debuffs.puncher = null;
        punchBuffActive = false;
    }
    // ketchup and peel are removed by timeouts
    updateUI();
}

function createDebuffElement(icon, info) {
    let d = document.createElement('div');
    d.className = 'debuff';
    d.textContent = icon;

    let panel = document.createElement('div');
    panel.className = 'tooltip-panel';
    let grid = document.createElement('div');
    grid.className = 'tooltip-grid';

    let iconDiv = document.createElement('div');
    iconDiv.className = 'tooltip-icon';
    iconDiv.textContent = icon;

    let nameDiv = document.createElement('div');
    nameDiv.className = 'tooltip-name';
    nameDiv.textContent = info.name;

    let effectDiv = document.createElement('div');
    effectDiv.className = 'tooltip-effect';
    effectDiv.textContent = info.effect;

    let durationDiv = document.createElement('div');
    durationDiv.className = 'tooltip-duration';
    durationDiv.textContent = info.duration;

    let emojiDiv = document.createElement('div');
    emojiDiv.className = 'tooltip-emoji';
    emojiDiv.textContent = info.emoji;

    grid.appendChild(iconDiv);
    grid.appendChild(nameDiv);
    grid.appendChild(effectDiv);
    grid.appendChild(durationDiv);
    grid.appendChild(emojiDiv);

    panel.appendChild(grid);
    d.appendChild(panel);

    return d;
}

// Initialization
updateLevels();
updateUI();