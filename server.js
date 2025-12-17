const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============= DATA STORAGE =============
const sessions = {};
const closedSessions = {}; // 🔒 Sessions fermées (pause café)

function generateSessionCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ============= HELPER FUNCTIONS =============
function calculateMedian(votes) {
    const numericVotes = votes
        .filter(v => v !== 'coffee' && v !== '?')
        .map(Number)
        .sort((a, b) => a - b);

    if (numericVotes.length === 0) return '?';
    
    const mid = Math.floor(numericVotes.length / 2);
    return numericVotes.length % 2 !== 0 
        ? numericVotes[mid] 
        : Math.ceil((numericVotes[mid - 1] + numericVotes[mid]) / 2);
}

function isUnanimous(votes) {
    const uniqueVotes = new Set(votes);
    return uniqueVotes.size === 1;
}

// ✅ NOUVEAU: Vérifier pause café
function checkCoffeeBreak(session, roomCode, io) {
    const allPlayers = session.players;
    if (allPlayers.length === 0) return false;
    
    const votes = allPlayers.map(p => p.vote);
    const allCoffee = votes.every(v => v === 'coffee');
    
    if (allCoffee && allPlayers.every(p => p.hasVoted)) {
        // 🔒 FERMER LA SESSION
        closedSessions[roomCode] = {
            code: roomCode,
            backlog: session.backlog,
            completedTasks: session.completedTasks || [],
            taskEstimates: session.taskEstimates || {},
            currentTaskIndex: session.currentTaskIndex,
            currentTaskVotes: {},
            currentTaskRound: session.currentRound,
            gameMode: session.gameMode,
            creatorName: session.creatorName,
            expectedParticipants: allPlayers.map(p => p.name),
            participantCount: allPlayers.length,
            closedAt: Date.now(),
            votes: session.allVotes || {},
            isRestored: true
        };

        // Récupérer les votes de la tâche actuelle AVANT la fermeture
        if (session.currentTaskIndex < session.backlog.length) {
            closedSessions[roomCode].currentTaskVotes = {};
            allPlayers.forEach(p => {
                closedSessions[roomCode].currentTaskVotes[p.name] = p.vote;
            });
        }

        console.log(`☕ Pause café - Session ${roomCode} FERMÉE`);
        console.log(`📋 Participants sauvegardés: ${closedSessions[roomCode].expectedParticipants.join(', ')}`);

        io.to(roomCode).emit('coffee-break', {
            players: allPlayers.map(p => p.name)
        });

        // 🔒 Supprimer la session active
        delete sessions[roomCode];
        
        return true;
    }
    return false;
}

function checkVotingCondition(session, roomCode, io) {
    const allPlayers = session.players;
    const votedPlayers = allPlayers.filter(p => p.hasVoted);

    if (votedPlayers.length === allPlayers.length) {
        const votes = {};
        const votesList = [];

        for (const player of allPlayers) {
            votes[player.id] = player.vote;
            votesList.push(player.vote);
        }

        const unanime = isUnanimous(votesList);

        if (unanime) {
            // UNANIMITÉ ATTEINTE
            io.to(roomCode).emit('show-results', {
                votes: votes,
                round: session.currentRound,
                showNextRoundButton: false,
                isUnanimous: true,
                finalValue: votesList[0]
            });
        } else {
            // PAS D'UNANIMITÉ
            if (session.gameMode === 'strict') {
                // Mode Strict: nouveau round
                io.to(roomCode).emit('show-results', {
                    votes: votes,
                    round: session.currentRound,
                    showNextRoundButton: true,
                    isUnanimous: false
                });
            } else {
                // Mode Médiane: vérifier si c'est le round 2
                if (session.currentRound === 2) {
                    // Round 2 = dernier round en mode Médiane
                    const medianValue = calculateMedian(votesList);
                    io.to(roomCode).emit('show-results', {
                        votes: votes,
                        round: session.currentRound,
                        showNextRoundButton: false,
                        isUnanimous: false,
                        medianValue: medianValue,
                        finalValue: medianValue
                    });
                } else {
                    // Round 1: nouveau round possible
                    io.to(roomCode).emit('show-results', {
                        votes: votes,
                        round: session.currentRound,
                        showNextRoundButton: true,
                        isUnanimous: false
                    });
                }
            }
        }
    }
}

// ============= API ENDPOINTS =============

app.get('/api/session/:code', (req, res) => {
  const session = sessions[req.params.code];
  
  if (!session) {
    console.log(`❌ Session ${req.params.code} non trouvée`);
    return res.status(404).json({ error: 'Session non trouvée' });
  }

  console.log(`✅ Session trouvée: ${req.params.code}`);
  res.json({
    code: session.code,
    players: session.players,
    backlog: session.backlog,
    currentTaskIndex: session.currentTaskIndex,
    currentRound: session.currentRound,
    gameMode: session.gameMode,
    hasBacklog: session.hasBacklog
  });
});


app.post('/api/create-session', (req, res) => {
  const { sessionCode, creatorName, gameMode, backlog, completedTasks, taskEstimates, currentTaskIndex, currentTaskRound } = req.body;

  if (!creatorName || !gameMode) {
    return res.status(400).json({ error: 'Données manquantes' });
  }

  // ✅ NOUVELLE LOGIQUE: Toujours créer une NOUVELLE session, même si backlog est fourni
  const newCode = sessionCode || generateSessionCode();

  sessions[newCode] = {
    code: newCode,
    creatorName: creatorName,
    gameMode: gameMode,
    players: [],
    backlog: backlog || [],
    currentTaskIndex: currentTaskIndex || 0,  // ✅ AJOUTER
    currentRound: currentTaskRound || 1,      // ✅ AJOUTER
    hasBacklog: backlog && backlog.length > 0 ? true : false,
    createdAt: Date.now(),
    isRestored: false,
    expectedParticipantCount: 0,
    expectedParticipants: [],
    completedTasks: completedTasks || [],     // ✅ AJOUTER
    taskEstimates: taskEstimates || {},       // ✅ AJOUTER
    allVotes: {},
    lockedUntilAllJoin: false
  };

  console.log(`✅ Session créée: ${newCode} (${gameMode}) - Backlog: ${backlog ? backlog.length : 0} tâches`);
  res.json({ sessionCode: newCode });
});

app.get('/api/session-backlog/:code', (req, res) => {
  const session = sessions[req.params.code];
  
  if (!session) {
    return res.status(404).json({ error: 'Session non trouvée' });
  }

  res.json({
    code: session.code,
    backlog: session.backlog || [],
    currentTaskIndex: session.currentTaskIndex || 0,
    currentRound: session.currentRound || 1,
    completedTasks: session.completedTasks || [],
    taskEstimates: session.taskEstimates || {},
    hasBacklog: session.hasBacklog || false
  });
});



// ============= SOCKET.IO EVENTS =============
io.on('connection', (socket) => {
    console.log(`📱 Client connecté: ${socket.id}`);

    // Rejoindre une session
    socket.on('join-session', (data) => {
        const { sessionCode, playerName, isRestoredParticipant, expectedParticipants } = data;
        const session = sessions[sessionCode];

        if (!session) {
            socket.emit('error', { message: 'Session non trouvée' });
            return;
        }

        // - Sessions RESTAURÉES: validation stricte du nom (ceux qui étaient présents)
        // - Sessions NEUVES avec backlog: accepter n'importe qui
        if (session.isRestored && session.lockedUntilAllJoin) {
        if (!session.expectedParticipants.includes(playerName)) {
            socket.emit('error', {
            message: `❌ "${playerName}" n'est pas autorisé. Participants: ${session.expectedParticipants.join(', ')}`
            });
            return;
        }
        }

// Si la session a UN backlog ET n'est PAS restaurée: accepter tous les joueurs
// (pas de validation de nom)

        // Vérifier si le joueur existe déjà
        let player = session.players.find(p => p.name === playerName);
        
        if (!player) {
            player = {
                id: socket.id,
                name: playerName,
                hasVoted: false,
                vote: null
            };
            session.players.push(player);
            console.log(`➕ ${playerName} a rejoint ${sessionCode}`);
        }

        socket.join(sessionCode);
        socket.data.sessionCode = sessionCode;
        socket.data.playerName = playerName;
        socket.data.playerId = player.id;

        // 🔒 VÉRIFIER SI TOUS LES PARTICIPANTS SONT LÀ
        if (session.isRestored && session.lockedUntilAllJoin) {
            const allHere = session.expectedParticipants.every(name => 
                session.players.some(p => p.name === name)
            );

            console.log(`👥 Vérification participants: ${session.players.length}/${session.expectedParticipants.length}`);

            if (allHere) {
                console.log(`✅ TOUS LES PARTICIPANTS PRÉSENTS - Déverrouillage`);
                session.lockedUntilAllJoin = false;
                
                // Envoyer backlog avec votes restaurés
                io.to(sessionCode).emit('backlog-loaded', {
                    backlog: session.backlog,
                    currentTaskIndex: session.currentTaskIndex,
                    currentRound: session.currentRound,
                    gameMode: session.gameMode,
                    votes: session.allVotes,
                    lastVotes: session.currentTaskVotes,
                    completedTasks: session.completedTasks,
                    taskEstimates: session.taskEstimates,
                    isRestored: true
                });
            }
        }

        // Envoyer infos au joueur
        socket.emit('session-info', {
            players: session.players,
            backlog: session.backlog,
            currentTaskIndex: session.currentTaskIndex,
            currentRound: session.currentRound,
            gameMode: session.gameMode
        });

        // Notifier les autres
        io.to(sessionCode).emit('player-joined', {
            allPlayers: session.players,
            newPlayer: playerName
        });
    });

    // Charger le backlog
    socket.on('load-backlog', (data) => {
        const { sessionCode, backlog, isRestored, completedTasks, taskEstimates, currentTaskVotes, currentTaskIndex, currentTaskRound } = data;
        const session = sessions[sessionCode];
        
        if (!session) {
            console.log(`❌ Session ${sessionCode} non trouvée pour load-backlog`);
            return;
        }

        console.log(`📋 load-backlog reçu: isRestored=${isRestored}, tasks=${backlog.length}`);

        session.backlog = backlog || [];
        session.hasBacklog = true;

        // ✅ SI C'EST UNE REPRISE DE PARTIE
        if (isRestored) {
            // Préserver les données de la partie précédente
            session.completedTasks = completedTasks || session.completedTasks || [];
            session.taskEstimates = taskEstimates || session.taskEstimates || {};
            session.currentTaskVotes = currentTaskVotes || session.currentTaskVotes || {};
            session.currentTaskIndex = currentTaskIndex !== undefined ? currentTaskIndex : (session.currentTaskIndex || 0);
            session.currentRound = currentTaskRound !== undefined ? currentTaskRound : (session.currentRound || 1);
            
            console.log(`✅ Partie restaurée: Task ${session.currentTaskIndex}, Round ${session.currentRound}`);
        } else {
            // ✅ NOUVELLE PARTIE: réinitialiser
            session.currentTaskIndex = 0;
            session.currentRound = 1;
            session.completedTasks = [];
            session.taskEstimates = {};
            session.allVotes = {};
            
            console.log(`✅ Nouvelle partie créée`);
        }

        // Reset les votes ACTUELS (mais pas l'historique)
        session.players.forEach(p => {
            p.hasVoted = false;
            p.vote = null;
        });

        io.to(sessionCode).emit('backlog-loaded', {
            backlog: session.backlog,
            currentTaskIndex: session.currentTaskIndex,
            currentRound: session.currentRound,
            gameMode: session.gameMode,
            votes: session.allVotes,
            completedTasks: session.completedTasks,
            taskEstimates: session.taskEstimates,
            lastVotes: session.currentTaskVotes,
            isRestored: isRestored
        });

        console.log(`📋 Backlog chargé: ${backlog.length} tâches (${sessionCode})`);
    });


    // Voter
    socket.on('cast-vote', (data) => {
        const { sessionCode, cardValue } = data;
        const session = sessions[sessionCode];

        if (!session) return;

        const player = session.players.find(p => p.id === socket.data.playerId);
        if (!player) {
            console.error(`❌ Joueur non trouvé: ${socket.data.playerId}`);
            return;
        }

        console.log(`🗳️ AVANT vote - ${player.name}: hasVoted=${player.hasVoted}`);
        
        player.hasVoted = true;  // ✅ TRÈS IMPORTANT
        player.vote = cardValue;
        
        console.log(`🗳️ APRÈS vote - ${player.name}: hasVoted=${player.hasVoted}, vote=${cardValue}`);
        console.log(`📋 État de la session - Players:`, session.players.map(p => ({
            name: p.name,
            hasVoted: p.hasVoted,
            vote: p.vote
        })));

        io.to(sessionCode).emit('vote-status', {
            players: session.players,  // ✅ Envoyer les joueurs à jour
            votedCount: session.players.filter(p => p.hasVoted).length,
            totalCount: session.players.length
        });

        // ✅ NOUVEAU: Vérifier pause café d'abord
        if (checkCoffeeBreak(session, sessionCode, io)) {
            return;
        }

        // Puis vérifier résultats normaux
        checkVotingCondition(session, sessionCode, io);
    });

    // Continuer nouveau round (revote)
    socket.on('continue-new-round', (data) => {
        const { sessionCode } = data;
        const session = sessions[sessionCode];

        if (!session) return;

        // Reset votes pour nouveau round
        session.currentRound += 1;
        session.players.forEach(p => {
            p.hasVoted = false;
            p.vote = null;
        });

        console.log(`🔄 Round ${session.currentRound} - ${sessionCode}`);

        io.to(sessionCode).emit('new-round', {
            currentRound: session.currentRound,
            currentTaskIndex: session.currentTaskIndex
        });
    });

    // Continuer tâche suivante (unanimité ou médiane atteinte)
    socket.on('continue-next-round', (data) => {
        const { sessionCode, completedTasks, taskEstimates } = data;
        const session = sessions[sessionCode];

        if (!session) return;

        // Mettre à jour les tâches complétées et leurs estimations
        session.completedTasks = completedTasks || [];
        session.taskEstimates = taskEstimates || {};

        // Passer à la tâche suivante
        session.currentTaskIndex += 1;
        session.currentRound = 1;

        // Reset votes
        session.players.forEach(p => {
            p.hasVoted = false;
            p.vote = null;
        });

        if (session.currentTaskIndex >= session.backlog.length) {
            // Pas plus de tâches
            io.to(sessionCode).emit('game-over');
            console.log(`✅ Partie terminée - ${sessionCode}`);
        } else {
            // Tâche suivante
            io.to(sessionCode).emit('next-task', {
                currentTaskIndex: session.currentTaskIndex,
                currentRound: session.currentRound
            });
            console.log(`📌 Tâche suivante - ${sessionCode}`);
        }
    });

    // Quitter
    socket.on('leave-session', () => {
        const sessionCode = socket.data.sessionCode;
        const session = sessions[sessionCode];

        if (session) {
            const idx = session.players.findIndex(p => p.id === socket.data.playerId);
            if (idx !== -1) {
                const playerName = session.players[idx].name;
                session.players.splice(idx, 1);
                console.log(`❌ ${playerName} a quitté ${sessionCode}`);

                io.to(sessionCode).emit('player-left', { playerName });
            }
        }

        socket.leave(sessionCode);
    });

    socket.on('disconnect', () => {
        const sessionCode = socket.data.sessionCode;
        if (sessionCode && sessions[sessionCode]) {
            const idx = sessions[sessionCode].players.findIndex(p => p.id === socket.data.playerId);
            if (idx !== -1) {
                sessions[sessionCode].players.splice(idx, 1);
            }
        }
        console.log(`📴 Client déconnecté: ${socket.id}`);
    });
});

// ============= START SERVER =============
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});

module.exports = {
  calculateMedian,
  isUnanimous,
  checkCoffeeBreak,
  checkVotingCondition,
  server,
};
