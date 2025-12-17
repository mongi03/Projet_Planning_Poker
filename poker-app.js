class PlanningPokerClient {
    constructor() {
        this.socket = null;
        this.sessionCode = null;
        this.playerName = null;
        this.gameMode = null;
        this.isConnected = false;
        this.localBacklog = [];
        this.creatorName = null;
        this.isRestoredSession = false;
        this.restoredMetadata = null;
        this.restoredVotes = {};

        this.gameState = {
            backlog: [],
            currentTaskIndex: 0,
            currentRound: 1,
            players: [],
            votes: {},
            hasVoted: false,
            isGameStarted: false,
            showNextRoundButton: false,
            coffeeBreakPlayers: [],
            allVotes: {},
            completedTasks: [],
            taskEstimates: {},
            currentTaskVotes: {},
            currentTaskRound: 1
        };

        this.initializeSocket();
    }

    initializeSocket() {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = 3000;
        const serverURL = `${protocol}//${hostname}:${port}`;

        this.socket = io(serverURL);

        this.socket.on('connect', () => {
            console.log('✅ Connecté');
            this.isConnected = true;
            this.updateConnectionStatus();
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Déconnecté');
            this.isConnected = false;
            this.updateConnectionStatus();
        });

        this.socket.on('error', (data) => {
            alert('Erreur: ' + (data?.message || 'Erreur inconnue'));
        });

        this.socket.on('session-info', (data) => {
            this.gameState.players = data.players || [];
            this.gameState.isGameStarted = data.backlog && data.backlog.length > 0;
            this.renderWaitingPlayers();
            
            // ✅ Mise à jour écran attente pour partie restaurée
            if (this.isRestoredSession) {
                this.updateResumeWaitingScreen();
            }
        });

        this.socket.on('player-joined', (data) => {
            this.gameState.players = data.allPlayers || [];
            this.renderWaitingPlayers();
            this.updateParticipantCounter();
            
            if (this.isRestoredSession) {
                this.updateResumeWaitingScreen();
            }
        });

        this.socket.on('backlog-loaded', (data) => {
            this.gameState.backlog = data.backlog || [];
            this.gameState.currentTaskIndex = data.currentTaskIndex || 0;
            this.gameState.currentRound = data.currentRound || 1;
            this.gameState.isGameStarted = true;
            this.gameState.allVotes = data.votes || {};
            this.gameState.completedTasks = data.completedTasks || [];
            this.gameState.taskEstimates = data.taskEstimates || {};
            
            // ✅ SI partie restaurée: afficher résultats du dernier vote
            if (data.isRestored && data.lastVotes) {
                this.showRestoredResults(data);
            } else {
                this.showGameScreen();
            }
        });

        this.socket.on('vote-status', (data) => {
            this.gameState.players = data.players || [];
            this.renderPlayersList();
            this.updateProgressBar();
        });

        this.socket.on('vote-status', (data) => {
            if (!this.gameState.allVotes) {
                this.gameState.allVotes = {};
            }
            
            const taskIndex = this.gameState.currentTaskIndex;
            const round = this.gameState.currentRound;
            
            if (!this.gameState.allVotes[taskIndex]) {
                this.gameState.allVotes[taskIndex] = {};
            }
            
            if (!this.gameState.allVotes[taskIndex][round]) {
                this.gameState.allVotes[taskIndex][round] = {};
            }
            
            this.gameState.allVotes[taskIndex][round] = data.votes || {};
        });

        this.socket.on('show-results', (data) => {
            this.gameState.votes = data.votes || {};
            this.gameState.showNextRoundButton = data.showNextRoundButton || false;
            this.gameState.currentRound = data.round;
            
            this.gameState.isUnanimous = data.isUnanimous || false;
            this.gameState.finalValue = data.finalValue || data.medianValue;
            this.gameState.medianValue = data.medianValue;
            
            this.showResults();
        });

        this.socket.on('new-round', (data) => {
            this.gameState.currentRound = data.currentRound;
            this.gameState.currentTaskIndex = data.currentTaskIndex;
            this.gameState.hasVoted = false;
            this.gameState.votes = {};
            this.showGameScreen();
        });

        this.socket.on('next-task', (data) => {
            this.gameState.currentTaskIndex = data.currentTaskIndex || 0;
            this.gameState.currentRound = data.currentRound || 1;
            this.gameState.hasVoted = false;
            this.gameState.votes = {};
            this.showGameScreen();
        });

        this.socket.on('coffee-break', (data) => {
            this.gameState.coffeeBreakPlayers = data.players || [];
            
            // ✅ SAUVEGARDER LES VOTES DE LA TÂCHE EN COURS avant la pause
            this.gameState.currentTaskVotes = this.gameState.votes || {};
            this.gameState.currentTaskRound = this.gameState.currentRound;
            
            this.showCoffeeBreakScreen();
        });

        this.socket.on('game-over', () => {
            this.showGameOverScreen();
        });

        this.socket.on('player-left', (data) => {
            console.log(`${data?.playerName || 'Un joueur'} a quitté`);
        });
    }

    updateConnectionStatus() {
        const status = document.getElementById('connectionStatus');
        const text = document.getElementById('connectionText');

        if (this.isConnected) {
            status.classList.add('connected');
            text.textContent = 'Connecté';
        } else {
            status.classList.remove('connected');
            text.textContent = 'Déconnecté';
        }
    }

    showMenuScreen() {
        this.hideAllScreens();
        document.getElementById('menuScreen').classList.add('active');
        document.getElementById('menuScreen').classList.remove('hidden');
    }

    showJoinForm() {
        document.getElementById('menuScreen').classList.add('hidden');
        document.getElementById('joinForm').classList.remove('hidden');
    }

    showResumeForm() {
        document.getElementById('menuScreen').classList.add('hidden');
        document.getElementById('resumeForm').classList.remove('hidden');
        document.getElementById('playerNameResume').value = '';
        document.getElementById('resumeError').classList.add('hidden');
    }

    showSetupScreen() {
        this.hideAllScreens();
        document.getElementById('setupScreen').classList.add('active');
        document.getElementById('setupSessionCode').textContent = this.sessionCode;
        this.updateParticipantCounter();
        this.renderWaitingPlayers();
    }

    updateParticipantCounter() {
        const current = this.gameState.players.length;
        const expected = this.expectedParticipantCount || 0;
        document.getElementById('participantCounter').textContent = `(${current}/${expected})`;
        
        const startBtn = document.getElementById('startGameBtn');
        if (current >= expected && expected > 0) {
            startBtn.disabled = false;
        } else {
            startBtn.disabled = true;
        }
    }

    showAddTasksScreen() {
        this.hideAllScreens();
        document.getElementById('addTasksScreen').classList.add('active');
        document.getElementById('addTasksSessionCode').textContent = this.sessionCode;
        this.localBacklog = [];
        document.getElementById('taskName').value = '';
        document.getElementById('taskDesc').value = '';
        this.renderTasksList();
    }

    showGameScreen() {
        this.hideAllScreens();
        document.getElementById('gameScreen').classList.add('active');

        const gameNotStartedAlert = document.getElementById('gameNotStartedAlert');
        const taskHeader = document.getElementById('taskHeader');
        const votingSection = document.getElementById('votingSection');
        const waitingMessage = document.getElementById('waitingMessage');

        if (this.gameState.isGameStarted && this.gameState.backlog.length > 0) {
            gameNotStartedAlert.style.display = 'none';
            taskHeader.style.display = 'block';
            votingSection.style.display = 'block';
            waitingMessage.style.display = 'none';
            this.renderGameScreen();
        } else {
            gameNotStartedAlert.style.display = 'block';
            taskHeader.style.display = 'none';
            votingSection.style.display = 'none';
            waitingMessage.style.display = 'block';
        }

        document.getElementById('gameSessionCode').textContent = this.sessionCode;
        this.renderPlayersList();
        this.renderWaitingPlayers();
    }

    showResults() {
        this.hideAllScreens();
        document.getElementById('resultsScreen').classList.add('active');
        
        document.getElementById('continueBtn').style.display = 
            this.gameState.showNextRoundButton ? 'none' : 'block';
        document.getElementById('nextRoundBtn').style.display = 
            this.gameState.showNextRoundButton ? 'block' : 'none';
        
        this.renderResults();
    }

    showTaskCompletedScreen() {
        this.hideAllScreens();
        document.getElementById('taskCompletedScreen').classList.add('active');
        this.renderTaskCompletedScreen();
    }

    showCoffeeBreakScreen() {
        this.hideAllScreens();
        document.getElementById('coffeeBreakScreen').classList.add('active');
        
        const playersList = document.getElementById('coffeePlayersDisplay');
        playersList.innerHTML = this.gameState.coffeeBreakPlayers
            .map(name => `<div class="voter-tag" style="display: inline-block; margin: 5px;">${name}</div>`)
            .join('');
        
        const downloadSection = document.getElementById('downloadSection');
        downloadSection.style.display = (this.playerName === this.creatorName) ? 'block' : 'none';
    }

    showGameOverScreen() {
        this.hideAllScreens();
        document.getElementById('gameOverScreen').classList.add('active');
    }

    showResumeWaitingScreen() {
        this.hideAllScreens();
        document.getElementById('resumeWaitingScreen').classList.add('active');
        document.getElementById('resumeSessionCode').textContent = this.sessionCode;
        this.renderResumeParticipants();
        this.updateResumeWaitingScreen();
    }

    showResumeSummaryScreen() {
        this.hideAllScreens();
        document.getElementById('resumeSummaryScreen').classList.add('active');
        document.getElementById('summarySessionCode').textContent = this.sessionCode;
        this.renderResumeSummary();
    }

    renderResumeSummary() {
        // ✅ Afficher les tâches complétées AVEC NOTES FINALES
        const completedContainer = document.getElementById('completedTasksList');
        completedContainer.innerHTML = '';

        if (!this.gameState.completedTasks || this.gameState.completedTasks.length === 0) {
            completedContainer.innerHTML = '<div style="color: var(--color-text-light); text-align: center; padding: 20px;">Aucune tâche complétée</div>';
        } else {
            this.gameState.completedTasks.forEach((taskId, idx) => {
                const task = this.gameState.backlog.find(t => t.id === taskId);
                const estimate = this.gameState.taskEstimates[taskId] || task.finalValue;

                if (task) {
                    const div = document.createElement('div');
                    div.style.cssText = 'padding: 12px; margin-bottom: 10px; background: var(--color-surface); border-left: 3px solid var(--color-success); border-radius: 4px; font-size: 14px;';
                    div.innerHTML = `
                        <div style="font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
                            <span>${idx + 1}. ${task.name}</span>
                            <span style="background: var(--color-primary); color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 700;">
                                📊 ${estimate || '?'}
                            </span>
                        </div>
                        <div style="color: var(--color-text-light); font-size: 12px; margin-top: 5px;">${task.description || ''}</div>
                    `;
                    completedContainer.appendChild(div);
                }
            });
        }

        // ✅ Afficher la tâche en cours AVEC DERNIER VOTE
        const currentTask = this.gameState.backlog[this.gameState.currentTaskIndex];
        if (currentTask) {
            document.getElementById('summaryCurrentTaskName').textContent = currentTask.name;
            document.getElementById('summaryCurrentTaskDesc').textContent = currentTask.description || 'Pas de description';

            // ✅ AFFICHER LES VOTES MÉMORISÉS DE LA TÂCHE EN COURS
            const savedVotes = this.gameState.currentTaskVotes || {};
            const votesList = Object.values(savedVotes);
            
            if (votesList.length > 0) {
                // Compter les votes
                const voteCounts = {};
                votesList.forEach(v => {
                    voteCounts[v] = (voteCounts[v] || 0) + 1;
                });
                
                // Afficher la distribution
                const voteDistribution = Object.entries(voteCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([vote, count]) => `${vote}(${count})`)
                    .join(' • ');
                
                document.getElementById('summaryLastVote').textContent = `Round ${this.gameState.currentTaskRound}: ${voteDistribution}`;
            } else {
                document.getElementById('summaryLastVote').textContent = 'Aucun vote enregistré (Round 1)';
            }
        }
    }

    continueFromResumeSummary() {
        // ✅ RESTAURER les votes de la tâche en cours et continuer
        this.socket.emit('load-backlog', {
            sessionCode: this.sessionCode,
            backlog: this.gameState.backlog,
            votes: this.restoredVotes,
            isRestored: true,
            hasVotes: Object.keys(this.restoredVotes).length > 0,
            currentTaskVotes: this.gameState.currentTaskVotes || {},
            completedTasks: this.gameState.completedTasks || [],
            taskEstimates: this.gameState.taskEstimates || {}
        });
    }

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('menuScreen').classList.remove('hidden');
        document.getElementById('joinForm').classList.add('hidden');
        document.getElementById('resumeForm').classList.add('hidden');
    }

    createNewGame() {
        const playerName = document.getElementById('playerName').value.trim();
        const gameMode = document.getElementById('gameMode').value;
        const participantCount = document.getElementById('participantCount').value;

        if (!playerName || !gameMode || !participantCount) {
            alert('Remplissez tous les champs');
            return;
        }

        this.playerName = playerName;
        this.gameMode = gameMode;
        this.creatorName = playerName;
        this.isRestoredSession = false;
        this.expectedParticipantCount = parseInt(participantCount);

        fetch('http://localhost:3000/api/create-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                creatorName: playerName, 
                gameMode, 
                isRestored: false,
                expectedParticipantCount: this.expectedParticipantCount
            })
        })
        .then(r => r.json())
        .then(data => {
            this.sessionCode = data.sessionCode;

            this.socket.emit('join-session', {
                sessionCode: this.sessionCode,
                playerName: this.playerName
            });

            this.showSetupScreen();
        })
        .catch(err => {
            console.error('Erreur:', err);
            alert('Impossible de créer la session');
        });
    }

    joinGame() {
        const playerName = document.getElementById('playerNameJoin').value.trim();
        const sessionCode = document.getElementById('sessionCode').value.trim().toUpperCase();

        if (!playerName || !sessionCode) {
            alert('Remplissez tous les champs');
            return;
        }

        this.playerName = playerName;
        this.sessionCode = sessionCode;

        fetch(`http://localhost:3000/api/session/${sessionCode}`)
            .then(r => {
                if (!r.ok) throw new Error('Session non trouvée');
                return r.json();
            })
            .then(data => {
                // ✅ BLOQUER si session restaurée
                if (data.isRestored) {
                    throw new Error('❌ Cette session est verrouillée - Partie restaurée en cours. Utilisez "Reprendre une partie" avec le fichier JSON.');
                }

                this.gameMode = data.gameMode;
                this.creatorName = data.creatorName;
                this.gameState.isGameStarted = data.hasBacklog;
                this.isRestoredSession = false;
                this.expectedParticipantCount = data.expectedParticipantCount;

                this.socket.emit('join-session', {
                    sessionCode: this.sessionCode,
                    playerName: this.playerName,
                    isRestoredParticipant: false
                });

                this.showGameScreen();
            })
            .catch(err => {
                const errorEl = document.getElementById('joinError');
                errorEl.textContent = err.message || 'Session non trouvée ou terminée';
                errorEl.classList.remove('hidden');
            });
    }

    loadResumeFile() {
        const file = document.getElementById('resumeFile').files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.metadata && data.tasks) {
                    this.restoredMetadata = data.metadata;
                    this.restoredMetadata.tasks = data.tasks;
                    this.restoredMetadata.completedTasks = data.completedTasks || [];
                    this.restoredMetadata.taskEstimates = data.taskEstimates || {};
                    this.restoredVotes = data.votes || {};
                    
                    document.getElementById('resumeFileDisplay').innerHTML = `
                        <strong>✅ Fichier chargé</strong><br/>
                        Participants: ${data.metadata.participantCount}<br/>
                        Tâches: ${data.tasks.length}<br/>
                        Dernière session: ${data.metadata.sessionCode}
                    `;

                    document.getElementById('resumeValidation').innerHTML = `
                        <div style="background: #dbeafe; border: 1px solid #93c5fd; border-radius: 8px; padding: 12px; font-size: 13px;">
                            <strong>📋 Backlog restauré</strong>
                            <div style="margin-top: 8px;">
                                <strong>Participants attendus (${data.metadata.participantCount}):</strong> ${data.metadata.participants.join(', ')}
                            </div>
                            <div style="margin-top: 8px; color: #059669;">
                                ⚠️ Saisissez votre pseudo pour rejoindre la session
                            </div>
                        </div>
                    `;

                    document.getElementById('resumeStartBtn').disabled = false;
                } else {
                    throw new Error('Format de fichier invalide');
                }
            } catch (err) {
                alert('Erreur: JSON invalide - ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    startResume() {
        const playerName = document.getElementById('playerNameResume').value.trim();

        if (!playerName) {
            alert('Saisissez votre pseudo');
            return;
        }

        // ✅ VALIDATION STRICTE: Le nom doit correspondre EXACTEMENT (case-sensitive)
        if (!this.restoredMetadata || !this.restoredMetadata.participants.some(p => p === playerName)) {
            const errorEl = document.getElementById('resumeError');
            errorEl.textContent = `❌ ACCÈS REFUSÉ: "${playerName}" n'est pas dans la liste des participants. Noms exacts autorisés: ${this.restoredMetadata.participants.join(', ')}`;
            errorEl.classList.remove('hidden');
            return;
        }

        this.playerName = playerName;
        this.gameMode = this.restoredMetadata.gameMode || 'strict';
        this.creatorName = this.restoredMetadata.participants[0];
        this.isRestoredSession = true;
        this.sessionCode = this.restoredMetadata.sessionCode;

        // ✅ Récréer la session avec le MÊME sessionCode réutilisé
        fetch('http://localhost:3000/api/create-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                sessionCode: this.sessionCode,
                creatorName: this.creatorName,
                gameMode: this.gameMode,
                isRestored: true,
                expectedParticipantCount: this.restoredMetadata.participantCount,
                participants: this.restoredMetadata.participants
            })
        })
        .then(r => r.json())
        .then(data => {
            this.expectedParticipantCount = this.restoredMetadata.participantCount;
            
            this.socket.emit('join-session', {
                sessionCode: this.sessionCode,
                playerName: this.playerName,
                isRestoredParticipant: true,
                expectedParticipants: this.restoredMetadata.participants
            });

            this.showResumeWaitingScreen();
        })
        .catch(err => {
            console.error('Erreur:', err);
            alert('❌ Impossible de restaurer la session: ' + err.message);
        });
    }

    renderResumeParticipants() {
        const container = document.getElementById('resumeParticipantsList');
        container.innerHTML = '';

        const expected = this.restoredMetadata?.participants || [];
        const connected = (this.gameState.players || []).map(p => p.name);

        expected.forEach(name => {
            const isConnected = connected.includes(name);
            const div = document.createElement('div');
            div.className = `participant-item ${isConnected ? 'joined' : 'waiting'}`;
            div.innerHTML = `
                <span>${isConnected ? '✓' : '⏳'} ${name}</span>
                <span style="margin-left: auto; font-size: 12px; color: ${isConnected ? '#10b981' : '#f59e0b'};">
                    ${isConnected ? 'Connecté' : 'En attente'}
                </span>
            `;
            container.appendChild(div);
        });
    }

    updateResumeWaitingScreen() {
        const expected = this.restoredMetadata?.participants || [];
        const connected = (this.gameState.players || []).map(p => p.name);
        const allHere = expected.every(p => connected.includes(p));

        const count = Math.min(connected.length, expected.length);
        const total = expected.length;
        const percentage = (count / total) * 100;

        document.getElementById('resumeProgressFill').style.width = percentage + '%';
        document.getElementById('resumeProgressText').textContent = `${count} / ${total} joueurs connectés`;

        // ✅ AUTO-DÉMARRAGE quand tous sont là
        if (allHere && total > 0) {
            setTimeout(() => {
                this.autoStartResumedGame();
            }, 1000);
        }
    }

    autoStartResumedGame() {
        // ✅ Charger backlog et afficher résultats du dernier round automatiquement
        if (!this.restoredMetadata || !this.restoredMetadata.tasks) {
            console.error('❌ Métadonnées restaurées manquantes');
            return;
        }

        console.log('🔄 Auto-démarrage partie restaurée avec', this.restoredMetadata.tasks.length, 'tâches');
        console.log('📋 Participants attendus:', this.restoredMetadata.participants);
        
        // ✅ IMPORTANT: Stocker les tâches MAINTENANT avant d'émettre load-backlog
        this.gameState.backlog = this.restoredMetadata.tasks;
        
        // ✅ Récupérer l'historique du backlog depuis les métadonnées
        this.gameState.completedTasks = this.restoredMetadata.completedTasks || [];
        this.gameState.taskEstimates = this.restoredMetadata.taskEstimates || {};
        this.gameState.currentTaskIndex = this.restoredMetadata.currentTaskIndex || 0;
        this.gameState.currentTaskVotes = this.restoredMetadata.currentTaskVotes || {};
        this.gameState.currentTaskRound = this.restoredMetadata.currentTaskRound || 1;
        
        // ✅ S'il y a des tâches complétées, afficher le résumé d'abord
        if (this.gameState.completedTasks.length > 0) {
            this.showResumeSummaryScreen();
        } else {
            this.socket.emit('load-backlog', {
                sessionCode: this.sessionCode,
                backlog: this.restoredMetadata.tasks,
                votes: this.restoredVotes,
                isRestored: true,
                hasVotes: Object.keys(this.restoredVotes).length > 0,
                currentTaskVotes: this.gameState.currentTaskVotes,
                completedTasks: this.gameState.completedTasks,
                taskEstimates: this.gameState.taskEstimates
            });
        }
    }

    cancelResume() {
        this.isRestoredSession = false;
        this.restoredMetadata = null;
        this.restoredVotes = {};
        this.leaveGame();
    }

    startGame() {
        const backlogJson = document.getElementById('backlogJson').value.trim();

        if (backlogJson) {
            try {
                const backlog = JSON.parse(backlogJson);
                if (!Array.isArray(backlog)) throw new Error('Format invalide');

                this.socket.emit('load-backlog', {
                    sessionCode: this.sessionCode,
                    backlog: backlog,
                    isRestored: false
                });
            } catch (err) {
                alert('JSON invalide: ' + err.message);
            }
        } else {
            this.showAddTasksScreen();
        }
    }

    addTask() {
        const name = document.getElementById('taskName').value.trim();
        const description = document.getElementById('taskDesc').value.trim();

        if (!name) {
            alert('Remplissez au moins le nom de la tâche');
            return;
        }

        const task = {
            id: this.localBacklog.length + 1,
            name: name,
            description: description
        };

        this.localBacklog.push(task);

        document.getElementById('taskName').value = '';
        document.getElementById('taskDesc').value = '';
        document.getElementById('taskName').focus();

        this.renderTasksList();
    }

    removeTask(index) {
        this.localBacklog.splice(index, 1);
        this.renderTasksList();
    }

    renderTasksList() {
        const container = document.getElementById('tasksList');
        container.innerHTML = '';

        if (this.localBacklog.length === 0) {
            container.innerHTML = '<div style="color: var(--color-text-light); text-align: center;">Aucune tâche pour le moment</div>';
        } else {
            this.localBacklog.forEach((task, idx) => {
                const div = document.createElement('div');
                div.className = 'waiting-player';
                div.innerHTML = `
                    <div class="waiting-player-name">#${task.id}: ${task.name}</div>
                    <div class="waiting-info">${task.description || 'Pas de description'}</div>
                    <button onclick="app.removeTask(${idx})" class="remove-btn">❌ Supprimer</button>
                `;
                container.appendChild(div);
            });
        }

        document.getElementById('taskCount').textContent = this.localBacklog.length;
        document.getElementById('startVotingBtn').disabled = this.localBacklog.length === 0;
    }

    startVoting() {
        if (this.localBacklog.length === 0) {
            alert('Ajoutez au moins une tâche');
            return;
        }

        this.socket.emit('load-backlog', {
            sessionCode: this.sessionCode,
            backlog: this.localBacklog,
            isRestored: false
        });
    }

    cancelAddTasks() {
        this.leaveGame();
    }

    renderGameScreen() {
        const currentTask = this.gameState.backlog[this.gameState.currentTaskIndex];

        document.getElementById('taskName').textContent = `${this.gameState.currentTaskIndex + 1}. ${currentTask.name}`;
        document.getElementById('taskDescription').textContent = currentTask.description || '';
        document.getElementById('roundBadge').textContent = `Round ${this.gameState.currentRound}`;
        document.getElementById('modeDisplay').textContent = 
            this.gameMode === 'strict' ? 'Strict (Unanimité)' : 'Médiane';
        document.getElementById('roundDisplay').textContent = `Round ${this.gameState.currentRound}`;
        document.getElementById('taskProgress').textContent = 
            `${this.gameState.currentTaskIndex + 1} / ${this.gameState.backlog.length}`;

        this.renderCards();
        this.renderPlayersList();
        this.updateProgressBar();
    }

    renderCards() {
        const container = document.getElementById('cardsContainer');
        container.innerHTML = '';

        const cardValues = ['1', '2', '3', '5', '8', '13', '20', '40', '100', '?', 'coffee'];

        cardValues.forEach(value => {
            const wrapper = document.createElement('div');
            wrapper.className = 'card-wrapper';
            wrapper.onclick = (e) => this.castVote(value);

            const display = document.createElement('div');
            display.className = 'card-display';
            
            if (value === '?') {
                display.textContent = '?';
                display.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            } else if (value === 'coffee') {
                display.textContent = '☕';
                display.style.fontSize = '36px';
                display.style.background = 'linear-gradient(135deg, #92400e 0%, #78350f 100%)';
            } else {
                display.textContent = value;
            }

            wrapper.appendChild(display);
            container.appendChild(wrapper);
        });
    }

    castVote(cardValue) {
        this.gameState.hasVoted = true;
        this.socket.emit('cast-vote', {
            sessionCode: this.sessionCode,
            cardValue: cardValue
        });

        document.querySelectorAll('.card-wrapper').forEach(w => w.classList.remove('selected'));
        event.target.closest('.card-wrapper').classList.add('selected');
    }

    renderPlayersList() {
        const container = document.getElementById('playersList');
        container.innerHTML = '';

        this.gameState.players.forEach(player => {
            const item = document.createElement('div');
            item.className = 'player-item';

            const name = document.createElement('div');
            name.className = 'player-name';
            name.textContent = player.name;

            const status = document.createElement('div');
            status.className = 'player-status';
            status.textContent = player.hasVoted ? 'Voté ✓' : 'En attente';
            if (player.hasVoted) status.classList.add('voted');

            item.appendChild(name);
            item.appendChild(status);
            container.appendChild(item);
        });
    }

    renderWaitingPlayers() {
        const container = document.getElementById('waitingPlayers');
        container.innerHTML = '';

        if (this.gameState.players.length === 0) {
            container.innerHTML = '<div style="color: var(--color-text-light); text-align: center; padding: 20px;">En attente de joueurs...</div>';
            return;
        }

        this.gameState.players.forEach(player => {
            const div = document.createElement('div');
            div.className = 'waiting-player';
            div.innerHTML = `
                <div class="waiting-player-name">✓ ${player.name}</div>
                <div class="waiting-info">Connecté et prêt</div>
            `;
            container.appendChild(div);
        });
    }

    updateProgressBar() {
        const voted = this.gameState.players.filter(p => p.hasVoted).length;
        const total = this.gameState.players.length;
        const percentage = total > 0 ? (voted / total) * 100 : 0;

        document.getElementById('votingStatus').textContent = `${voted} / ${total} joueurs ont voté`;
        document.getElementById('progressBar').style.width = percentage + '%';
    }

    renderResults() {
        const currentTask = this.gameState.backlog[this.gameState.currentTaskIndex];
        document.getElementById('resultsTaskName').textContent = currentTask.name;
        document.getElementById('resultsRound').textContent = this.gameState.currentRound;

        const voteCounts = {};
        const votersByCard = {};

        for (const [playerId, vote] of Object.entries(this.gameState.votes)) {
            voteCounts[vote] = (voteCounts[vote] || 0) + 1;
            if (!votersByCard[vote]) votersByCard[vote] = [];
            
            const player = this.gameState.players.find(p => p.id === playerId);
            if (player) votersByCard[vote].push(player.name);
        }

        const distribution = document.getElementById('votesDistribution');
        distribution.innerHTML = '';

        const sortedVotes = Object.keys(voteCounts).sort((a, b) => {
            if (a === 'coffee') return 1;
            if (b === 'coffee') return -1;
            return parseInt(b) - parseInt(a);
        });

        sortedVotes.forEach(vote => {
            const count = voteCounts[vote];

            const item = document.createElement('div');
            item.className = 'vote-result-card';

            const cardDisplay = document.createElement('div');
            cardDisplay.className = 'vote-result-number';
            
            if (vote === '?') {
                cardDisplay.textContent = '?';
                cardDisplay.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            } else if (vote === 'coffee') {
                cardDisplay.textContent = '☕';
                cardDisplay.style.fontSize = '32px';
                cardDisplay.style.background = 'linear-gradient(135deg, #92400e 0%, #78350f 100%)';
            } else {
                cardDisplay.textContent = vote;
            }

            const countEl = document.createElement('div');
            countEl.className = 'vote-result-count';
            countEl.textContent = `${count}`;

            item.appendChild(cardDisplay);
            item.appendChild(countEl);
            distribution.appendChild(item);
        });

        const isUnanimous = Object.keys(voteCounts).length === 1;

        document.getElementById('unanimityMessage').style.display = isUnanimous ? 'block' : 'none';

        const extremeContainer = document.getElementById('extremeVotesDisplay');
        
        if (isUnanimous) {
            extremeContainer.style.display = 'none';
        } else {
            extremeContainer.style.display = 'block';
            extremeContainer.innerHTML = '';

            const numericVotes = sortedVotes
                .filter(v => v !== 'coffee' && v !== '?')
                .map(Number)
                .sort((a, b) => a - b);

            if (numericVotes.length > 1) {
                const minVote = numericVotes[0];
                const maxVote = numericVotes[numericVotes.length - 1];

                extremeContainer.innerHTML = '<div class="extreme-title">⚠️ Votes extrêmes</div>';

                extremeContainer.innerHTML += `
                    <div style="margin: 15px 0;">
                        <strong>Vote le plus bas (${minVote}):</strong>
                        <div style="margin-top: 10px;">
                            ${votersByCard[minVote]?.map(v => `<span class="voter-tag">${v}</span>`).join('')}
                        </div>
                    </div>
                    <div style="margin: 15px 0;">
                        <strong>Vote le plus haut (${maxVote}):</strong>
                        <div style="margin-top: 10px;">
                            ${votersByCard[maxVote]?.map(v => `<span class="voter-tag">${v}</span>`).join('')}
                        </div>
                    </div>
                `;
            }

            if (voteCounts['coffee']) {
                extremeContainer.innerHTML += `
                    <div style="margin-top: 15px;">
                        <strong>☕ Pause:</strong>
                        <div style="margin-top: 10px;">
                            ${votersByCard['coffee']?.map(v => `<span class="voter-tag">${v}</span>`).join('')}
                        </div>
                    </div>
                `;
            }
        }
    }

    renderTaskCompletedScreen() {
        const currentTask = this.gameState.backlog[this.gameState.currentTaskIndex];
        document.getElementById('completedTaskName').textContent = currentTask.name;

        if (this.gameState.isUnanimous) {
            document.getElementById('finalValueLabel').textContent = 'Unanimité atteinte';
            document.getElementById('finalValueDisplay').textContent = this.gameState.finalValue;
        } else if (this.gameMode === 'median') {
            document.getElementById('finalValueLabel').textContent = 'Médiane calculée';
            document.getElementById('finalValueDisplay').textContent = this.gameState.medianValue;
        } else {
            document.getElementById('finalValueLabel').textContent = 'Valeur finale';
            document.getElementById('finalValueDisplay').textContent = this.gameState.finalValue;
        }

        const voteCounts = {};
        const votersByCard = {};

        for (const [playerId, vote] of Object.entries(this.gameState.votes)) {
            voteCounts[vote] = (voteCounts[vote] || 0) + 1;
            if (!votersByCard[vote]) votersByCard[vote] = [];
            
            const player = this.gameState.players.find(p => p.id === playerId);
            if (player) votersByCard[vote].push(player.name);
        }

        const distribution = document.getElementById('completedVotesDistribution');
        distribution.innerHTML = '';

        const sortedVotes = Object.keys(voteCounts).sort((a, b) => {
            if (a === 'coffee') return 1;
            if (b === 'coffee') return -1;
            return parseInt(b) - parseInt(a);
        });

        sortedVotes.forEach(vote => {
            const count = voteCounts[vote];

            const item = document.createElement('div');
            item.className = 'vote-result-card';

            const cardDisplay = document.createElement('div');
            cardDisplay.className = 'vote-result-number';
            
            if (vote === '?') {
                cardDisplay.textContent = '?';
                cardDisplay.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            } else if (vote === 'coffee') {
                cardDisplay.textContent = '☕';
                cardDisplay.style.fontSize = '32px';
                cardDisplay.style.background = 'linear-gradient(135deg, #92400e 0%, #78350f 100%)';
            } else {
                cardDisplay.textContent = vote;
            }

            const countEl = document.createElement('div');
            countEl.className = 'vote-result-count';
            countEl.textContent = `${count}`;

            item.appendChild(cardDisplay);
            item.appendChild(countEl);
            distribution.appendChild(item);
        });

        const extremeContainer = document.getElementById('completedExtremeVotes');
        extremeContainer.innerHTML = '';

        const numericVotes = sortedVotes
            .filter(v => v !== 'coffee' && v !== '?')
            .map(Number)
            .sort((a, b) => a - b);

        if (numericVotes.length > 1) {
            const minVote = numericVotes[0];
            const maxVote = numericVotes[numericVotes.length - 1];

            extremeContainer.innerHTML = '<div class="extreme-title">⚠️ Votes extrêmes</div>';

            extremeContainer.innerHTML += `
                <div style="margin: 15px 0;">
                    <strong>Vote le plus bas (${minVote}):</strong>
                    <div style="margin-top: 10px;">
                        ${votersByCard[minVote]?.map(v => `<span class="voter-tag">${v}</span>`).join('')}
                    </div>
                </div>
                <div style="margin: 15px 0;">
                    <strong>Vote le plus haut (${maxVote}):</strong>
                    <div style="margin-top: 10px;">
                        ${votersByCard[maxVote]?.map(v => `<span class="voter-tag">${v}</span>`).join('')}
                    </div>
                </div>
            `;
        }

        if (voteCounts['coffee']) {
            extremeContainer.innerHTML += `
                <div style="margin-top: 15px;">
                    <strong>☕ Pause:</strong>
                    <div style="margin-top: 10px;">
                        ${votersByCard['coffee']?.map(v => `<span class="voter-tag">${v}</span>`).join('')}
                    </div>
                </div>
            `;
        }
    }

    handleContinue() {
        this.showTaskCompletedScreen();
    }

    startNewRound() {
        this.socket.emit('continue-new-round', {
            sessionCode: this.sessionCode
        });
    }

    continueToNext() {
        // ✅ Enrichir la tâche complétée avec sa note finale avant de continuer
        const currentTask = this.gameState.backlog[this.gameState.currentTaskIndex];
        if (currentTask) {
            currentTask.finalValue = this.gameState.finalValue || this.gameState.medianValue;
            currentTask.completed = true;
            currentTask.completedAt = new Date().toISOString();
            
            // ✅ Tracker les tâches complétées
            if (!this.gameState.completedTasks) {
                this.gameState.completedTasks = [];
            }
            if (!this.gameState.completedTasks.includes(currentTask.id)) {
                this.gameState.completedTasks.push(currentTask.id);
            }
            
            // ✅ Stocker l'estimation
            if (!this.gameState.taskEstimates) {
                this.gameState.taskEstimates = {};
            }
            this.gameState.taskEstimates[currentTask.id] = this.gameState.finalValue || this.gameState.medianValue;
        }

        this.socket.emit('continue-next-round', {
            sessionCode: this.sessionCode,
            completedTasks: this.gameState.completedTasks,
            taskEstimates: this.gameState.taskEstimates
        });
    }

    downloadBacklog() {
        if (!this.gameState.backlog || this.gameState.backlog.length === 0) {
            alert('Aucune tâche à télécharger');
            return;
        }
        
        // ✅ Récupérer la liste EXACTE des participants (dans l'ordre du créateur)
        const participantsList = this.gameState.players.map(p => p.name);
        
        if (participantsList.length !== this.expectedParticipantCount) {
            alert(`❌ Erreur: ${participantsList.length} participants connectés mais ${this.expectedParticipantCount} attendus`);
            return;
        }
        
        // ✅ ENRICHIR le backlog avec notes finales des tâches complétées
        const enrichedBacklog = this.gameState.backlog.map(task => {
            if (this.gameState.completedTasks && this.gameState.completedTasks.includes(task.id)) {
                return {
                    ...task,
                    finalValue: this.gameState.taskEstimates[task.id] || task.finalValue,
                    completed: true,
                    completedAt: task.completedAt || new Date().toISOString()
                };
            }
            return task;
        });
        
        // ✅ Format STANDARDISÉ avec metadata (DOIT correspondre à loadResumeFile)
        const backlogData = {
            metadata: {
                sessionCode: this.sessionCode,
                participantCount: participantsList.length,
                participants: participantsList,
                gameMode: this.gameMode,
                completedTasks: this.gameState.completedTasks || [],
                taskEstimates: this.gameState.taskEstimates || {},
                currentTaskIndex: this.gameState.currentTaskIndex,
                currentTaskVotes: this.gameState.currentTaskVotes || {},
                currentTaskRound: this.gameState.currentTaskRound || 1
            },
            tasks: enrichedBacklog,
            completedTasks: this.gameState.completedTasks || [],
            taskEstimates: this.gameState.taskEstimates || {},
            votes: this.gameState.allVotes || {}
        };
        
        const dataStr = JSON.stringify(backlogData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backlog-${this.sessionCode}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    loadBacklogFile() {
        const file = document.getElementById('backlogFile').files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.metadata && data.tasks) {
                    // ✅ Vérifier que le sessionCode existe - OBLIGATOIRE pour réutilisation
                    if (!data.metadata.sessionCode) {
                        throw new Error('Backlog invalide: sessionCode manquant (impossible de restaurer)');
                    }

                    document.getElementById('backlogJson').value = JSON.stringify(data.tasks, null, 2);
                    
                    const validation = document.getElementById('backlogValidation');
                    const expectedCount = data.participantCount;
                    const expectedNames = data.participants.join(', ');
                    const hasVotes = data.votes && Object.keys(data.votes).length > 0;
                    
                    validation.innerHTML = `
                        <div style="background: #dbeafe; border: 1px solid #93c5fd; border-radius: 8px; padding: 12px; font-size: 13px;">
                            <strong>📋 Backlog restauré</strong>
                            <div style="margin-top: 8px; background: #dcfce7; padding: 8px; border-radius: 4px;">
                                <strong>🔐 Session:</strong> <code>${data.sessionCode}</code> (RÉUTILISÉE - même code)
                            </div>
                            <div style="margin-top: 8px;">
                                <strong>👥 Participants EXACTS (${expectedCount}):</strong>
                                <div style="margin-top: 4px; padding: 8px; background: #f3f4f6; border-radius: 4px; font-family: monospace; font-size: 12px;">
                                    ${expectedNames}
                                </div>
                            </div>
                            ${hasVotes ? `<div style="margin-top: 8px; color: #dc2626;">📊 Votes précédents détectés</div>` : ''}
                            <div style="margin-top: 8px; color: #059669; padding: 8px; background: #f0fdf4; border-radius: 4px;">
                                ✅ Seuls ces joueurs avec ces NOMS EXACTS peuvent se reconnecter
                            </div>
                        </div>
                    `;
                    
                    this.restoredMetadata = {
                        sessionCode: data.sessionCode,
                        participantCount: data.participantCount,
                        participants: data.participants,
                        gameMode: data.metadata.gameMode,
                        completedTasks: data.completedTasks || [],
                        taskEstimates: data.taskEstimates || {},
                        currentTaskIndex: data.metadata.currentTaskIndex || 0,
                        currentTaskVotes: data.metadata.currentTaskVotes || {},
                        currentTaskRound: data.metadata.currentTaskRound || 1,
                        tasks: data.tasks
                    };
                    this.restoredVotes = data.votes || {};
                } else {
                    document.getElementById('backlogJson').value = JSON.stringify(data, null, 2);
                    document.getElementById('backlogValidation').innerHTML = '';
                    this.restoredMetadata = null;
                    this.restoredVotes = {};
                }
            } catch (err) {
                alert('Erreur: JSON invalide - ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    showRestoredResults(data) {
        const taskIndex = this.gameState.currentTaskIndex;
        const lastRound = this.gameState.currentRound;
        const taskVotes = this.gameState.allVotes[taskIndex] || {};
        const roundVotes = taskVotes[lastRound] || {};
        
        this.gameState.votes = roundVotes;
        
        const metadata = this.restoredMetadata;
        if (metadata && metadata.participants) {
            this.gameState.players = metadata.participants.map((name, idx) => ({
                id: `player_${idx}`,
                name: name,
                hasVoted: true
            }));
        }
        
        this.hideAllScreens();
        document.getElementById('resultsScreen').classList.add('active');
        
        document.getElementById('continueBtn').style.display = 'block';
        document.getElementById('nextRoundBtn').style.display = 'block';
        
        this.renderResults();
    }

    cancelSetup() {
        this.leaveGame();
    }

    leaveGame() {
        this.socket.emit('leave-session');
        this.showMenuScreen();
    }

    returnToMenu() {
        this.leaveGame();
    }
}

const app = new PlanningPokerClient();
