# 🎯 Planning Poker Pro

**Une application web complète et interactive de Planning Poker utilisant Socket.io, Express.js et JavaScript moderne.**


---

## 🎮 Vue d'ensemble

**Planning Poker Pro** est une application web moderne pour pratiquer l'estimation Planning Poker en équipe distribuée. Elle permet aux équipes agile de voter sur l'estimation des tâches en temps réel via WebSocket.

**Version:** 1.0.0  
**License:** MIT  
**Node.js minimum:** 14.0.0

### Caractéristiques principales:

- ✅ **Communication en temps réel** avec Socket.io
- ✅ **Mode de jeu strict et libre**
- ✅ **Gestion de session** complète
- ✅ **Sauvegarde et restauration** de partie
- ✅ **Votes anonymes** avec cartes Fibonacci modifiées
- ✅ **Pause café** intégrée
- ✅ **Export/Import JSON** du backlog

---

## ✨ Fonctionnalités

### 🎮 Gameplay

| Fonctionnalité | Description |
|---|---|
| **Création de session** | Le créateur définit le nombre de participants et le mode de jeu |
| **Rejoindre une session** | Les joueurs rejoignent avec un code de session à 6 caractères |
| **Grille de cartes** | Cartes: 1, 2, 3, 5, 8, 13, 20, 40, 100, ?, ☕ |
| **Mode Strict** | Tous les joueurs doivent voter avant de révéler les résultats |
| **Mode Libre** | Révélation immédiate après chaque vote |
| **Résultats** | Affichage: tous les votes, moyenne, médiane |
| **Rounds multiples** | Relancer le vote pour la même tâche |

### 📁 Gestion des fichiers

| Fonctionnalité | Description |
|---|---|
| **Ajouter des tâches** | Interface pour ajouter des tâches au backlog |
| **Charger un backlog** | Importer un JSON avec des tâches |
| **Télécharger résultats** | Export JSON complet avec votes et estimations |
| **Reprendre une partie** | Charger une sauvegarde et continuer le vote |
| **Restaurer une session** | Rejoindre avec noms exacts des participants |

### 👥 Gestion des joueurs

| Fonctionnalité | Description |
|---|---|
| **Liste des joueurs** | Affichage en temps réel des participants connectés |
| **Statut de vote** | Indicateurs "Voté ✓" / "En attente" |
| **Barre de progression** | Pourcentage de joueurs ayant voté |
| **Statut connexion** | Indicateur connecté/déconnecté |
| **Compteur participants** | X/Y joueurs connectés |

---

## 🏗️ Architecture

### Vue générale

```
Client (Frontend)          Server (Backend)
├── HTML/CSS               ├── Express.js
├── JavaScript             ├── Node.js
├── Components UI          ├── Socket.io
└── Socket.io Client       └── Session Manager
```

### Flux de données

```
Client → Socket.io Event → Server → Logic → State Update → Broadcast → Clients
                           ↓
                      REST API
                           ↓
                      Session Data
```

### Modules principaux

**Frontend:**
- `PlanningPokerClient` - Classe principale du client
- `CardGrid` - Grille interactive de cartes
- `PlayerList` - Liste des joueurs
- `ProgressBar` - Barre de progression des votes
- `ConnectionStatus` - Indicateur de connexion
- Screens (écrans de jeu)

**Backend:**
- `server.js` - Serveur Express et Socket.io
- `socketHandlers.js` - Handlers des événements Socket
- `gameState.js` - État du jeu partagé

---

## 📦 Installation

### Prérequis

- **Node.js** v14.0.0 ou supérieur
- **npm** v6.0.0 ou supérieur
- **Navigateur moderne** (Chrome, Firefox, Safari, Edge)

### Étapes d'installation

#### 1. Cloner ou télécharger le projet

```bash
git clone https://github.com/yourusername/planning-poker.git
cd planning-poker
```

#### 2. Installer les dépendances

```bash
npm install
```

Cela installe:
- `express` - Framework web
- `socket.io` - Communication en temps réel
- `cors` - Cross-Origin Resource Sharing
- `jest` - Framework de test (dev)
- `@babel/preset-env` - Transpilation ES6+ (dev)

#### 3. Démarrer le serveur

```bash
# Mode production
npm start

# Mode développement (avec hot reload)
npm run dev
```

#### 4. Accéder l'application

Ouvrez votre navigateur à:

```
http://localhost:3000
```

---

## 🎯 Utilisation

### Scénario 1: Créer une nouvelle partie

1. **Démarrer le serveur** (`npm start`)
2. **Aller sur** `http://localhost:3000`
3. **Cliquer** "Créer une partie"
4. **Remplir le formulaire:**
   - Votre pseudo
   - Mode de jeu (Strict ou Libre)
   - Nombre de participants attendus
5. **Partager le code de session** avec les autres joueurs

### Scénario 2: Rejoindre une partie

1. **Aller sur** `http://localhost:3000`
2. **Cliquer** "Rejoindre une partie"
3. **Entrer:**
   - Votre pseudo
   - Code de session reçu (6 caractères)
4. **Attendre** que le créateur lance le jeu

### Scénario 3: Ajouter des tâches et voter

1. **Sur l'écran de configuration**, cliquer "Ajouter des tâches"
2. **Saisir** le nom et description de chaque tâche
3. **Cliquer** "Lancer le jeu"
4. **Voter** en cliquant sur une carte
5. **Voir les résultats** (selon le mode)

### Scénario 4: Sauvegarder et reprendre

1. **En fin de partie**, cliquer "Télécharger résultats"
2. **Sauvegarder** le fichier JSON localement
3. **Plus tard, cliquer** "Reprendre une partie"
4. **Charger** le fichier JSON téléchargé
5. **Entrer** votre pseudo (doit être exact)
6. **Continuer** les estimations

---

## 📂 Structure du projet

```
planning-poker-pro/
├── public/                     # Fichiers statiques
│   ├── index.html             # Page principale
│   ├── style.css              # Styles CSS
│   └── assets/                # Images et icônes
│
├── core/                       # Logique métier côté client
│   ├── PlanningPokerClient.js # Classe principale
│   ├── socketHandlers.js      # Handlers Socket.io
│   └── gameState.js           # État du jeu
│
├── ui/                        # Interface utilisateur
│   ├── components/            # Composants réutilisables
│   │   ├── CardGrid.js        # Grille de cartes
│   │   ├── PlayerList.js      # Liste des joueurs
│   │   ├── ProgressBar.js     # Barre de progression
│   │   ├── ConnectionStatus.js # Statut connexion
│   │   └── WaitingPlayers.js  # Joueurs en attente
│   │
│   └── screens/               # Écrans/pages du jeu
│       ├── menuScreen.js      # Menu principal
│       ├── setupScreen.js     # Configuration
│       ├── gameScreen.js      # Écran de jeu
│       ├── resultsScreen.js   # Résultats des votes
│       ├── addTasksScreen.js  # Ajout de tâches
│       ├── taskCompletedScreen.js # Tâche complétée
│       ├── coffeeBreakScreen.js   # Pause café
│       ├── gameOverScreen.js      # Fin de partie
│       ├── resumeWaitingScreen.js # Attente restauration
│       └── resumeSummaryScreen.js # Résumé restauration
│
├── tests/                     # Tests unitaires
│   ├── __tests__/
│   ├── unit/
│   └── integration/
│
├── server.js                  # Serveur Express + Socket.io
├── package.json               # Dépendances et scripts
├── package-lock.json          # Lock file npm
└── README.md                  # Cette documentation
```

---

## 🔌 API REST

### Créer une session

```
POST /api/create-session
Content-Type: application/json

{
  "creatorName": "Alice",
  "gameMode": "strict",
  "isRestored": false,
  "expectedParticipantCount": 3,
  "participants": ["Alice", "Bob", "Charlie"]
}

Response 200:
{
  "sessionCode": "ABC123",
  "message": "Session created"
}
```

### Récupérer une session

```
GET /api/session/:sessionCode

Response 200:
{
  "sessionCode": "ABC123",
  "gameMode": "strict",
  "creatorName": "Alice",
  "isRestored": false,
  "expectedParticipants": ["Alice", "Bob"],
  "expectedParticipantCount": 3,
  "hasBacklog": true
}
```

---

## 📡 Événements Socket.io

### Client → Serveur

#### `join-session`
```javascript
socket.emit('join-session', {
  sessionCode: 'ABC123',
  playerName: 'Alice'
});
```

#### `cast-vote`
```javascript
socket.emit('cast-vote', {
  sessionCode: 'ABC123',
  cardValue: '8'
});
```

#### `load-backlog`
```javascript
socket.emit('load-backlog', {
  sessionCode: 'ABC123',
  backlog: [
    { id: 1, name: 'Créer API', description: '...' },
    { id: 2, name: 'Tests', description: '...' }
  ]
});
```

#### `continue-new-round`
```javascript
socket.emit('continue-new-round', {
  sessionCode: 'ABC123'
});
```

#### `continue-next-round`
```javascript
socket.emit('continue-next-round', {
  sessionCode: 'ABC123',
  completedTasks: [1],
  taskEstimates: { '1': 8 }
});
```

#### `leave-session`
```javascript
socket.emit('leave-session');
```

### Serveur → Client

#### `players-list-updated`
```javascript
socket.on('players-list-updated', (players) => {
  console.log(players); // Array of players
});
```

#### `votes-received`
```javascript
socket.on('votes-received', (votes) => {
  console.log(votes); // Object with player votes
});
```

#### `backlog-loaded`
```javascript
socket.on('backlog-loaded', (data) => {
  console.log(data.backlog); // Tasks
  console.log(data.currentTask); // Current task
});
```

#### `game-started`
```javascript
socket.on('game-started', () => {
  // Game has started
});
```

#### `game-over`
```javascript
socket.on('game-over', () => {
  // Game has ended
});
```

---

## 🧪 Tests

### Installation des dépendances de test

Les dépendances sont déjà dans `package.json`:

```bash
npm install
```

### Lancer les tests

```bash
# Tous les tests
npm test

# Mode watch (relance à chaque changement)
npm run test:watch

# Rapport de couverture
npm run test:coverage
```


## 📚 Documentation

### JSDoc

Tout le code est documenté avec JSDoc:

```javascript
/**
 * Description de la fonction
 * 
 * @function myFunction
 * @param {string} name - Description du paramètre
 * @returns {void}
 * 
 * @example
 * myFunction('Alice');
 */
```

### Générer la documentation

```bash
# Avec JSDoc (optionnel)
npm install -g jsdoc
npm run docs
```

### Fichiers documentés

- ✅ `PlanningPokerClient.js` - Classe principale
- ✅ `CardGrid.js` - Composant cartes
- ✅ `PlayerList.js` - Composant joueurs
- ✅ `ProgressBar.js` - Barre de progression
- ✅ `ConnectionStatus.js` - Statut connexion
- ✅ `WaitingPlayers.js` - Joueurs en attente

---

## 🛠️ Dépannage

### "Impossible de se connecter au serveur"

**Solution:**
1. Vérifier que le serveur est lancé: `npm start`
2. Vérifier l'URL: `http://localhost:3000`
3. Vérifier les logs du navigateur (F12 → Console)
4. Vérifier le port 3000 n'est pas occupé:
   ```bash
   # Linux/Mac
   lsof -i :3000
   
   # Windows
   netstat -ano | findstr :3000
   ```

### "Code de session non trouvé"

**Solution:**
1. Vérifier que le créateur a lancé le jeu
2. Vérifier le code de session (6 caractères)
3. Vérifier que la session n'a pas expiré
4. Créer une nouvelle session si nécessaire

### "Accès refusé - pseudo non autorisé"

**Solution:**
1. Vérifier l'orthographe exacte du pseudo
2. Les pseudos sont sensibles à la casse
3. Vérifier que votre pseudo figure dans la liste des participants

### "Impossible de charger le fichier JSON"

**Solution:**
1. Vérifier que le fichier est un JSON valide
2. Vérifier que le fichier contient `metadata` et `tasks`
3. Vérifier que le `sessionCode` existe
4. Relancer l'application

### Socket.io se déconnecte

**Solution:**
1. Vérifier la connexion réseau
2. Vérifier les logs du serveur
3. Vérifier que CORS est activé
4. Relancer le serveur: `npm start`

---



## 📝 Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm start` | Démarre le serveur (production) |
| `npm run dev` | Démarre le serveur (développement) |
| `npm test` | Lance tous les tests |
| `npm run test:watch` | Tests en mode watch |
| `npm run test:coverage` | Rapport de couverture de code |

---

## 📋 Checklist pour commencer

- [ ] Installer Node.js v14+
- [ ] `npm install` - Installer les dépendances
- [ ] `npm start` - Lancer le serveur
- [ ] Ouvrir `http://localhost:3000` dans le navigateur
- [ ] Créer une nouvelle partie
- [ ] Partager le code avec d'autres joueurs
- [ ] Ajouter des tâches
- [ ] Voter sur les estimations
- [ ] Télécharger les résultats

---


## 🎓 Ressources pédagogiques

### Planning Poker

- [Mountain Goat Software - Planning Poker](https://www.mountaingoatsoftware.com/agile/planning-poker/)
- [Scrum.org - Planning Poker](https://www.scrum.org/resources/what-is-planning-poker)
- [Fibonacci Sequence](https://en.wikipedia.org/wiki/Fibonacci_number)

### Technologies utilisées

- [Express.js Documentation](https://expressjs.com/)
- [Socket.io Documentation](https://socket.io/docs/)
- [Jest Testing Guide](https://jestjs.io/docs/getting-started)
- [JavaScript ES6+](https://developer.mozilla.org/en-US/docs/Learn/JavaScript)

---

**Version actuelle:** 1.0.0  
**Dernière mise à jour:** Décembre 2025  
**Mainteneur:** Planning Poker Team 🎯
