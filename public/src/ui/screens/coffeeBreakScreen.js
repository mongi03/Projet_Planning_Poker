export function showCoffeeBreakScreen(app) {
  app.hideAllScreens();
  document.getElementById('coffeeBreakScreen').classList.add('active');
  const playersList = document.getElementById('coffeePlayersDisplay');
  playersList.innerHTML = app.gameState.coffeeBreakPlayers
    .map(name => `<div class="voter-tag" style="display: inline-block; margin: 5px;">${name}</div>`)
    .join('');
  const downloadSection = document.getElementById('downloadSection');
  downloadSection.style.display = (app.playerName === app.creatorName) ? 'block' : 'none';
}
