// server.test.js
const {
  calculateMedian,
  isUnanimous,
  checkCoffeeBreak,
  checkVotingCondition,
} = require('./server.js');

const { server } = require('./server.js');

afterAll((done) => {
  server.close(done);
});


// 1. Calcul de médiane avec cartes spéciales
test('calculateMedian ignore coffee et ? et calcule la médiane', () => {
  const votes = ['1', '3', 'coffee', '?', '5'];
  const result = calculateMedian(votes);
  expect(result).toBe(3);
});

// 2. Unanimité simple
test('isUnanimous retourne true quand tous les votes sont identiques', () => {
  expect(isUnanimous(['5', '5', '5'])).toBe(true);
});

test('isUnanimous retourne false quand les votes sont différents', () => {
  expect(isUnanimous(['5', '8', '5'])).toBe(false);
});

// 3. Déclenchement d’une pause café
test('checkCoffeeBreak ferme la session quand tous les joueurs votent coffee', () => {
  const roomCode = 'ABC123';
  const session = {
    players: [
      { name: 'Alice', hasVoted: true, vote: 'coffee' },
      { name: 'Bob', hasVoted: true, vote: 'coffee' },
    ],
    backlog: [{ name: 'Task 1' }],
    completedTasks: [],
    taskEstimates: {},
    currentTaskIndex: 0,
    currentRound: 1,
    gameMode: 'strict',
    creatorName: 'PO',
    allVotes: {},
  };

  const emitMock = jest.fn();
  const io = { to: jest.fn().mockReturnValue({ emit: emitMock }) };

  const result = checkCoffeeBreak(session, roomCode, io);

  expect(result).toBe(true);
  expect(io.to).toHaveBeenCalledWith(roomCode);
  expect(emitMock).toHaveBeenCalledWith('coffee-break', {
    players: ['Alice', 'Bob'],
  });
});

// 4. Résultats en mode strict sans unanimité
test('checkVotingCondition en mode strict sans unanimité demande un nouveau round', () => {
  const roomCode = 'ROOM1';
  const session = {
    players: [
      { id: '1', name: 'Alice', hasVoted: true, vote: '3' },
      { id: '2', name: 'Bob', hasVoted: true, vote: '5' },
    ],
    currentRound: 1,
    gameMode: 'strict',
  };

  const emitMock = jest.fn();
  const io = { to: jest.fn().mockReturnValue({ emit: emitMock }) };

  checkVotingCondition(session, roomCode, io);

  expect(io.to).toHaveBeenCalledWith(roomCode);
  expect(emitMock).toHaveBeenCalledWith(
    'show-results',
    expect.objectContaining({
      showNextRoundButton: true,
      isUnanimous: false,
    })
  );
});
