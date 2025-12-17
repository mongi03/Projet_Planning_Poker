// Fonction pour afficher l'écran de fin de partie
export function showGameOverScreen() {
  hideAllScreens();
  document.getElementById('gameOverScreen').classList.add('active');
}

// Fonction pour masquer tous les écrans
function hideAllScreens() {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
}
