/**
 * @fileoverview Module de validation des données utilisateur
 * @module Validations
 * @version 1.0.0
 * @description Fonctions de validation pour les noms de joueurs, codes de session,
 * backlogs et autres données critiques du jeu.
 */

/**
 * Valide le nom/pseudo d'un joueur
 * 
 * Règles:
 * - Minimum 2 caractères
 * - Maximum 50 caractères
 * - Peut contenir lettres, chiffres, espaces, tirets, underscores
 * - Pas de caractères spéciaux dangereux
 * 
 * @function validatePlayerName
 * @param {string} name - Le pseudo à valider
 * @returns {boolean} True si valide, sinon lance une erreur
 * @throws {Error} Si le nom ne respecte pas les règles
 * @example
 * try {
 *   validatePlayerName('Alice');
 *   console.log('Valide');
 * } catch (e) {
 *   console.error(e.message);
 * }
 * 
 * // Exemples valides:
 * // 'Alice', 'Bob_Smith', 'Player-1', 'Jean Marie'
 * 
 * // Exemples invalides:
 * // 'A' (trop court)
 * // 'Player@123' (caractère spécial)
 * // '' (vide)
 */
export function validatePlayerName(name) {
  // Vérifier que c'est une chaîne
  if (typeof name !== 'string') {
    throw new Error('Le pseudo doit être un texte.');
  }

  // Trim les espaces avant/après
  const trimmedName = name.trim();

  // Vérifier la longueur minimale
  if (trimmedName.length < 2) {
    throw new Error('Le pseudo doit faire au moins 2 caractères.');
  }

  // Vérifier la longueur maximale
  if (trimmedName.length > 50) {
    throw new Error('Le pseudo ne doit pas dépasser 50 caractères.');
  }

  // Vérifier que le nom ne contient que des caractères autorisés
  // Lettres, chiffres, espaces, tirets, underscores
  const validPattern = /^[a-zA-Z0-9\s\-_éèêëàâäùûüöïîôçñ]+$/;
  if (!validPattern.test(trimmedName)) {
    throw new Error('Le pseudo contient des caractères non autorisés.');
  }

  return true;
}

/**
 * Valide un code de session
 * 
 * Règles:
 * - Exactement 6 caractères alphanumériques
 * - Format: ABC123 (3 lettres + 3 chiffres, généralement)
 * - Case-insensitive (converti en majuscules)
 * 
 * @function validateSessionCode
 * @param {string} code - Le code de session à valider
 * @returns {string} Code validé et normalisé (majuscules)
 * @throws {Error} Si le code n'est pas valide
 * @example
 * const code = validateSessionCode('abc123');
 * console.log(code); // 'ABC123'
 * 
 * // Valides: 'ABC123', 'xyz789', 'aBc123'
 * // Invalides: 'AB12', 'ABCD@123', ''
 */
export function validateSessionCode(code) {
  // Vérifier que c'est une chaîne
  if (typeof code !== 'string') {
    throw new Error('Le code de session doit être un texte.');
  }

  const trimmedCode = code.trim().toUpperCase();

  // Vérifier la longueur exacte
  if (trimmedCode.length !== 6) {
    throw new Error('Le code de session doit faire exactement 6 caractères.');
  }

  // Vérifier que c'est alphanumériques seulement
  if (!/^[A-Z0-9]{6}$/.test(trimmedCode)) {
    throw new Error('Le code doit contenir seulement des lettres et chiffres.');
  }

  return trimmedCode;
}

/**
 * Valide un backlog (liste de tâches)
 * 
 * Règles:
 * - Doit être un tableau
 * - Au minimum 1 tâche
 * - Au maximum 100 tâches
 * - Chaque tâche doit être un objet avec propriétés valides
 * 
 * @function validateBacklog
 * @param {Array} backlog - Le backlog à valider
 * @param {string} backlog[].id - Identifiant unique de la tâche
 * @param {string} backlog[].name - Nom/titre de la tâche
 * @param {string} backlog[].description - Description optionnelle
 * @returns {boolean} True si valide
 * @throws {Error} Si le backlog n'est pas valide
 * @example
 * const backlog = [
 *   { id: '1', name: 'Créer login', description: 'Écran de connexion' },
 *   { id: '2', name: 'Dashboard', description: '' }
 * ];
 * validateBacklog(backlog);
 */
export function validateBacklog(backlog) {
  // Vérifier que c'est un tableau
  if (!Array.isArray(backlog)) {
    throw new Error('Le backlog doit être un tableau de tâches.');
  }

  // Vérifier que le tableau n'est pas vide
  if (backlog.length === 0) {
    throw new Error('Le backlog doit contenir au moins 1 tâche.');
  }

  // Vérifier que le nombre de tâches n'est pas excessif
  if (backlog.length > 100) {
    throw new Error('Le backlog ne doit pas dépasser 100 tâches.');
  }

  // Valider chaque tâche
  backlog.forEach((task, index) => {
    if (typeof task !== 'object' || task === null) {
      throw new Error(`Tâche ${index + 1}: doit être un objet.`);
    }

    if (!task.id || typeof task.id !== 'string') {
      throw new Error(`Tâche ${index + 1}: doit avoir un ID unique.`);
    }

    if (!task.name || typeof task.name !== 'string') {
      throw new Error(`Tâche ${index + 1}: doit avoir un nom.`);
    }

    if (task.name.length < 2) {
      throw new Error(`Tâche ${index + 1}: le nom doit faire au moins 2 caractères.`);
    }

    if (task.name.length > 200) {
      throw new Error(`Tâche ${index + 1}: le nom ne doit pas dépasser 200 caractères.`);
    }
  });

  return true;
}

/**
 * Valide une valeur de vote (Fibonacci ou autre séquence)
 * 
 * Valeurs acceptées:
 * - '0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89'
 * - '?' (indécis)
 * - 'SKIP' (passer cette tâche)
 * 
 * @function validateVote
 * @param {string|number} vote - La valeur à voter
 * @returns {string} Valeur de vote normalisée
 * @throws {Error} Si la valeur n'est pas valide
 * @example
 * validateVote('8'); // '8'
 * validateVote('?'); // '?'
 * validateVote('ABC'); // Erreur
 */
export function validateVote(vote) {
  const validVotes = ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', 'SKIP'];
  const voteString = String(vote).toUpperCase();

  if (!validVotes.includes(voteString)) {
    throw new Error(
      'Vote invalide. Valeurs acceptées: ' + validVotes.join(', ')
    );
  }

  return voteString;
}

/**
 * Valide le nombre de participants attendus
 * 
 * Règles:
 * - Minimum 2 participants
 * - Maximum 30 participants
 * - Doit être un nombre entier
 * 
 * @function validateExpectedParticipants
 * @param {number} count - Nombre de participants attendus
 * @returns {number} Nombre validé
 * @throws {Error} Si le nombre n'est pas valide
 * @example
 * validateExpectedParticipants(5); // 5
 * validateExpectedParticipants('10'); // 10 (converti)
 * validateExpectedParticipants(1); // Erreur: minimum 2
 */
export function validateExpectedParticipants(count) {
  const num = parseInt(count, 10);

  if (isNaN(num)) {
    throw new Error('Le nombre de participants doit être un nombre.');
  }

  if (num < 2) {
    throw new Error('Au minimum 2 participants requis.');
  }

  if (num > 30) {
    throw new Error('Maximum 30 participants autorisés.');
  }

  if (!Number.isInteger(num)) {
    throw new Error('Le nombre de participants doit être un entier.');
  }

  return num;
}

/**
 * Valide un mode de jeu
 * 
 * Modes supportés:
 * - 'Fibonacci' - Séquence Fibonacci (0, 1, 2, 3, 5, 8, 13...)
 * - 'Shirt' - Tailles de vêtements (XS, S, M, L, XL, XXL)
 * - 'Days' - Jours (1, 2, 3, 5, 8, 13, 20, 30...)
 * 
 * @function validateGameMode
 * @param {string} mode - Le mode à valider
 * @returns {string} Mode validé
 * @throws {Error} Si le mode n'est pas valide
 * @example
 * validateGameMode('Fibonacci'); // 'Fibonacci'
 * validateGameMode('SHIRT'); // 'Shirt' (normalisé)
 * validateGameMode('Invalid'); // Erreur
 */
export function validateGameMode(mode) {
  const validModes = ['Fibonacci', 'Shirt', 'Days'];
  
  if (typeof mode !== 'string') {
    throw new Error('Le mode de jeu doit être un texte.');
  }

  const normalizedMode = mode.charAt(0).toUpperCase() + mode.slice(1).toLowerCase();

  if (!validModes.includes(normalizedMode)) {
    throw new Error(
      'Mode invalide. Modes acceptés: ' + validModes.join(', ')
    );
  }

  return normalizedMode;
}

/**
 * Valide l'email d'un utilisateur (optionnel)
 * 
 * @function validateEmail
 * @param {string} email - L'email à valider
 * @returns {boolean} True si valide
 * @throws {Error} Si l'email n'est pas valide
 * @example
 * validateEmail('alice@example.com'); // true
 * validateEmail('invalid.email'); // Erreur
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw new Error('Email invalide.');
  }

  return true;
}

/**
 * Valide une URL (pour les backlog import)
 * 
 * @function validateURL
 * @param {string} url - L'URL à valider
 * @returns {boolean} True si valide
 * @throws {Error} Si l'URL n'est pas valide
 * @example
 * validateURL('https://api.example.com/backlog');
 */
export function validateURL(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    throw new Error('URL invalide: ' + url);
  }
}

/**
 * Valide l'ensemble des données de création de session
 * 
 * Effectue une validation complète de tous les paramètres requis
 * pour créer une nouvelle session.
 * 
 * @function validateCreateSessionData
 * @param {Object} data - Données à valider
 * @param {string} data.creatorName - Nom du créateur
 * @param {string} data.gameMode - Mode de jeu
 * @param {number} data.expectedParticipants - Nombre de participants
 * @param {Array} data.backlog - Liste des tâches (optionnel)
 * @returns {boolean} True si tout est valide
 * @throws {Error} Si une donnée n'est pas valide
 * @example
 * validateCreateSessionData({
 *   creatorName: 'Alice',
 *   gameMode: 'Fibonacci',
 *   expectedParticipants: 5,
 *   backlog: [{ id: '1', name: 'Task 1' }]
 * });
 */
export function validateCreateSessionData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Les données doivent être un objet.');
  }

  // Valider le nom du créateur
  validatePlayerName(data.creatorName);

  // Valider le mode de jeu
  validateGameMode(data.gameMode);

  // Valider le nombre de participants
  validateExpectedParticipants(data.expectedParticipants);

  // Valider le backlog s'il existe
  if (data.backlog) {
    validateBacklog(data.backlog);
  }

  return true;
}

/**
 * Sanitize une chaîne pour éviter les injections XSS
 * 
 * @function sanitizeString
 * @param {string} str - Chaîne à nettoyer
 * @returns {string} Chaîne échappée
 * @private
 * @example
 * sanitizeString('<script>alert("xss")</script>');
 * // &lt;script&gt;alert("xss")&lt;/script&gt;
 */
export function sanitizeString(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
