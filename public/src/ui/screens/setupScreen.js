export function showSetupScreen(app) {
  app.hideAllScreens();
  document.getElementById('setupScreen').classList.add('active');
  document.getElementById('setupSessionCode').textContent = app.sessionCode;
  app.updateParticipantCounter(); // Appelle la méthode de l'instance
  app.renderWaitingPlayers();    // Appelle la méthode de l'instance
}