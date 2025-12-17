import { renderCards } from '../components/CardGrid.js';
import { renderPlayersList } from '../components/PlayerList.js';
import { updateProgressBar } from '../components/ProgressBar.js';
import { renderWaitingPlayers } from '../components/WaitingPlayers.js';

export function showGameScreen(app) {
  app.hideAllScreens();
  document.getElementById('gameScreen').classList.add('active');
  const gameNotStartedAlert = document.getElementById('gameNotStartedAlert');
  const taskHeader = document.getElementById('taskHeader');
  const votingSection = document.getElementById('votingSection');
  const waitingMessage = document.getElementById('waitingMessage');
  if (app.gameState.isGameStarted && app.gameState.backlog.length > 0) {
    gameNotStartedAlert.style.display = 'none';
    taskHeader.style.display = 'block';
    votingSection.style.display = 'block';
    waitingMessage.style.display = 'none';
    renderGameScreen(app);
  } else {
    gameNotStartedAlert.style.display = 'block';
    taskHeader.style.display = 'none';
    votingSection.style.display = 'none';
    waitingMessage.style.display = 'block';
  }
  document.getElementById('gameSessionCode').textContent = app.sessionCode;
  renderPlayersList(app.gameState.players);
  renderWaitingPlayers(app.gameState.players);
}

export function renderGameScreen(app) {
  const currentTask = app.gameState.backlog[app.gameState.currentTaskIndex];
  document.getElementById('taskName').textContent = `${app.gameState.currentTaskIndex + 1}. ${currentTask.name}`;
  document.getElementById('taskDescription').textContent = currentTask.description || '';
  document.getElementById('roundBadge').textContent = `Round ${app.gameState.currentRound}`;
  document.getElementById('modeDisplay').textContent =
    app.gameMode === 'strict' ? 'Strict (Unanimité)' : 'Médiane';
  document.getElementById('roundDisplay').textContent = `Round ${app.gameState.currentRound}`;
  document.getElementById('taskProgress').textContent =
    `${app.gameState.currentTaskIndex + 1} / ${app.gameState.backlog.length}`;
  renderCards(app);
  renderPlayersList(app.gameState.players);
  updateProgressBar(app.gameState.players);
}
