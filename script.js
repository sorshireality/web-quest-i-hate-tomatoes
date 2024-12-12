class Debuff {
    constructor(icon, name, effect, duration, emoji) {
        this.icon = icon;
        this.name = name;
        this.effect = effect;
        this.duration = duration;
        this.emoji = emoji;
        this.element = this.createDebuffElement();
    }

    createDebuffElement() {
        let d = document.createElement('div');
        d.className = 'debuff';
        d.textContent = this.icon;

        let panel = document.createElement('div');
        panel.className = 'tooltip-panel';
        let grid = document.createElement('div');
        grid.className = 'tooltip-grid';

        let iconDiv = document.createElement('div');
        iconDiv.className = 'tooltip-icon';
        iconDiv.textContent = this.icon;

        let nameDiv = document.createElement('div');
        nameDiv.className = 'tooltip-name';
        nameDiv.textContent = this.name;

        let effectDiv = document.createElement('div');
        effectDiv.className = 'tooltip-effect';
        effectDiv.textContent = this.effect;

        let durationDiv = document.createElement('div');
        durationDiv.className = 'tooltip-duration';
        durationDiv.textContent = this.duration;

        let emojiDiv = document.createElement('div');
        emojiDiv.className = 'tooltip-emoji';
        emojiDiv.textContent = this.emoji;

        grid.appendChild(iconDiv);
        grid.appendChild(nameDiv);
        grid.appendChild(effectDiv);
        grid.appendChild(durationDiv);
        grid.appendChild(emojiDiv);

        panel.appendChild(grid);
        d.appendChild(panel);

        return d;
    }
}



class TomatoGame {
    constructor() {
        this.JAIL_DURATION = 5000;
        this.KETCHUP_DURATION = 7000;
        this.PEEL_DURATION = 10000;
        this.PUNCHER_DURATION = 3000;

        this.UNLOCKS = {
            jail: 50,
            buy: 100,
            ketchup: 150,
            pet: 200,
            peel: 500
        };

        this.RESPECT_MILESTONES = [
            { hate: -150, respect: 0 },
            { hate: -50, respect: 1 },
            { hate: 0, respect: 2 },
            { hate: 50, respect: 3 },
            { hate: 100, respect: 4 },
            { hate: 150, respect: 5 },
            { hate: 200, respect: 6 },
            { hate: 500, respect: 7 },
            { hate: 1000, respect: 8 },
            { hate: 5000, respect: 9 },
            { hate: Infinity, respect: 10 },
        ];

        this.hateLevel = 0;
        this.respectLevel = 0;
        this.selectedTool = null;
        this.jailActive = false;
        this.punchBuffActive = false;
        this.punchTimes = [];
        this.debuffs = {
            jail: null,
            puncher: null,
            ketchup: [],
            peel: []
        };

        this.debuffBar = document.getElementById('debuffBar');
        this.hateDisplay = document.getElementById('hateLevel');
        this.respectDisplay = document.getElementById('respectLevel');
        this.tomato = document.getElementById('tomato');
        this.notificationBar = document.getElementById('notificationBar');
        this.playerLevelBar = document.getElementById('playerLevelBar');

        this.punchTool = document.querySelector('.tool-btn[data-action="punch"]');
        this.jailTool = document.querySelector('.tool-btn[data-action="jail"]');
        this.buyTool = document.querySelector('.tool-btn[data-action="buy"]');
        this.ketchupTool = document.querySelector('.tool-btn[data-action="ketchup"]');
        this.petTool = document.querySelector('.tool-btn[data-action="pet"]');
        this.peelTool = document.querySelector('.tool-btn[data-action="peel"]');

        this.tools = [this.punchTool, this.jailTool, this.buyTool, this.ketchupTool, this.petTool, this.peelTool];

        this.particleContainer = document.createElement('div');
        this.particleContainer.className = 'particle-container';
        document.querySelector('main').appendChild(this.particleContainer);


        this.init();
    }

    init() {
        this.bindEventListeners();
        this.updateLevels();
        this.updateUI();
    }

    createParticle(x, y, emoji) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.textContent = emoji;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;

        // Generate random angle and distance
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 300;

        // Calculate end position
        const endX = distance * Math.cos(angle);
        const endY = distance * Math.sin(angle);

        particle.style.setProperty('--endX', `${endX}px`);
        particle.style.setProperty('--endY', `${endY}px`);

        this.particleContainer.appendChild(particle);
        setTimeout(() => particle.remove(), 1200);
    }

    spawnPunchParticles(event) {
        const emojis = ['💥', '👊', '💫', '⭐'];
        for (let i = 0; i < 5; i++) {
            const emoji = emojis[Math.floor(Math.random() * emojis.length)];
            this.createParticle(event.clientX, event.clientY, emoji);
        }
    }

    createHateIndicator(x, y, value) {
        const indicator = document.createElement('div');
        indicator.className = 'hate-indicator';
        indicator.classList.add(value >= 0 ? 'positive' : 'negative');
        indicator.textContent = (value > 0 ? '+' : '') + value;
        indicator.style.left = `${x}px`;
        indicator.style.top = `${y}px`;

        this.particleContainer.appendChild(indicator);
        setTimeout(() => indicator.remove(), 1000);
    }


    bindEventListeners() {
        this.tools.forEach(tool => {
            tool.addEventListener('click', () => this.handleToolClick(tool));
        });

        this.tomato.addEventListener('click', () => this.handleTomatoClick());
    }

    handleToolClick(tool) {
        const action = tool.getAttribute('data-action');
        if (tool.classList.contains('locked')) return;

        if (this.jailActive && action !== 'punch') return;

        if (this.selectedTool === action) {
            this.resetSelectedTool();
        } else {
            this.resetAllToolsUI();
            this.selectedTool = action;
            tool.textContent = '❌';
        }
        this.updateUI();
    }

    resetSelectedTool() {
        if (!this.selectedTool) return;
        const btn = this.tools.find(t => t.getAttribute('data-action') === this.selectedTool);
        if (btn) btn.textContent = this.getEmojiForTool(this.selectedTool);
        this.selectedTool = null;
    }

    resetAllToolsUI() {
        this.tools.forEach(t => {
            const tAction = t.getAttribute('data-action');
            t.textContent = this.getEmojiForTool(tAction);
        });
    }

    getEmojiForTool(action) {
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
    handleTomatoClick() {
        if (!this.selectedTool) return;
        if (this.jailActive && this.selectedTool !== 'punch') return;

        if (this.selectedTool === 'punch') {
            this.spawnPunchParticles(event);
        }

        if (!this.canAddDebuff() && (this.selectedTool === 'ketchup' || this.selectedTool === 'peel')) {
            return;
        }

        let hateChange = this.calculateHateChange(this.selectedTool);
        this.createHateIndicator(event.clientX, event.clientY, hateChange);
        this.hateLevel += hateChange;
        this.updateLevels();
        this.updateUI();
    }


    calculateHateChange(action) {
        const ketchupPlus = this.debuffs.ketchup.length;
        const peelPlus = this.debuffs.peel.length * 2; // peelPlus is now based on peel debuffs count
        let base = 0;

        switch (action) {
            case 'punch':
                let punchBase = 1;
                if (this.jailActive) punchBase += 1;
                if (this.punchBuffActive) punchBase += 1;
                base = punchBase + ketchupPlus + peelPlus;
                this.recordPunch();
                break;
            case 'jail':
                base = 5 + ketchupPlus + peelPlus;
                this.setJail(true, this.JAIL_DURATION);
                break;
            case 'buy':
                base = -25 + ketchupPlus + peelPlus;
                break;
            case 'ketchup':
                base = 10 + ketchupPlus + peelPlus;
                this.addDebuff('ketchup', this.KETCHUP_DURATION);
                break;
            case 'pet':
                base = -50 + ketchupPlus + peelPlus;
                break;
            case 'peel':
                base = 15 + ketchupPlus + peelPlus;
                this.addDebuff('peel', this.PEEL_DURATION);
                break;
        }
        return base;
    }

    setJail(state, duration) {
        this.jailActive = state;
        if (state) {
            this.addDebuff('jail', duration);
        } else {
            this.removeDebuff('jail');
        }
        this.updateUI();
    }


    recordPunch() {
        const now = Date.now();
        this.punchTimes.push(now);

        this.punchTimes = this.punchTimes.filter(t => now - t <= 3000);

        if (this.punchTimes.length >= 5 && !this.punchBuffActive) {
            this.activatePunchBuff(this.PUNCHER_DURATION);
        }
    }

    activatePunchBuff(duration) {
        this.punchBuffActive = true;
        this.addPuncherDebuff();

        clearTimeout(this.punchBuffTimeout); // Clear previous timeout if any

        this.punchBuffTimeout = setTimeout(() => {
            this.removeDebuff('puncher');
        }, duration);

        this.updateUI();
    }


    addPuncherDebuff() {
        this.removeDebuff('puncher');
        let d = new Debuff('👊🔥', 'Puncher', '+1 to punches', '3s', '⚡');
        this.debuffs.puncher = d;
        this.debuffBar.appendChild(d.element);
    }

    addDebuff(type, duration) {
        if (!this.canAddDebuff()) return;

        let debuff;
        switch (type) {
            case 'jail':

                debuff = new Debuff('🔒', 'Jail', '+1 to punches', '5s', '🚧');
                this.debuffs.jail = debuff;

                clearTimeout(this.jailTimeout);
                this.jailTimeout = setTimeout(() => {
                    this.setJail(false);
                }, duration);

                break;
            case 'ketchup':
                debuff = new Debuff('🥫', 'Ketchup', 'All actions +1 hate', '7s', '💧');
                this.debuffs.ketchup.push(debuff);
                break;
            case 'peel':
                debuff = new Debuff('🔪', 'Peel', 'All actions +2 hate', '10s', '⚔️');
                this.debuffs.peel.push(debuff);
                break;

        }

        if (debuff && debuff.element) {
            this.debuffBar.appendChild(debuff.element);
        }


        if (debuff && type !== 'jail') { // jail removed by setJail
            setTimeout(() => this.removeDebuff(type, debuff), duration);
        }

        this.updateUI();
    }

    removeDebuff(type, debuff) {
        if (type === 'jail') {
            this.debuffs.jail = null;
            this.jailActive = false;
        } else if (type === 'puncher') {
            this.debuffs.puncher = null;
            this.punchBuffActive = false;
        } else if (debuff) {
            let debuffArray = this.debuffs[type];
            let index = debuffArray.indexOf(debuff);
            if (index > -1) {
                debuffArray.splice(index, 1);
                debuff.element.remove();
            }
        }
        this.updateUI();
    }


    canAddDebuff() {
        let totalDebuffs = 0;
        for (const debuffType in this.debuffs) {
            if (this.debuffs[debuffType] instanceof Array) {
                totalDebuffs += this.debuffs[debuffType].length;
            } else if (this.debuffs[debuffType]) {
                totalDebuffs++;
            }
        }

        totalDebuffs -= (this.debuffs.jail ? 1 : 0) + (this.debuffs.puncher ? 1 : 0);

        return totalDebuffs < 7;
    }



    updateLevels() {
        let respectLevel = 0;
        for (const milestone of this.RESPECT_MILESTONES) {
            if (this.hateLevel >= milestone.hate) {
                respectLevel = milestone.respect;
            } else {
                break;
            }
        }
        this.respectLevel = respectLevel;
        this.respectDisplay.textContent = this.respectLevel;
    }

    updateUI() {
        this.hateDisplay.textContent = this.hateLevel;
        this.respectDisplay.textContent = this.respectLevel;

        this.updateToolLocking();
        this.updateNotification();
        this.updatePlayerLevelBar();
        this.renderDebuffs();
    }

    updateToolLocking() {
        this.toggleLock(this.jailTool, this.hateLevel < this.UNLOCKS.jail || this.jailActive);
        this.toggleLock(this.buyTool, this.hateLevel < this.UNLOCKS.buy);
        this.toggleLock(this.ketchupTool, this.hateLevel < this.UNLOCKS.ketchup);
        this.toggleLock(this.petTool, this.hateLevel < this.UNLOCKS.pet);
        this.toggleLock(this.peelTool, this.hateLevel < this.UNLOCKS.peel);

        if (this.jailActive && this.selectedTool && this.selectedTool !== 'punch') {
            this.resetSelectedTool();
        }
    }

    toggleLock(btn, condition) {
        if (condition) {
            btn.classList.add('locked');
        } else {
            btn.classList.remove('locked');
        }
    }

    updateNotification() {
        if (this.jailActive) {
            if (!this.selectedTool) {
                this.notificationBar.textContent = "Tomato is in jail! Only punch works.";
            } else if (this.selectedTool !== 'punch') {
                this.notificationBar.textContent = "Tomato in jail! Only punch is allowed.";
            } else {
                this.notificationBar.textContent = "Tomato in jail!";
            }
            return;
        }

        if (!this.selectedTool) {
            this.notificationBar.textContent = "Please select a tool below.";
        } else {
            this.notificationBar.textContent = `Selected tool: ${this.toolName(this.selectedTool)}`;
        }
    }

    toolName(action) {
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


    updatePlayerLevelBar() {
        const levelInfo = this.getPlayerLevelText(this.hateLevel);
        this.playerLevelBar.textContent = levelInfo.emoji + " " + levelInfo.text;
    }

    getPlayerLevelText(h) {
        if (h < -150) return { text: "Below Bottom", emoji: "🕳" };
        if (h < -50) return { text: "Negative vibes", emoji: "🕊" };
        if (h < 0) return { text: "I hate you now", emoji: "😡" };
        if (h < 50) return { text: "Not a hater", emoji: "😊" };
        if (h < 100) return { text: "Low", emoji: "😐" };
        if (h < 150) return { text: "Mild Hater", emoji: "🤔" };
        if (h < 200) return { text: "Hater", emoji: "😠" };
        if (h < 500) return { text: "Serious Hater", emoji: "🔥" };
        if (h < 1000) return { text: "Hardcore Hater", emoji: "💀" };
        if (h < 5000) return { text: "Insane Hater", emoji: "👿" };
        return { text: "Awesome Hater", emoji: "🦾" };
    }

    renderDebuffs() {
        this.debuffBar.innerHTML = '';
        if (this.jailActive && this.debuffs.jail) this.debuffBar.appendChild(this.debuffs.jail.element);
        if (this.punchBuffActive && this.debuffs.puncher) this.debuffBar.appendChild(this.debuffs.puncher.element);
        this.debuffs.ketchup.forEach(k => this.debuffBar.appendChild(k.element));
        this.debuffs.peel.forEach(p => this.debuffBar.appendChild(p.element));
    }

}


const game = new TomatoGame();

