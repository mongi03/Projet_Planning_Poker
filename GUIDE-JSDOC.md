# Guide d'Utilisation - Génération de Documentation JSDoc

## 📦 Installation

### 1. Mettre à jour le `package.json`

Remplacez votre `package.json` actuel avec le fichier `package-updated.json` fourni. Il ajoute :

```bash
npm install --save-dev jsdoc better-docs nodemon http-server
```

Ou installez manuellement :

```bash
npm install --save-dev jsdoc@4.0.2 better-docs@2.7.2 nodemon@3.0.1 http-server@14.1.1
```

### 2. Créer la structure des dossiers

```bash
mkdir -p scripts
mkdir -p docs_assets
mkdir -p docs/tutorials
```

### 3. Placer les fichiers

- `generate-docs.js` → dossier `scripts/`
- `jsdoc.json` → racine du projet

## 🚀 Utilisation

### Option 1: Générer la documentation (une fois)

```bash
npm run docs
```

ou

```bash
node scripts/generate-docs.js
```

### Option 2: Surveiller les changements (watch mode)

```bash
npm run docs:watch
```

Le script se relancera automatiquement quand vous modifiez un fichier JavaScript.

### Option 3: Servir la documentation localement

```bash
npm run docs:serve
```

Cela ouvrira automatiquement `http://localhost:8080` dans votre navigateur.

## 📚 Résultat

La documentation est générée dans le dossier `docs/` :

```
docs/
├── index.html           # Page d'accueil
├── Server.html          # Documentation du serveur
├── PlanningPokerClient.html
├── SocketHandlers.html
├── source/              # Code source commenté
├── styles.css
└── scripts.js
```

## 🎯 Ajouter JSDoc à vos fichiers

### Exemple: Documenter une fonction

```javascript
/**
 * Initialise une nouvelle session de Planning Poker
 * @param {string} sessionCode - Code de session unique
 * @param {number} expectedParticipants - Nombre de participants attendus
 * @returns {Promise<object>} Configuration de session
 * @throws {Error} Si le code de session existe déjà
 * @example
 * const session = await initSession('ABC123', 5);
 */
async function initSession(sessionCode, expectedParticipants) {
  // implementation
}
```

### Exemple: Documenter une classe

```javascript
/**
 * Client Principal pour Planning Poker
 * Gère la communication Socket.io et l'état du jeu
 * @class PlanningPokerClient
 */
class PlanningPokerClient {
  /**
   * Crée une instance du client
   * @constructor
   */
  constructor() {
    this.socket = null;
    this.gameState = {};
  }

  /**
   * Lance le jeu
   * @method
   * @returns {void}
   */
  startGame() {
    // code
  }
}
```

### Tags JSDoc utiles

| Tag | Usage | Exemple |
|-----|-------|---------|
| `@param` | Décrire un paramètre | `@param {string} name - Le nom` |
| `@returns` | Décrire la valeur retournée | `@returns {Promise<boolean>}` |
| `@throws` | Documenter les erreurs | `@throws {Error}` |
| `@example` | Donner un exemple | `@example const x = fn()` |
| `@deprecated` | Marquer comme obsolète | `@deprecated Use newFunction() instead` |
| `@private` | Fonction/propriété privée | `@private` |
| `@async` | Fonction asynchrone | `@async` |
| `@callback` | Documenter une callback | `@callback MyCallback` |
| `@event` | Documenter un événement | `@event 'player-voted'` |
| `@see` | Référence croisée | `@see PlanningPokerClient` |

## 🔧 Configuration Avancée

### Modifier les fichiers à documenter

Éditez `jsdoc.json` dans la section `source.include` :

```json
{
  "source": {
    "include": [
      "server.js",
      "poker-app.js",
      "src/**/*.js"
    ]
  }
}
```

### Changer le template

Options disponibles:
- `better-docs` (par défaut) - Modern, responsive
- `docdash` - Minimaliste
- `ink-docstrap` - Bootstrap 3

```json
{
  "opts": {
    "template": "node_modules/better-docs"
  }
}
```

### Ajouter un logo personnalisé

Ajoutez à `jsdoc.json` :

```json
{
  "templates": {
    "better-docs": {
      "logo": "https://example.com/logo.png"
    }
  }
}
```

## 📊 Statistiques Générées

Le script génère automatiquement un fichier `docs/STATS.md` contenant :

- Nombre de lignes par fichier
- Nombre de fonctions documentées
- Ratio code/documentation

## 🐛 Dépannage

### Erreur: "jsdoc command not found"

```bash
npm install --save-dev jsdoc
```

### La documentation n'apparaît pas

Vérifiez que vos fichiers JSDoc respectent la syntaxe :

```javascript
// ❌ Mauvais
function doSomething() { }

// ✅ Correct
/**
 * Fait quelque chose
 */
function doSomething() { }
```

### Le style n'est pas appliqué

Assurez-vous que `better-docs` est installé :

```bash
npm install --save-dev better-docs
```

## 📖 Documentation Officielle

- JSDoc: https://jsdoc.app/
- Better-docs: https://github.com/SoftwareBrothers/better-docs
- Markdown in JSDoc: https://jsdoc.app/tags-description.html

---

**Questions ?** Consultez la documentation JSDoc officielle ou modifiez le script selon vos besoins.
