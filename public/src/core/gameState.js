/**
 * @fileoverview Gestion de l'état global du jeu Planning Poker
 * @module GameState
 * @version 1.0.0
 * @description Module immuable pour la gestion centralisée de l'état du jeu.
 * Utilise la spread operator pour garantir l'immuabilité des données.
 */

/**
 * État par défaut du jeu Planning Poker
 * 
 * Contient toutes les propriétés nécessaires pour gérer une session de Planning Poker :
 * - Backlog et tâches
 * - Joueurs et leurs votes
 * - État du jeu (en cours, pause, fin)
 * - Résultats et estimations
 * 
 * @type {Object}
 * 
 * @property {Array<Object>} backlog - Liste des tâches à estimer
 * @property {number} backlog[].id - Identifiant unique de la tâche
 * @property {string} backlog[].name - Nom/titre de la tâche
 * @property {string} backlog[].description - Description optionnelle
 * 
 * @property {number} currentTaskIndex - Index de la tâche actuelle (0-based)
 * Correspond à la position dans le tableau backlog
 * 
 * @property {number} currentRound - Numéro du round actuel (1, 2, 3, ...)
 * Increment quand on fait un nouveau round pour la même tâche
 * 
 * @property {Array<Object>} players - Liste des joueurs connectés à la session
 * @property {string} players[].id - ID unique du joueur
 * @property {string} players[].name - Pseudo/nom du joueur
 * @property {boolean} players[].hasVoted - Si le joueur a voté ce round
 * @property {string|number} players[].vote - Valeur du vote courant
 * 
 * @property {Object<string, string|number>} votes - Votes du round actuel
 * Format: {playerName: voteValue} ou {playerId: voteValue}
 * Exemple: {'Alice': '8', 'Bob': '5', 'Charlie': '8'}
 * 
 * @property {boolean} hasVoted - Si le joueur actuel (client) a voté
 * Utilisé pour savoir si on peut afficher un message "Vous avez voté"
 * 
 * @property {boolean} isGameStarted - Si le jeu a commencé (backlog chargé)
 * Passe à true quand le créateur lance le jeu avec un backlog
 * 
 * @property {boolean} showNextRoundButton - Afficher le bouton pour le prochain round
 * True si votes divergents, False si unanimes
 * 
 * @property {Array<string>} coffeeBreakPlayers - Joueurs actuellement en pause café
 * Noms des joueurs qui ont pris une pause
 * 
 * @property {Object} allVotes - Historique complet des votes par tâche/round
 * Format: {taskIndex: {round: {playerId: vote}}}
 * Exemple: {0: {1: {'Alice': '8', 'Bob': '5'}, 2: {'Alice': '8', 'Bob': '8'}}}
 * Permet de tracker tous les votes précédents
 * 
 * @property {Array<string>} completedTasks - Tâches estimées et terminées
 * Contient les indices des tâches complétées
 * 
 * @property {Object<string, number>} taskEstimates - Estimations finales par tâche
 * Format: {taskIndex: finalValue}
 * Exemple: {0: 8, 1: 5, 2: 13}
 * Valeur retenue (unanime ou médiane)
 * 
 * @property {boolean} isUnanimous - Tous les joueurs ont voté identiquement
 * True si tous les votes sont la même valeur
 * 
 * @property {string|number} finalValue - Valeur finale retenue
 * Peut être: valeur unanime (si tous les votes identiques)
 * ou valeur médiane (si votes divergents)
 * 
 * @property {string|number} medianValue - Valeur médiane des votes
 * Calculée avec la formule standard des statistiques
 * Utilisée si votes divergents et pas d'unanimité
 * 
 * @property {Object} currentTaskVotes - Votes de la tâche sauvegardés avant pause
 * Permet de restaurer l'état lors d'une reprise de session
 * 
 * @property {number} currentTaskRound - Round sauvegardé de la tâche actuelle
 * Utilisé lors d'une pause café pour mémoriser le round
 * 
 * @example
 * import { defaultGameState, updateGameState } from './gameState.js';
 * 
 * // Utilisation basique
 * let gameState = JSON.parse(JSON.stringify(defaultGameState)); // Clone profond
 * 
 * // Mise à jour immuable
 * gameState = updateGameState(gameState, { 
 *   currentRound: 2,
 *   hasVoted: true,
 *   votes: { 'Alice': '8', 'Bob': '8' }
 * });
 * 
 * // Accès aux données
 * console.log(gameState.currentTaskIndex); // 0
 * console.log(gameState.players.length);   // nombre de joueurs
 * console.log(gameState.votes);             // votes actuels
 */
export const defaultGameState = {
  // ========== BACKLOG & TÂCHES ==========
  backlog: [],
  currentTaskIndex: 0,
  currentRound: 1,

  // ========== JOUEURS ==========
  players: [],

  // ========== VOTES ==========
  votes: {},
  hasVoted: false,
  allVotes: {},

  // ========== ÉTAT DU JEU ==========
  isGameStarted: false,
  showNextRoundButton: false,
  coffeeBreakPlayers: [],

  // ========== RÉSULTATS & ESTIMATIONS ==========
  completedTasks: [],
  taskEstimates: {},
  isUnanimous: false,
  finalValue: null,
  medianValue: null,

  // ========== REPRISE DE SESSION ==========
  currentTaskVotes: {},
  currentTaskRound: 1,
};

/**
 * Met à jour l'état du jeu de manière immuable
 * 
 * Utilise la spread operator (...) pour créer un nouvel objet
 * sans modifier l'original. Ceci est crucial pour :
 * - La réactivité (détection de changements)
 * - L'historique (possibilité d'annuler/refaire)
 * - La prédictibilité (éviter les mutations cachées)
 * 
 * @function updateGameState
 * @param {Object} gameState - L'état actuel du jeu
 * @param {Object} newData - Les nouvelles données à fusionner
 * @returns {Object} Nouvel objet d'état avec les modifications appliquées
 * @throws {TypeError} Si gameState n'est pas un objet
 * 
 * @example
 * // Exemple basique - mise à jour simple
 * const updatedState = updateGameState(gameState, { 
 *   currentRound: 2 
 * });
 * 
 * @example
 * // Exemple complet - plusieurs propriétés
 * const updatedState = updateGameState(gameState, { 
 *   currentRound: 2,
 *   hasVoted: true,
 *   votes: { 
 *     'Alice': '5', 
 *     'Bob': '8' 
 *   },
 *   players: gameState.players.map(p => ({
 *     ...p,
 *     hasVoted: p.name === 'Alice' || p.name === 'Bob'
 *   }))
 * });
 * 
 * @example
 * // Exemple avec spread sur les votes
 * const updatedState = updateGameState(gameState, {
 *   votes: {
 *     ...gameState.votes,
 *     'Charlie': '13'  // Ajoute un nouveau vote
 *   }
 * });
 * 
 * @example
 * // Exemple d'ajout de joueur
 * const updatedState = updateGameState(gameState, {
 *   players: [
 *     ...gameState.players,
 *     {
 *       id: 'player-4',
 *       name: 'Diana',
 *       hasVoted: false,
 *       vote: null
 *     }
 *   ]
 * });
 * 
 * @description
 * ⚠️ Important: Cette fonction crée une copie superficielle (shallow copy).
 * Pour les modifications imbriquées (objets/tableaux), utilisez spread operator :
 * 
 * // ✅ CORRECT - Immuable
 * updateGameState(gameState, {
 *   votes: { ...gameState.votes, newVote: '8' }
 * });
 * 
 * // ❌ INCORRECT - Mutation
 * gameState.votes['newVote'] = '8';
 */
export function updateGameState(gameState, newData) {
  // Validation du paramètre gameState
  if (typeof gameState !== 'object' || gameState === null) {
    throw new TypeError(
      'gameState doit être un objet. Reçu: ' + typeof gameState
    );
  }

  // Validation du paramètre newData (optionnel mais recommandé)
  if (newData && typeof newData !== 'object') {
    throw new TypeError(
      'newData doit être un objet. Reçu: ' + typeof newData
    );
  }

  // Retourner un nouvel objet avec la fusion des données
  // spread operator (...gameState) copie toutes les propriétés
  // spread operator (...newData) les écrase avec les nouvelles valeurs
  return { ...gameState, ...newData };
}

/**
 * Clone profond de l'état du jeu
 * 
 * Utile pour créer une copie complètement indépendante
 * (y compris les objets et tableaux imbriqués)
 * 
 * @function deepCloneGameState
 * @param {Object} gameState - L'état à cloner
 * @returns {Object} Copie profonde de l'état
 * 
 * @example
 * const clonedState = deepCloneGameState(gameState);
 * clonedState.votes['Alice'] = '13'; // N'affecte pas gameState original
 */
export function deepCloneGameState(gameState) {
  return JSON.parse(JSON.stringify(gameState));
}

/**
 * Réinitialise l'état du jeu à la valeur par défaut
 * 
 * @function resetGameState
 * @returns {Object} État du jeu réinitialisé
 * 
 * @example
 * gameState = resetGameState();
 */
export function resetGameState() {
  return deepCloneGameState(defaultGameState);
}

/**
 * Ajoute un joueur à l'état du jeu
 * 
 * @function addPlayerToGameState
 * @param {Object} gameState - L'état actuel
 * @param {Object} player - Le joueur à ajouter
 * @param {string} player.id - ID unique du joueur
 * @param {string} player.name - Pseudo du joueur
 * @returns {Object} Nouvel état avec le joueur ajouté
 * 
 * @example
 * const newState = addPlayerToGameState(gameState, {
 *   id: 'player-1',
 *   name: 'Alice',
 *   hasVoted: false,
 *   vote: null
 * });
 */
export function addPlayerToGameState(gameState, player) {
  return updateGameState(gameState, {
    players: [...gameState.players, player]
  });
}

/**
 * Supprime un joueur de l'état du jeu
 * 
 * @function removePlayerFromGameState
 * @param {Object} gameState - L'état actuel
 * @param {string} playerId - ID du joueur à supprimer
 * @returns {Object} Nouvel état avec le joueur supprimé
 * 
 * @example
 * const newState = removePlayerFromGameState(gameState, 'player-1');
 */
export function removePlayerFromGameState(gameState, playerId) {
  return updateGameState(gameState, {
    players: gameState.players.filter(p => p.id !== playerId)
  });
}

/**
 * Enregistre un vote dans l'état
 * 
 * @function recordVote
 * @param {Object} gameState - L'état actuel
 * @param {string} playerName - Nom du joueur
 * @param {string|number} voteValue - Valeur votée
 * @returns {Object} Nouvel état avec le vote enregistré
 * 
 * @example
 * const newState = recordVote(gameState, 'Alice', '8');
 */
export function recordVote(gameState, playerName, voteValue) {
  return updateGameState(gameState, {
    votes: {
      ...gameState.votes,
      [playerName]: voteValue
    }
  });
}

/**
 * Réinitialise les votes du round courant
 * 
 * @function resetRoundVotes
 * @param {Object} gameState - L'état actuel
 * @returns {Object} Nouvel état avec votes réinitialisés
 * 
 * @example
 * const newState = resetRoundVotes(gameState);
 */
export function resetRoundVotes(gameState) {
  return updateGameState(gameState, {
    votes: {},
    hasVoted: false,
    players: gameState.players.map(p => ({
      ...p,
      hasVoted: false,
      vote: null
    }))
  });
}

/**
 * Sauvegarde les votes avant une action (ex: pause café)
 * 
 * @function saveCurrentVotes
 * @param {Object} gameState - L'état actuel
 * @returns {Object} Nouvel état avec votes sauvegardés
 * 
 * @example
 * const newState = saveCurrentVotes(gameState);
 */
export function saveCurrentVotes(gameState) {
  return updateGameState(gameState, {
    currentTaskVotes: { ...gameState.votes },
    currentTaskRound: gameState.currentRound
  });
}

/**
 * Calcule si les votes sont unanimes
 * 
 * @function areVotesUnanimous
 * @param {Object} votes - Objet des votes {playerName: voteValue}
 * @returns {boolean} True si tous les votes sont identiques
 * 
 * @example
 * const unanimous = areVotesUnanimous({'Alice': '8', 'Bob': '8'});
 * // Returns: true
 * 
 * @example
 * const unanimous = areVotesUnanimous({'Alice': '8', 'Bob': '5'});
 * // Returns: false
 */
export function areVotesUnanimous(votes) {
  const voteValues = Object.values(votes);
  if (voteValues.length === 0) return false;
  
  const firstVote = voteValues[0];
  return voteValues.every(vote => vote === firstVote);
}

/**
 * Calcule la médiane des votes
 * 
 * @function calculateMedian
 * @param {Object} votes - Objet des votes {playerName: voteValue}
 * @returns {string|number} La valeur médiane
 * 
 * @example
 * const median = calculateMedian({'Alice': '5', 'Bob': '8', 'Charlie': '13'});
 * // Returns: '8'
 * 
 * @description
 * Convertit les valeurs en nombres, trie et retourne la valeur du milieu
 * Pour un nombre pair d'éléments, retourne la moyenne des deux du milieu
 */
export function calculateMedian(votes) {
  const voteValues = Object.values(votes)
    .map(v => {
      const num = parseInt(v, 10);
      return isNaN(num) ? 0 : num;
    })
    .sort((a, b) => a - b);

  if (voteValues.length === 0) return null;
  
  const middle = Math.floor(voteValues.length / 2);
  
  if (voteValues.length % 2 === 1) {
    return voteValues[middle];
  }
  
  // Moyenne des deux valeurs du milieu
  return Math.round((voteValues[middle - 1] + voteValues[middle]) / 2);
}

/**
 * Enregistre une tâche comme complétée
 * 
 * @function completeTask
 * @param {Object} gameState - L'état actuel
 * @param {number} taskIndex - Index de la tâche
 * @param {string|number} estimateValue - Valeur d'estimation
 * @returns {Object} Nouvel état avec tâche complétée
 * 
 * @example
 * const newState = completeTask(gameState, 0, '8');
 */
export function completeTask(gameState, taskIndex, estimateValue) {
  return updateGameState(gameState, {
    completedTasks: [...gameState.completedTasks, taskIndex],
    taskEstimates: {
      ...gameState.taskEstimates,
      [taskIndex]: estimateValue
    }
  });
}

/**
 * Vérifie si une tâche est complétée
 * 
 * @function isTaskCompleted
 * @param {Object} gameState - L'état actuel
 * @param {number} taskIndex - Index de la tâche
 * @returns {boolean} True si la tâche est complétée
 * 
 * @example
 * const completed = isTaskCompleted(gameState, 0);
 */
export function isTaskCompleted(gameState, taskIndex) {
  return gameState.completedTasks.includes(taskIndex);
}

/**
 * Progresse vers la tâche suivante
 * 
 * @function nextTask
 * @param {Object} gameState - L'état actuel
 * @returns {Object} Nouvel état avec tâche suivante
 * 
 * @description
 * Incremente currentTaskIndex et réinitialise le round à 1
 * 
 * @example
 * const newState = nextTask(gameState);
 */
export function nextTask(gameState) {
  const nextIndex = Math.min(
    gameState.currentTaskIndex + 1,
    gameState.backlog.length - 1
  );

  return updateGameState(gameState, {
    currentTaskIndex: nextIndex,
    currentRound: 1,
    votes: {},
    hasVoted: false,
    players: gameState.players.map(p => ({
      ...p,
      hasVoted: false,
      vote: null
    }))
  });
}

/**
 * Progresse vers le round suivant (même tâche)
 * 
 * @function nextRound
 * @param {Object} gameState - L'état actuel
 * @returns {Object} Nouvel état avec round suivant
 * 
 * @example
 * const newState = nextRound(gameState);
 */
export function nextRound(gameState) {
  return updateGameState(gameState, {
    currentRound: gameState.currentRound + 1,
    votes: {},
    hasVoted: false,
    players: gameState.players.map(p => ({
      ...p,
      hasVoted: false,
      vote: null
    }))
  });
}

/**
 * Vérifie si le jeu est terminé
 * 
 * @function isGameOver
 * @param {Object} gameState - L'état actuel
 * @returns {boolean} True si toutes les tâches sont complétées
 * 
 * @example
 * if (isGameOver(gameState)) {
 *   app.showGameOverScreen();
 * }
 */
export function isGameOver(gameState) {
  return (
    gameState.backlog.length > 0 &&
    gameState.completedTasks.length === gameState.backlog.length
  );
}

/**
 * Génère un résumé de la partie
 * 
 * @function generateGameSummary
 * @param {Object} gameState - L'état actuel
 * @returns {Object} Résumé avec statistiques
 * 
 * @example
 * const summary = generateGameSummary(gameState);
 * console.log(summary.totalTasks);
 * console.log(summary.completedTasks);
 * console.log(summary.totalRounds);
 */
export function generateGameSummary(gameState) {
  const totalTasks = gameState.backlog.length;
  const completedTasks = gameState.completedTasks.length;
  const averageRounds = Math.round(
    Object.keys(gameState.allVotes).reduce(
      (sum, taskIndex) => {
        const rounds = Object.keys(gameState.allVotes[taskIndex] || {}).length;
        return sum + rounds;
      },
      0
    ) / (totalTasks || 1)
  );

  return {
    totalTasks,
    completedTasks,
    remainingTasks: totalTasks - completedTasks,
    totalRounds: gameState.currentRound,
    averageRounds,
    estimates: gameState.taskEstimates,
    completionPercentage: Math.round((completedTasks / totalTasks) * 100)
  };
}
