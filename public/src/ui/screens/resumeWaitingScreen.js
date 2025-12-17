// ui/screens/resumeWaitingScreen.js

// Affiche l'écran d'attente de reprise
export function showResumeWaitingScreen(app) {
  app.hideAllScreens();
  document.getElementById('resumeWaitingScreen').classList.add('active');
  document.getElementById('resumeSessionCode').textContent = app.sessionCode;
  renderResumeParticipants(app);
  updateResumeWaitingScreen(app);
}

// Rend la liste des participants pour la reprise
export function renderResumeParticipants(app) {
  const container = document.getElementById('resumeParticipantsList');
  container.innerHTML = '';
  const connected = (app.gameState.players || []).map(p => p.name);

  if (connected.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">En attente de joueurs...</div>';
    return;
  }

  connected.forEach(name => {
    const div = document.createElement('div');
    div.className = `participant-item joined`;
    div.innerHTML = `
      <span>✓ ${name}</span>
      <span style="margin-left: auto; font-size: 12px; color: #10b981;">Connecté</span>
    `;
    container.appendChild(div);
  });
}

// Met à jour la barre de progression et le bouton
export function updateResumeWaitingScreen(app) {
  const connected = (app.gameState.players || []).map(p => p.name);
  const count = connected.length;
  
  // ✅ Calculer le nombre max (nombre initial de joueurs)
  // On peut le stocker dans app.expectedParticipantCount
  const max = app.expectedParticipantCount || count;

  // Barre de progression
  const percentage = max > 0 ? (count / max) * 100 : 0;
  document.getElementById('resumeProgressFill').style.width = percentage + '%';
  
  // Texte du compteur: "2 / 4 joueurs connectés"
  document.getElementById('resumeProgressText').textContent = `${count} / ${max} joueurs connectés`;

  // ✅ Bouton "Relancer la partie" - actif seulement si au moins 1 joueur connecté
  const startBtn = document.getElementById('startResumedGameBtn');
  if (startBtn) {
    startBtn.disabled = count === 0; // Désactivé si personne n'est connecté
    
    // Optionnel: ne laisser démarrer que si tous sont connectés
    // startBtn.disabled = count < max;
  }
}

// ✅ NOUVELLE FONCTION: Démarrer la partie
export function startResumedGame(app) {
  const connected = app.gameState.players.length;
  
  if (connected === 0) {
    alert('❌ Aucun joueur connecté. Impossible de démarrer.');
    return;
  }

  // Charger le backlog et démarrer le jeu
  app.socket.emit('load-backlog', {
    sessionCode: app.sessionCode,
    backlog: app.localBacklog,
    isRestored: false
  });

  console.log(`✅ Partie lancée avec ${connected} joueur(s)`);
}
