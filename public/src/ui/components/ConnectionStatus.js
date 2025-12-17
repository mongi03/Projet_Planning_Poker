/**
 * @fileoverview Composant ConnectionStatus - Indicateur de statut de connexion
 * @module ConnectionStatus
 * @version 1.0.0
 * 
 * @description
 * Composant qui affiche visuellement le statut de connexion au serveur.
 * Affiche "Connecté" ou "Déconnecté" avec styling approprié.
 */

/**
 * Met à jour l'indicateur de statut de connexion
 * 
 * Affiche "Connecté" ou "Déconnecté" selon l'état de la connexion.
 * Ajoute/retire la classe 'connected' pour le styling.
 * 
 * @function updateConnectionStatus
 * @param {boolean} isConnected - True si connecté, false sinon
 * @returns {void}
 * 
 * @description
 * Processus:
 * - Récupère les éléments #connectionStatus et #connectionText
 * - Si connecté:
 *   - Ajoute la classe 'connected'
 *   - Affiche "Connecté"
 * - Si déconnecté:
 *   - Retire la classe 'connected'
 *   - Affiche "Déconnecté"
 * 
 * @example
 * import { updateConnectionStatus } from '../components/ConnectionStatus.js'
 * 
 * // Quand connecté au serveur
 * updateConnectionStatus(true)
 * // Affiche "Connecté" avec styling connected
 * 
 * // Quand déconnecté du serveur
 * updateConnectionStatus(false)
 * // Affiche "Déconnecté" avec styling normal
 */
export function updateConnectionStatus(isConnected) {
  const status = document.getElementById('connectionStatus');
  const text = document.getElementById('connectionText');
  if (isConnected) {
    status.classList.add('connected');
    text.textContent = 'Connecté';
  } else {
    status.classList.remove('connected');
    text.textContent = 'Déconnecté';
  }
}