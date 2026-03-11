import { useState, useEffect } from 'react';
import './App.css';
import scheduleData from './data/schedule.json';
import { db } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

type Game = {
  id: number;
  time: string;
  opponent: string;
  arena: string;
  onWin: number | null;
  onLoss: number | null;
};

type TeamState = {
  teamId: string;
  currentGameId: number;
  history: { gameId: number; win: boolean }[];
};

const PIN = "1234";

function App() {
  const [teamStates, setTeamStates] = useState<TeamState[]>(
    scheduleData.teams.map((t) => ({
      teamId: t.id,
      currentGameId: t.start_game,
      history: [],
    }))
  );
  const [selectedTeamId, setSelectedTeamId] = useState(scheduleData.teams[0].id);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "tournament", "state"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.teamStates) setTeamStates(data.teamStates);
      } else {
        updateFirestore(teamStates);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const updateFirestore = async (newStates: TeamState[]) => {
    await setDoc(doc(db, "tournament", "state"), {
      teamStates: newStates,
      updatedAt: new Date().toISOString()
    });
  };

  const handleResult = async (teamId: string, win: boolean) => {
    const nextStates = teamStates.map((state) => {
      if (state.teamId !== teamId) return state;
      const currentGames = teamId.includes('u11a') ? scheduleData.games.u11a : scheduleData.games.u13c;
      const currentGame = currentGames[state.currentGameId.toString() as keyof typeof currentGames] as Game;
      if (!currentGame) return state;
      const nextGameId = win ? currentGame.onWin : currentGame.onLoss;
      if (nextGameId === null) return state;
      return {
        ...state,
        currentGameId: nextGameId,
        history: [...state.history, { gameId: state.currentGameId, win }],
      };
    });
    setTeamStates(nextStates);
    await updateFirestore(nextStates);
  };

  const resetTeam = async (teamId: string) => {
    const team = scheduleData.teams.find((t) => t.id === teamId);
    if (!team) return;
    const nextStates = teamStates.map((state) =>
      state.teamId === teamId ? { teamId, currentGameId: team.start_game, history: [] } : state
    );
    setTeamStates(nextStates);
    await updateFirestore(nextStates);
    setIsEditMode(false);
  };

  const handleUnlock = () => {
    if (pinInput === PIN) {
      setIsEditMode(true);
      setShowPinModal(false);
      setPinInput("");
    } else {
      alert("Incorrect PIN");
      setPinInput("");
    }
  };

  const getArenaLink = (arenaName: string) => {
    const key = Object.keys(scheduleData.arenas).find(k => arenaName.includes(k));
    return key ? scheduleData.arenas[key as keyof typeof scheduleData.arenas] : null;
  };

  if (loading) return <div className="loading">Loading tournament data...</div>;

  const currentTeam = scheduleData.teams.find(t => t.id === selectedTeamId)!;
  const currentState = teamStates.find(s => s.teamId === selectedTeamId)!;
  const currentGames = selectedTeamId.includes('u11a') ? scheduleData.games.u11a : scheduleData.games.u13c;
  const currentGame = currentGames[currentState.currentGameId.toString() as keyof typeof currentGames] as Game;

  const wins = currentState.history.filter(h => h.win).length;
  const losses = currentState.history.filter(h => !h.win).length;

  const nextOnWin = currentGame?.onWin ? (currentGames[currentGame.onWin.toString() as keyof typeof currentGames] as Game) : null;
  const nextOnLoss = currentGame?.onLoss ? (currentGames[currentGame.onLoss.toString() as keyof typeof currentGames] as Game) : null;

  return (
    <div className="app-container">
      <header className="header">
        <h1>Truro Bearcats</h1>
        <div className="team-selector">
          {scheduleData.teams.map(t => (
            <button 
              key={t.id} 
              className={`tab ${selectedTeamId === t.id ? 'active' : ''}`}
              onClick={() => setSelectedTeamId(t.id)}
            >
              {t.level}
            </button>
          ))}
        </div>
      </header>

      <div className="admin-bar">
        {isEditMode ? (
          <div className="edit-status">
            <span>🔴 EDIT MODE ON</span>
            <button onClick={() => setIsEditMode(false)} className="btn-admin">Lock</button>
          </div>
        ) : (
          <button onClick={() => setShowPinModal(true)} className="btn-admin">Unlock Edit Mode</button>
        )}
      </div>

      <main className="main-content">
        <section className="current-status">
          <div className="status-header">
            <h2>{currentTeam.name}</h2>
            <div className="record">Record: {wins} - {losses}</div>
          </div>

          {currentGame ? (
            <div className="game-card primary">
              <div className="card-label">CURRENT GAME</div>
              <div className="game-id">Game #{currentGame.id}</div>
              <div className="game-time">{currentGame.time}</div>
              <div className="game-opp">vs {currentGame.opponent}</div>
              <div className="game-arena">
                📍 {currentGame.arena}
                {getArenaLink(currentGame.arena) && (
                  <a href={getArenaLink(currentGame.arena)!} target="_blank" rel="noopener noreferrer" className="maps-link">
                    Open in Maps
                  </a>
                )}
              </div>
              
              {isEditMode && (
                <div className="actions">
                  <button className="btn win" onClick={() => handleResult(selectedTeamId, true)}>Record WIN</button>
                  <button className="btn loss" onClick={() => handleResult(selectedTeamId, false)}>Record LOSS</button>
                </div>
              )}
            </div>
          ) : (
            <div className="game-card finished">
              <h3>Tournament Complete!</h3>
              {isEditMode && <button className="btn reset" onClick={() => resetTeam(selectedTeamId)}>Reset Path</button>}
            </div>
          )}
        </section>

        {currentGame && (
          <section className="projections">
            <h3>Potential Next Games</h3>
            <div className="projection-grid">
              <div className="game-card mini win-path">
                <div className="card-label">IF WIN</div>
                {nextOnWin ? (
                  <>
                    <div className="game-id">Game #{nextOnWin.id}</div>
                    <div className="game-time">{nextOnWin.time}</div>
                    <div className="game-opp">vs {nextOnWin.opponent}</div>
                    <div className="game-arena">
                      {getArenaLink(nextOnWin.arena) && (
                        <a href={getArenaLink(nextOnWin.arena)!} target="_blank" rel="noopener noreferrer" className="maps-link">
                          Maps
                        </a>
                      )}
                    </div>
                  </>
                ) : <div className="game-opp">Finals / TBD</div>}
              </div>

              <div className="game-card mini loss-path">
                <div className="card-label">IF LOSS</div>
                {nextOnLoss ? (
                  <>
                    <div className="game-id">Game #{nextOnLoss.id}</div>
                    <div className="game-time">{nextOnLoss.time}</div>
                    <div className="game-opp">vs {nextOnLoss.opponent}</div>
                    <div className="game-arena">
                      {getArenaLink(nextOnLoss.arena) && (
                        <a href={getArenaLink(nextOnLoss.arena)!} target="_blank" rel="noopener noreferrer" className="maps-link">
                          Maps
                        </a>
                      )}
                    </div>
                  </>
                ) : <div className="game-opp">Finals / TBD</div>}
              </div>
            </div>
          </section>
        )}

        {currentState.history.length > 0 && (
          <section className="history-section">
            <h3>Path History</h3>
            <div className="history-list">
              {currentState.history.map((h, i) => (
                <div key={i} className="history-item">
                  <span>Game #{h.gameId}</span>
                  <span className={h.win ? "txt-win" : "txt-loss"}>{h.win ? "WIN" : "LOSS"}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {showPinModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Enter PIN</h3>
            <p>Unlock edit mode to record results.</p>
            <input 
              type="password" 
              autoFocus
              value={pinInput} 
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowPinModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleUnlock}>Unlock</button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <div className="arena-links">
          {Object.entries(scheduleData.arenas).map(([name, url]) => (
            <a key={name} href={url} target="_blank" rel="noopener noreferrer">{name}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}

export default App;
