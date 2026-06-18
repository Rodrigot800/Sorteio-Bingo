/* ==========================================
   BINGO SORTEIO — app.js
   ========================================== */

const STORAGE_KEY = 'bingoSorteioState';

let drawnNumbers     = [];
let availableNumbers = [];
let autoInterval     = null;

/* ------------------------------------------
   LOCALSTORAGE — Persistência
   ------------------------------------------ */
function saveState() {
    const state = {
        drawnNumbers,
        availableNumbers,
        lastDrawn: drawnNumbers.length > 0 ? drawnNumbers[drawnNumbers.length - 1] : null
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function clearState() {
    localStorage.removeItem(STORAGE_KEY);
}

/* ------------------------------------------
   HELPERS
   ------------------------------------------ */
function getColumn(num) {
    if (num <= 15) return 'b';
    if (num <= 30) return 'i';
    if (num <= 45) return 'n';
    if (num <= 60) return 'g';
    return 'o';
}

function getLetter(num) {
    if (num <= 15) return 'B';
    if (num <= 30) return 'I';
    if (num <= 45) return 'N';
    if (num <= 60) return 'G';
    return 'O';
}

/* ------------------------------------------
   BOARD
   ------------------------------------------ */
function createBoard() {
    const board = document.getElementById('boardNumbers');
    board.innerHTML = '';

    for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 5; col++) {
            const num  = col * 15 + row + 1;
            const cell = document.createElement('div');
            cell.className   = `number-cell col-${getColumn(num)}`;
            cell.id          = `cell-${num}`;
            cell.textContent = num;
            board.appendChild(cell);
        }
    }
}

/* Reaplica as marcações no tabuleiro conforme drawnNumbers */
function restoreBoard() {
    drawnNumbers.forEach(num => {
        const cell = document.getElementById(`cell-${num}`);
        if (cell) cell.classList.add('drawn');
    });
}

/* ------------------------------------------
   DRAW
   ------------------------------------------ */
function drawNumber() {
    if (availableNumbers.length === 0) {
        alert('Todos os números já foram sorteados!');
        stopAuto();
        return;
    }

    const idx    = Math.floor(Math.random() * availableNumbers.length);
    const number = availableNumbers.splice(idx, 1)[0];
    drawnNumbers.push(number);

    saveState();          // ← persiste após cada sorteio
    updateDisplay(number);
}

function updateDisplay(number) {
    const currentDisplay = document.getElementById('currentNumber');
    currentDisplay.textContent     = `${getLetter(number)} ${number}`;
    currentDisplay.style.animation = 'none';
    setTimeout(() => currentDisplay.style.animation = 'pulse 0.5s ease', 10);

    document.getElementById(`cell-${number}`).classList.add('drawn');

    updateDrawnList();

    document.getElementById('drawnCount').textContent =
        `${drawnNumbers.length} de 75 números`;
}

function updateDrawnList() {
    const container = document.getElementById('drawnNumbers');
    container.innerHTML = '';

    if (drawnNumbers.length === 0) {
        container.innerHTML = '<p class="no-numbers">Nenhum número sorteado ainda</p>';
        return;
    }

    [...drawnNumbers].reverse().forEach(num => {
        const div = document.createElement('div');
        div.className   = `drawn-number col-${getColumn(num)}`;
        div.textContent = `${getLetter(num)} ${num}`;
        container.appendChild(div);
    });

    container.scrollTop = 0;
}

/* ------------------------------------------
   AUTO DRAW
   ------------------------------------------ */
function toggleAuto() {
    autoInterval ? stopAuto() : startAuto();
}

function startAuto() {
    const btn = document.querySelector('.btn-auto');
    btn.textContent      = 'Parar Auto';
    btn.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';

    autoInterval = setInterval(() => {
        if (availableNumbers.length === 0) { stopAuto(); return; }
        drawNumber();
    }, 2000);
}

function stopAuto() {
    const btn = document.querySelector('.btn-auto');
    btn.textContent      = 'Auto Sorteio';
    btn.style.background = 'linear-gradient(135deg, #9b59b6, #8e44ad)';

    if (autoInterval) { clearInterval(autoInterval); autoInterval = null; }
}

/* ------------------------------------------
   RESET (com modal de confirmação)
   ------------------------------------------ */
function resetGame() {
    openConfirmModal();
}

function confirmReset() {
    closeConfirmModal();
    stopAuto();

    drawnNumbers     = [];
    availableNumbers = Array.from({ length: 75 }, (_, i) => i + 1);

    clearState();         // ← apaga o localStorage no reset

    document.getElementById('currentNumber').textContent = '?';
    document.getElementById('drawnCount').textContent    = '0 de 75 números';
    document.getElementById('drawnNumbers').innerHTML    =
        '<p class="no-numbers">Nenhum número sorteado ainda</p>';

    document.querySelectorAll('.number-cell').forEach(cell =>
        cell.classList.remove('drawn')
    );
}

/* ------------------------------------------
   CONFIRM RESET MODAL
   ------------------------------------------ */
function openConfirmModal() {
    document.getElementById('confirmModal').classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
}

/* ------------------------------------------
   CARD VERIFICATION MODAL
   ------------------------------------------ */

// Modos de vitória com FREE (casa central livre)
// Quizena  = linha completa de 5 casas, mas o FREE conta como 1 → 4 números
// Completo = todas as 25 casas, mas o FREE conta como 1 → 24 números
const WIN_MODES = {
    4:  {
        emoji: '🏆',
        title: 'QUIZENA!',
        sub:   'Parabéns! Você completou uma linha! A casa FREE foi contabilizada automaticamente.'
    },
    5: {
        emoji: '🏆',
        title: 'QUIZENA!',
        sub:   'Parabéns! Você completou uma linha! (5 números incluídos).'
    },
    24: {
        emoji: '🏆',
        title: 'BINGO!!!',
        sub:   'Parabéns! Cartela completa! A casa FREE no centro foi contabilizada automaticamente. 🎊'
    },
    25: {
        emoji: '🏆',
        title: 'BINGO!!!',
        sub:   'Parabéns! Cartela completa! (25 números incluídos). 🎊'
    }
};

function openCheckModal() {
    document.getElementById('checkInput').value        = '';
    document.getElementById('checkResult').textContent = '';
    document.getElementById('checkResult').className   = 'check-result';
    document.getElementById('checkModal').classList.add('active');
    setTimeout(() => document.getElementById('checkInput').focus(), 100);
}

function closeCheckModal() {
    document.getElementById('checkModal').classList.remove('active');
}

function verifyCard() {
    const raw      = document.getElementById('checkInput').value;
    const resultEl = document.getElementById('checkResult');

    // Separa somente por espaço(s)
    const inputNums = raw.trim().split(/\s+/)
        .map(s => parseInt(s, 10))
        .filter(n => !isNaN(n) && n >= 1 && n <= 75);

    // Remove duplicatas caso o jogador digit dois vezes o mesmo número
    const unique = [...new Set(inputNums)];

    if (unique.length === 0) {
        showCheckError(resultEl, '⚠️ Digite ao menos um número válido (1–75).');
        return;
    }

    // Valida quantidade: 4 = quizena | 24 = cartela cheia
    const mode = WIN_MODES[unique.length];
    if (!mode) {
        const msg = unique.length < 4
            ? `⚠️ Poucos números. Digite 4‑5 (quizena) ou 24‑25 (cartela cheia). Você digitou ${unique.length}.`
            : `⚠️ Números demais. Digite 4‑5 (quizena) ou 24‑25 (cartela cheia). Você digitou ${unique.length}.`;
        showCheckError(resultEl, msg);
        return;
    }

    // Verifica se todos foram sorteados
    const notDrawn = unique.filter(n => !drawnNumbers.includes(n));
    if (notDrawn.length > 0) {
        showCheckError(resultEl,
            `❌ Número(s) não sorteado(s) ainda: ${notDrawn.join(' ')}`);
        return;
    }

    // Tudo certo → VENCEDOR!
    closeCheckModal();
    showWinner(mode);
}

function showCheckError(el, msg) {
    el.className       = 'check-result error';
    el.textContent     = msg;
    el.style.animation = 'none';
    void el.offsetWidth;   // força re-trigger da animação shake
    el.style.animation = '';
}

/* ------------------------------------------
   WINNER CELEBRATION
   ------------------------------------------ */
function showWinner(mode) {
    document.getElementById('winnerEmoji').textContent    = mode.emoji;
    document.getElementById('winnerTitle').textContent    = mode.title;
    document.getElementById('winnerSubtitle').textContent = mode.sub;
    document.getElementById('winnerOverlay').classList.add('active');
    startConfetti();
}

function closeWinner() {
    document.getElementById('winnerOverlay').classList.remove('active');
    stopConfetti();
}

/* ------------------------------------------
   CONFETTI ENGINE
   ------------------------------------------ */
let confettiAnimId = null;
const CONFETTI_COLORS = [
    '#f9ca24','#f0932b','#e74c3c','#00b894','#00cec9',
    '#9b59b6','#3498db','#2ecc71','#fd79a8','#fdcb6e'
];

function startConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');

    const pieces = Array.from({ length: 220 }, () => ({
        x:     Math.random() * canvas.width,
        y:     Math.random() * -canvas.height,
        w:     Math.random() * 14 + 6,
        h:     Math.random() * 7  + 4,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        angle: Math.random() * 360,
        spin:  (Math.random() - 0.5) * 8,
        vx:    (Math.random() - 0.5) * 4,
        vy:    Math.random() * 4 + 3,
    }));

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pieces.forEach(p => {
            p.x += p.vx; p.y += p.vy; p.angle += p.spin;
            if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
            ctx.save();
            ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
            ctx.rotate(p.angle * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        });
        confettiAnimId = requestAnimationFrame(draw);
    }
    draw();
}

function stopConfetti() {
    if (confettiAnimId) {
        cancelAnimationFrame(confettiAnimId);
        confettiAnimId = null;
    }
    const canvas = document.getElementById('confettiCanvas');
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

/* ------------------------------------------
   INIT — restaura estado do localStorage
   ------------------------------------------ */
function init() {
    createBoard();

    const saved = loadState();

    if (saved && saved.drawnNumbers && saved.drawnNumbers.length > 0) {
        // Restaura arrays de estado
        drawnNumbers     = saved.drawnNumbers;
        availableNumbers = saved.availableNumbers;

        // Restaura marcações no tabuleiro
        restoreBoard();

        // Restaura a bola do último número sorteado
        if (saved.lastDrawn !== null) {
            const currentDisplay = document.getElementById('currentNumber');
            currentDisplay.textContent = `${getLetter(saved.lastDrawn)} ${saved.lastDrawn}`;
        }

        // Restaura contador e lista lateral
        document.getElementById('drawnCount').textContent =
            `${drawnNumbers.length} de 75 números`;
        updateDrawnList();
    } else {
        // Jogo novo
        availableNumbers = Array.from({ length: 75 }, (_, i) => i + 1);
    }
}

init();
