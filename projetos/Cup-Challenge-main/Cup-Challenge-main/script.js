document.addEventListener('DOMContentLoaded', () => {
  const cups = document.querySelectorAll('.cup');
  const startBtn = document.getElementById('start');
  const tutorialBtn = document.getElementById('tutorial');
  const attemptsDisplay = document.querySelector('.attempts');
  const phaseIndicator = document.querySelector('.phase-indicator');
  const leaderboard = document.querySelector('.leaderboard');
  const leaderboardToggle = document.querySelector('.leaderboard-toggle');
  const leaderboardList = document.querySelector('.leaderboard-list');

  // Configurações
  const CONFIG = {
    INITIAL_SHUFFLE_DURATION: 8000,
    SHOW_DELAY: 2000,
    CUP_SPACING: 130,
    REVEAL_DURATION: 3000,
    POINTS_PER_WIN: 5,
    POINTS_PER_LOSS: 2,
    BASE_SHUFFLE_INTERVAL: 1200,
    PHASE_THRESHOLDS: [5, 10, 18, 28, 40, 55, 72, 91, 112, 135, 160, 187, 216, 247, 280]
  };

  // Estado do jogo
  let visualPositions = [0, 1, 2];
  let ballPosition = 0;
  let clickable = false;
  let attempts = 0;
  let score = 0;
  let phase = 1;
  let consecutiveWins = 0;

  const usuarioLogado = localStorage.getItem('usuarioLogado') || "Você";
  let playerId = localStorage.getItem('playerId') || 'player' + Math.floor(Math.random() * 1000);

  let currentShuffleDuration = CONFIG.INITIAL_SHUFFLE_DURATION;
  let currentShuffleInterval = CONFIG.BASE_SHUFFLE_INTERVAL;

  // Placar - carrega do localStorage ou usa dados iniciais
  let leaderboardData = JSON.parse(localStorage.getItem('leaderboard')) || [
    { name: "Mestre dos Copos", score: 42, id: "bot1", phase: 5 },
    { name: "Olho de Águia", score: 35, id: "bot2", phase: 4 },
    { name: "Adivinhador", score: 28, id: "bot3", phase: 3 },
    { name: "Iniciante", score: 15, id: "bot4", phase: 2 }
  ];

  initGame();

  function initGame() {

    const playerExists = leaderboardData.some(player => player.id === playerId);
    if (!playerExists) {
      leaderboardData.push({ 
        name: usuarioLogado, 
        score: 0, 
        id: playerId,
        phase: 1
      });
      saveLeaderboard();
    } else {
      // Recupera os dados existentes do jogador
      const player = leaderboardData.find(p => p.id === playerId);
      score = player.score;
      phase = player.phase;
    }
    
    updatePhase();
    updateAttemptsDisplay();
    setupEventListeners();
    showBallBeforeShuffle();
    setStartButtonState(true);
    updateLeaderboard();
  }

  function setupEventListeners() {
    startBtn.addEventListener('click', startGame);
    tutorialBtn.addEventListener('click', showTutorial);
    leaderboardToggle.addEventListener('click', toggleLeaderboard);
    
    cups.forEach((cup, index) => {
      cup.addEventListener('click', () => handleCupClick(index));
    });
  }

  function toggleLeaderboard() {
    leaderboard.classList.toggle('expanded');
  }

  function setStartButtonState(enabled) {
    startBtn.disabled = !enabled;
    startBtn.style.opacity = enabled ? '1' : '0.5';
  }

  function resetCups() {
    cups.forEach(cup => {
      cup.classList.remove('reveal', 'lifted', 'wrong-choice');
      cup.querySelector('.ball').classList.add('hidden-ball');
    });
  }

  function showBallBeforeShuffle() {
    resetCups();
    ballPosition = Math.floor(Math.random() * 3);
    const cup = cups[ballPosition];
    cup.classList.add('lifted');
    cup.querySelector('.ball').classList.remove('hidden-ball');
    updateCupPositions();
  }

  function updateCupPositions() {
    cups.forEach((cup, i) => {
      const position = (visualPositions[i] - 1) * CONFIG.CUP_SPACING;
      cup.style.transform = `translateX(calc(-50% + ${position}px))`;
    });
  }

  function shuffleVisualPositions() {
    for (let i = visualPositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [visualPositions[i], visualPositions[j]] = [visualPositions[j], visualPositions[i]];
    }
  }

  function startGame() {
    showBallBeforeShuffle();
    setTimeout(() => {
      shuffleCups();
    }, CONFIG.SHOW_DELAY);
  }

  function shuffleCups() {
    clickable = false;
    setStartButtonState(false);
    resetCups();

    let speedFactor = 1;
    if (phase > 10) {
      speedFactor = 1 - ((phase - 10) * 0.05);
    }
    const adjustedInterval = Math.max(100, currentShuffleInterval * speedFactor);
    const adjustedDuration = Math.max(2000, currentShuffleDuration * speedFactor);

    const shuffleInterval = setInterval(() => {
      shuffleVisualPositions();
      updateCupPositions();
    }, adjustedInterval);

    setTimeout(() => {
      clearInterval(shuffleInterval);
      clickable = true;
      setStartButtonState(true);
      attempts++;
      updateAttemptsDisplay();
    }, adjustedDuration);
  }

  function handleCupClick(physicalIndex) {
    if (!clickable) return;
    clickable = false;

    const visualIndex = visualPositions[physicalIndex];
    const isCorrect = visualIndex === ballPosition;

    cups.forEach(cup => {
      cup.querySelector('.ball').classList.add('hidden-ball');
    });

    cups.forEach(cup => {
      cup.classList.add('reveal');
    });

    if (isCorrect) {
      cups[physicalIndex].querySelector('.ball').classList.remove('hidden-ball');
      score += CONFIG.POINTS_PER_WIN;
      consecutiveWins++;
      if (consecutiveWins % 5 === 0 && phase > 10) {
        currentShuffleDuration = Math.max(2000, currentShuffleDuration - 100);
        currentShuffleInterval = Math.max(100, currentShuffleInterval - 10);
      }
    } else {
      cups.forEach((cup, idx) => {
        if (visualPositions[idx] === ballPosition) {
          cup.querySelector('.ball').classList.remove('hidden-ball');
        }
      });
      cups[physicalIndex].classList.add('wrong-choice');
      score = Math.max(0, score - CONFIG.POINTS_PER_LOSS);
      consecutiveWins = 0;
      currentShuffleDuration = Math.min(CONFIG.INITIAL_SHUFFLE_DURATION, currentShuffleDuration + 100);
      currentShuffleInterval = Math.min(CONFIG.BASE_SHUFFLE_INTERVAL, currentShuffleInterval + 20);
    }

    checkPhaseProgress();
    updatePlayerScore();
    
    setTimeout(() => {
      startGame();
    }, CONFIG.REVEAL_DURATION);
  }

  function checkPhaseProgress() {
    const newPhase = CONFIG.PHASE_THRESHOLDS.findIndex(threshold => score < threshold) + 1;
    if (newPhase !== phase) {
      phase = newPhase;
      updatePhase();

      if (phase > 10) {
        currentShuffleDuration = Math.max(2000, CONFIG.INITIAL_SHUFFLE_DURATION - ((phase - 10) * 300));
        currentShuffleInterval = Math.max(100, CONFIG.BASE_SHUFFLE_INTERVAL - ((phase - 10) * 40));
      } else {
        currentShuffleDuration = CONFIG.INITIAL_SHUFFLE_DURATION;
        currentShuffleInterval = CONFIG.BASE_SHUFFLE_INTERVAL;
      }
    }
  }

  function updatePhase() {
    phaseIndicator.textContent = `FASE ${phase}`;
    phaseIndicator.style.transform = 'scale(1.2)';
    phaseIndicator.style.color = '#e67e22';
    setTimeout(() => {
      phaseIndicator.style.transform = 'scale(1)';
      phaseIndicator.style.color = '';
    }, 500);
  }

  function updatePlayerScore() {
    const playerIndex = leaderboardData.findIndex(player => player.id === playerId);
    if (playerIndex !== -1) {
      leaderboardData[playerIndex] = { 
        name: usuarioLogado, 
        score: score, 
        id: playerId,
        phase: phase
      };
    }

    leaderboardData.sort((a, b) => b.score - a.score || b.phase - a.phase);
    saveLeaderboard();
    updateLeaderboard();
    updateAttemptsDisplay();
  }

  function updateAttemptsDisplay() {
    attemptsDisplay.textContent = `Tentativas: ${attempts} • Pontos: ${score}`;
  }

  function updateLeaderboard() {
    leaderboardList.innerHTML = '';
    leaderboardData.slice(0, 10).forEach((player, index) => {
      const li = document.createElement('li');
      li.className = `leaderboard-item ${player.id === playerId ? 'you' : ''}`;
      li.innerHTML = `
        <span>${index + 1}- ${player.name}</span>
        <span>${player.score} pts</span>
      `;
      leaderboardList.appendChild(li);
    });
  }

  function saveLeaderboard() {
    localStorage.setItem('leaderboard', JSON.stringify(leaderboardData));
  }

  function showTutorial() {
    alert(`Tutorial:\n\n1. Clique em JOGAR para começar\n2. Observe onde a bola está\n3. Após o embaralhamento, clique no copo onde acha que está a bola\n4. Cada acerto vale ${CONFIG.POINTS_PER_WIN} pontos\n5. Cada erro reduz ${CONFIG.POINTS_PER_LOSS} pontos\n6. A dificuldade aumenta conforme seus acertos\n7. Avance de fase marcando mais pontos\n8. Tente alcançar o topo do placar!`);
  }
});