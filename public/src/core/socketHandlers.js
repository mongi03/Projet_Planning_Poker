/**
 * @fileoverview Gestionnaire des événements Socket.io côté client
 * @module SocketHandlers
 * @version 1.0.0
 * @requires socket.io-client
 * @requires ../ui/components/PlayerList.js
 */

/**
 * Configure tous les listeners Socket.io pour le client
 * 
 * Gère les événements de connexion, déconnexion, mises à jour de session,
 * votes et synchronisation de l'état du jeu avec le serveur.
 * 
 * @function setupSocketHandlers
 * @param {Object} socket - Instance Socket.io client (io())
 * @param {Object} gameState - Objet d'état du jeu (référence)
 * @param {PlanningPokerClient} app - Instance de PlanningPokerClient
 * @returns {void}
 * 
 * @example
 * import { setupSocketHandlers } from './socketHandlers.js'
 * const socket = io('http://localhost:3000')
 * setupSocketHandlers(socket, gameState, pokerApp)
 * 
 * @description
 * Ce module gère les événements suivants :
 * - connect/disconnect : Gestion de la connexion
 * - session-info : Reçoit les infos de session
 * - player-joined : Un joueur a rejoint
 * - backlog-loaded : Reçoit la liste des tâches
 * - vote-status : Reçoit le statut des votes
 * - show-results : Affiche les résultats
 * - new-round : Passe au round suivant
 * - next-task : Passe à la tâche suivante
 * - coffee-break : Pause café
 * - game-over : Fin de la partie
 * - player-left : Un joueur a quitté
 */
export function setupSocketHandlers(socket, gameState, app) {
  /**
   * Événement de connexion établie
   * @event connect
   * @description Appelé quand le client se connecte au serveur
   */
  socket.on('connect', () => {
    console.log('✅ Connecté au serveur (socket: ' + socket.id + ')');
    app.isConnected = true;
    app.updateConnectionStatus();
  });

  /**
   * Événement de déconnexion
   * @event disconnect
   * @description Appelé quand la connexion au serveur est perdue
   */
  socket.on('disconnect', () => {
    console.log('❌ Déconnecté du serveur');
    app.isConnected = false;
    app.updateConnectionStatus();
  });

  /**
   * Événement d'erreur Socket.io
   * @event error
   * @param {Object} data - Données d'erreur
   * @param {string} data.message - Message d'erreur
   * @description Gère les erreurs de connexion ou de communication
   */
  socket.on('error', (data) => {
    console.error('⚠️ Erreur Socket:', data);
    alert('Erreur: ' + (data?.message || 'Erreur inconnue'));
  });

  /**
   * Reçoit les informations de session du serveur
   * @event session-info
   * @param {Object} data - Données de session
   * @param {string} data.code - Code de session
   * @param {Array<Object>} data.players - Liste des joueurs
   * @param {Array<Object>} data.backlog - Liste des tâches
   * @param {boolean} data.isGameStarted - État du jeu
   * @description Met à jour l'état local avec les infos de session
   */
  socket.on('session-info', (data) => {
    console.log('📋 Infos session reçues:', data);
    gameState.players = data.players || [];
    gameState.isGameStarted = data.backlog && data.backlog.length > 0;
    app.renderWaitingPlayers();
    
    if (app.isRestoredSession) {
      app.updateResumeWaitingScreen();
    }
  });

  /**
   * Notifie qu'un nouveau joueur a rejoint la session
   * @event player-joined
   * @param {Object} data - Données du nouvel événement
   * @param {string} data.newPlayer - Nom du nouveau joueur
   * @param {Array<Object>} data.allPlayers - Liste complète des joueurs
   * @description Met à jour la liste des joueurs et affiche les changements
   */
  socket.on('player-joined', (data) => {
    console.log(`➕ Joueur rejoint: ${data.newPlayer}`);
    gameState.players = data.allPlayers || [];
    app.renderWaitingPlayers();
    app.updateParticipantCounter();
    
    if (app.isRestoredSession) {
      app.updateResumeWaitingScreen();
    }
  });

  /**
   * Reçoit le backlog et initialise le jeu
   * @event backlog-loaded
   * @param {Object} data - Données du backlog
   * @param {Array<Object>} data.backlog - Tâches à estimer
   * @param {number} data.currentTaskIndex - Index de la tâche courante
   * @param {number} data.currentRound - Numéro du round courant
   * @param {Object} data.votes - Votes précédents (si restauré)
   * @param {Array<string>} data.completedTasks - Tâches déjà estimées
   * @param {Object} data.taskEstimates - Estimations finales
   * @param {boolean} data.isRestored - Si la session est restaurée
   * @param {Object} data.lastVotes - Derniers votes (si restauré)
   * @description Charge le backlog et affiche l'écran de jeu ou les résultats
   */
  socket.on('backlog-loaded', (data) => {
    console.log('📥 Backlog reçu:', data);
    gameState.backlog = data.backlog || [];
    gameState.currentTaskIndex = data.currentTaskIndex || 0;
    gameState.currentRound = data.currentRound || 1;
    gameState.isGameStarted = true;
    gameState.allVotes = data.votes || {};
    gameState.completedTasks = data.completedTasks || [];
    gameState.taskEstimates = data.taskEstimates || {};
    
    // Réinitialiser les votes actuels
    gameState.votes = {};
    gameState.players.forEach(p => {
      p.hasVoted = false;
      p.vote = null;
    });

    // Afficher les résultats restaurés ou commencer le jeu
    if (app.isRestoredSession && data.lastVotes) {
      app.showRestoredResults(data);
    } else {
      app.showGameScreen();
    }
  });

  /**
   * Reçoit le statut actuel des votes
   * @event vote-status
   * @param {Object} data - Données de statut
   * @param {Array<Object>} data.players - Joueurs avec statut hasVoted
   * @param {number} data.votedCount - Nombre de votes reçus
   * @param {number} data.totalCount - Nombre total de joueurs
   * @description Met à jour la liste des joueurs et la barre de progression
   */
  socket.on('vote-status', (data) => {
    console.log('📊 Statut votes:', data);
    gameState.players = data.players || [];
    
    const votedCount = data.votedCount || 0;
    const totalCount = data.totalCount || 0;
    console.log(`🗳️ Votes reçus: ${votedCount}/${totalCount}`);

    // Mettre à jour l'affichage
    app.renderPlayersList();
    app.updateProgressBar();

    // Vérifier si tous les joueurs ont voté
    if (votedCount === totalCount && totalCount > 0) {
      console.log('✅ TOUS LES JOUEURS ONT VOTÉ - En attente des résultats...');
    }
  });

  /**
   * Reçoit et affiche les résultats du vote
   * @event show-results
   * @param {Object} data - Résultats du vote
   * @param {Object} data.votes - Votes par joueur {playerName: value}
   * @param {number} data.round - Numéro du round
   * @param {string|number} data.medianValue - Valeur médiane
   * @param {string|number} data.finalValue - Valeur finale retenue
   * @param {boolean} data.isUnanimous - Tous les votes identiques
   * @param {boolean} data.showNextRoundButton - Afficher bouton next round
   * @description Affiche l'écran de résultats avec les statistiques
   */
  socket.on('show-results', (data) => {
    console.log('📈 Résultats affichés:', data);
    gameState.votes = data.votes || {};
    gameState.showNextRoundButton = data.showNextRoundButton || false;
    gameState.currentRound = data.round;
    gameState.isUnanimous = data.isUnanimous || false;
    gameState.finalValue = data.finalValue || data.medianValue;
    gameState.medianValue = data.medianValue;
    
    app.showResults();
  });

  /**
   * Initialise un nouveau round de votes
   * @event new-round
   * @param {Object} data - Données du nouveau round
   * @param {number} data.currentRound - Numéro du round
   * @param {number} data.currentTaskIndex - Index de la tâche
   * @description Réinitialise les votes et affiche l'écran de jeu
   */
  socket.on('new-round', (data) => {
    console.log('🔄 Nouveau round:', data);
    gameState.currentRound = data.currentRound;
    gameState.currentTaskIndex = data.currentTaskIndex;
    gameState.hasVoted = false;
    gameState.votes = {};
    
    // Réinitialiser les votes des joueurs
    gameState.players.forEach(p => {
      p.hasVoted = false;
      p.vote = null;
    });

    app.showGameScreen();
  });

  /**
   * Passe à la tâche suivante
   * @event next-task
   * @param {Object} data - Données de la nouvelle tâche
   * @param {number} data.currentTaskIndex - Index de la nouvelle tâche
   * @param {number} data.currentRound - Round de démarrage
   * @description Réinitialise les votes et affiche la nouvelle tâche
   */
  socket.on('next-task', (data) => {
    console.log('➡️ Tâche suivante:', data);
    gameState.currentTaskIndex = data.currentTaskIndex || 0;
    gameState.currentRound = data.currentRound || 1;
    gameState.hasVoted = false;
    gameState.votes = {};
    
    // Réinitialiser les votes des joueurs
    gameState.players.forEach(p => {
      p.hasVoted = false;
      p.vote = null;
    });

    app.showGameScreen();
  });

  /**
   * Notifie une pause café
   * @event coffee-break
   * @param {Object} data - Données de pause
   * @param {Array<string>} data.players - Joueurs en pause
   * @description Sauvegarde les votes courants et affiche l'écran de pause
   */
  socket.on('coffee-break', (data) => {
    console.log('☕ Pause café');
    gameState.coffeeBreakPlayers = data.players || [];
    // Sauvegarder les votes avant la pause
    gameState.currentTaskVotes = gameState.votes || {};
    gameState.currentTaskRound = gameState.currentRound;
    
    app.showCoffeeBreakScreen();
  });

  /**
   * Notifie la fin de la partie
   * @event game-over
   * @description Affiche l'écran de fin de partie
   */
  socket.on('game-over', () => {
    console.log('✅ Partie terminée');
    app.showGameOverScreen();
  });

  /**
   * Notifie qu'un joueur a quitté
   * @event player-left
   * @param {Object} data - Données du joueur qui a quitté
   * @param {string} data.playerName - Nom du joueur
   * @description Supprime le joueur de la liste et met à jour l'affichage
   */
  socket.on('player-left', (data) => {
    console.log(`❌ ${data?.playerName || 'Un joueur'} a quitté`);
    gameState.players = gameState.players.filter(p => p.name !== data?.playerName);
    app.renderPlayersList();
    app.updateParticipantCounter();
  });

  console.log('✅ Socket handlers configurés');
}

/**
 * Fonction utilitaire pour émettre un vote
 * @function emitVote
 * @param {Object} socket - Instance Socket.io
 * @param {string} sessionCode - Code de session
 * @param {string} playerName - Nom du joueur
 * @param {string|number} vote - Valeur du vote
 * @returns {void}
 * @example
 * emitVote(socket, 'ABC123', 'Alice', '8')
 */
export function emitVote(socket, sessionCode, playerName, vote) {
  socket.emit('vote', {
    sessionCode,
    playerName,
    vote,
  });
  console.log(`🗳️ Vote émis: ${playerName} → ${vote}`);
}

/**
 * Fonction utilitaire pour demander la tâche suivante
 * @function emitNextTask
 * @param {Object} socket - Instance Socket.io
 * @param {string} sessionCode - Code de session
 * @returns {void}
 * @example
 * emitNextTask(socket, 'ABC123')
 */
export function emitNextTask(socket, sessionCode) {
  socket.emit('next-task', { sessionCode });
  console.log('➡️ Demande tâche suivante');
}

/**
 * Fonction utilitaire pour demander un nouveau round
 * @function emitNewRound
 * @param {Object} socket - Instance Socket.io
 * @param {string} sessionCode - Code de session
 * @returns {void}
 * @example
 * emitNewRound(socket, 'ABC123')
 */
export function emitNewRound(socket, sessionCode) {
  socket.emit('new-round', { sessionCode });
  console.log('🔄 Demande nouveau round');
}
