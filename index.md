# Planning Poker Pro - Documentation

## 📖 Vue d'ensemble

Planning Poker Pro est une application de Planning Poker construite avec Node.js, Express et Socket.io.

### 🎯 Architecture du Projet

#### Frontend (public/src/)
- **Core** - Logique métier (PlanningPokerClient, GameState, SocketHandlers)
- **UI/Screens** - Écrans principaux (MenuScreen, GameScreen, ResultsScreen, etc.)
- **UI/Components** - Composants réutilisables (CardGrid, PlayerList, ProgressBar, etc.)
- **Utils** - Utilitaires et validations

#### Backend
- **server.js** - Serveur Express et Socket.io
- **socketHandlers.js** - Gestionnaires d'événements WebSocket

## 🚀 Démarrage Rapide

```bash
npm install
npm start
```

## 📚 Documentation API

Voir les modules ci-dessous pour la documentation complète de chaque classe et fonction.

## 🔗 Modules Principaux

- **PlanningPokerClient** - Client principal gérant l'état et la communication Socket
- **GameState** - Gestion de l'état du jeu
- **SocketHandlers** - Handlers des événements WebSocket
- **Screens** - Écrans de l'application
- **Components** - Composants UI
- **Validations** - Validation des données

---
*Generated with JSDoc*
