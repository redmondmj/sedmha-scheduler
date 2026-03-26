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
  tier?: string;
};

type TeamState = {
  teamId: string;
  currentGameId: number;
  currentOpponent?: string;
  currentArena?: string;
  history: { 
    gameId: number; 
    win: boolean;
    opponent?: string;
    score?: string;
    isWhatIf?: boolean;
  }[];
};

const PIN = import.meta.env.VITE_ADMIN_PIN || "0000";

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
  const [whatIfSteps, setWhatIfSteps] = useState<{gameId: number, win: boolean, opponent?: string, score?: string}[]>([]);
  const [gamesConfig, setGamesConfig] = useState<any>({});

  useEffect(() => {
    setWhatIfSteps([]);
  }, [selectedTeamId]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "tournament", "state"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.teamStates) {
          // Merge remote state with local schedule definition to ensure new teams are included
          const mergedStates = scheduleData.teams.map(t => {
            const existing = data.teamStates.find((s: any) => s.teamId === t.id);
            return existing || { teamId: t.id, currentGameId: t.start_game, history: [] };
          });
          setTeamStates(mergedStates);
          
          // If we found new teams, sync them back to Firestore
          if (mergedStates.length !== data.teamStates.length) {
            updateFirestore(mergedStates);
          }
        }
      } else {
        updateFirestore(teamStates);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    // Separate listener for gamesConfig (isolated from state writes)
    const unsubGames = onSnapshot(doc(db, "tournament", "gamesConfig"), (docSnap) => {
      if (docSnap.exists()) {
        setGamesConfig(docSnap.data());
      }
    });

    return () => { unsub(); unsubGames(); };
  }, []);

  const updateFirestore = async (newStates: TeamState[]) => {
    await setDoc(doc(db, "tournament", "state"), {
      teamStates: newStates,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  };

  const handleResult = async (teamId: string, win: boolean) => {
    const nextStates = teamStates.map((state) => {
      if (state.teamId !== teamId) return state;
      const gameCategory = teamId.split('-')[0];
      const categoryGames = (scheduleData.games as any)[gameCategory];
      const currentGame = categoryGames[state.currentGameId.toString()] as Game;
      if (!currentGame) return state;
      const nextGameId = win ? currentGame.onWin : currentGame.onLoss;
      
      // If nextGameId is null, we set a special value or handle it as "Finished"
      return {
        ...state,
        currentGameId: nextGameId || -1, // -1 means finished/out
        history: [...state.history, { gameId: state.currentGameId, win }],
      };
    });
    setTeamStates(nextStates);
    await updateFirestore(nextStates);
  };

  const handleUndo = async (teamId: string) => {
    const nextStates = teamStates.map((state) => {
      if (state.teamId !== teamId || state.history.length === 0) return state;
      const lastHistory = state.history[state.history.length - 1];
      return {
        ...state,
        currentGameId: lastHistory.gameId,
        history: state.history.slice(0, -1),
      };
    });
    setTeamStates(nextStates);
    await updateFirestore(nextStates);
  };

  const resetTeam = async (teamId: string) => {
    if (!window.confirm("Are you sure you want to reset this team's path back to the start?")) return;
    
    const team = scheduleData.teams.find((t) => t.id === teamId);
    if (!team) return;
    const nextStates = teamStates.map((state) =>
      state.teamId === teamId ? { teamId, currentGameId: team.start_game, history: [] } : state
    );
    setTeamStates(nextStates);
    await updateFirestore(nextStates);
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

  const ARENA_ALIASES: Record<string, string> = {
    "smc": "St. Margaret's Centre",
    "gec": "Greenfoot Energy Center",
    "rbc": "RBC Centre",
    "chp": "Cole Harbour Place",
    "ehs": "East Hants Sportsplex",
    "centennial": "Centennial Arena",
    "spryfield": "Spryfield Lions Rink",
    "zatzman": "Zatzman Sportsplex",
    "shearwater": "Shearwater Arena",
    "bmo": "BMO Centre",
  };

  const getArenaLink = (arenaName: string | null | undefined) => {
    if (!arenaName) return null;
    const lower = arenaName.toLowerCase();
    // Direct substring match against arenas map
    const directKey = Object.keys(scheduleData.arenas).find(k => lower.includes(k.toLowerCase()));
    if (directKey) return (scheduleData.arenas as any)[directKey];
    // Alias match for abbreviated API names (e.g. "SMC Fountain" -> "St. Margaret's Centre")
    for (const [abbr, fullName] of Object.entries(ARENA_ALIASES)) {
      if (lower.includes(abbr)) return (scheduleData.arenas as any)[fullName] || null;
    }
    return null;
  };

  const handleWhatIf = (gameId: number, win: boolean) => {
    setWhatIfSteps([...whatIfSteps, { gameId, win }]);
  };

  if (loading) return <div className="loading">Loading tournament data...</div>;

  const currentTeam = scheduleData.teams.find(t => t.id === selectedTeamId)!;
  const actualState = teamStates.find(s => s.teamId === selectedTeamId)!;
  const gameCategory = selectedTeamId.split('-')[0];
  
  // Clone current games and overlay with live config from Firebase scraping
  const currentGamesRaw = (scheduleData.games as any)[gameCategory];
  const currentGames: any = {};
  const liveGames = gamesConfig[gameCategory] || {};
  Object.keys(currentGamesRaw).forEach(gameId => {
    currentGames[gameId] = { ...currentGamesRaw[gameId] };
    if (liveGames[gameId]) {
      if (liveGames[gameId].arena && liveGames[gameId].arena !== "TBD") currentGames[gameId].arena = liveGames[gameId].arena;
      if (liveGames[gameId].opponent && !liveGames[gameId].opponent.includes("Winner #") && !liveGames[gameId].opponent.includes("Loser #")) currentGames[gameId].opponent = liveGames[gameId].opponent;
      if (liveGames[gameId].tier && liveGames[gameId].tier !== "TBD") currentGames[gameId].tier = liveGames[gameId].tier;
      if (liveGames[gameId].time) currentGames[gameId].time = liveGames[gameId].time;
    }
  });
  
  let tempGameId = actualState.currentGameId;
  for (const step of whatIfSteps) {
    const game = currentGames[tempGameId.toString()];
    if (!game) break;
    tempGameId = step.win ? (game.onWin || -1) : (game.onLoss || -1);
  }

  const currentState = {
    ...actualState,
    currentGameId: tempGameId,
    history: [...actualState.history, ...whatIfSteps.map(step => ({ ...step, isWhatIf: true }))]
  };

  const currentGame = currentState.currentGameId !== -1 
    ? (currentGames[currentState.currentGameId.toString()] as Game)
    : null;

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
            <div className="team-info-main">
              <h2>{currentTeam.name}</h2>
              {currentGame && <div className="tier-badge">Tier: {currentGame.tier}</div>}
            </div>
            <div className="record">Record: {wins} - {losses}</div>
          </div>

          {currentGame ? (
            <div className="game-card primary">
              <div className="card-label">{whatIfSteps.length > 0 ? "WHAT-IF POSITION" : "CURRENT GAME"}</div>
              <div className="game-id">Game #{currentGame.id}</div>
              <div className="game-time">{currentGame.time}</div>
              <div className="game-opp">vs {(whatIfSteps.length === 0 && currentState.currentOpponent) ? currentState.currentOpponent : currentGame.opponent}</div>
              <div className="game-arena">
                📍 {(whatIfSteps.length === 0 && currentState.currentArena && currentState.currentArena !== "TBD") ? currentState.currentArena : (currentGame.arena || "TBD")}
                {getArenaLink((whatIfSteps.length === 0 && currentState.currentArena && currentState.currentArena !== "TBD") ? currentState.currentArena : currentGame.arena) && (
                  <a href={getArenaLink((whatIfSteps.length === 0 && currentState.currentArena && currentState.currentArena !== "TBD") ? currentState.currentArena : currentGame.arena)!} target="_blank" rel="noopener noreferrer" className="maps-link">
                    Maps
                  </a>
                )}
              </div>
              
              {isEditMode && whatIfSteps.length === 0 && (
                <div className="actions">
                  <button className="btn win" onClick={() => handleResult(selectedTeamId, true)}>Record WIN</button>
                  <button className="btn loss" onClick={() => handleResult(selectedTeamId, false)}>Record LOSS</button>
                </div>
              )}
            </div>
          ) : (
            <div className="game-card finished">
              <h3>Tournament Complete</h3>
              <p>The Bearcats have finished their path.</p>
            </div>
          )}

          {isEditMode && whatIfSteps.length === 0 && (
            <div className="danger-zone">
              {actualState.history.length > 0 && (
                <button className="btn undo" onClick={() => handleUndo(selectedTeamId)}>Undo Last Result</button>
              )}
              <button className="btn reset" onClick={() => resetTeam(selectedTeamId)}>Reset Path</button>
            </div>
          )}
        </section>

        {currentGame && (
          <section className="projections">
            <div className="projections-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <h3>Potential Next Games</h3>
                {whatIfSteps.length > 0 && (
                  <div style={{ fontSize: '0.8rem', color: '#0056b3', marginTop: '4px', fontWeight: 'bold' }}>
                    Simulation Path: {whatIfSteps.map((step, i) => (
                      <span key={i}>
                        {step.win ? 'W' : 'L'} {i < whatIfSteps.length - 1 ? ' → ' : ' → '}
                      </span>
                    ))} Current
                  </div>
                )}
              </div>
              {whatIfSteps.length > 0 && (
                <button className="btn-secondary" onClick={() => setWhatIfSteps([])} style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                  Clear What-If
                </button>
              )}
            </div>
            <div className="projection-grid">
              <div 
                className={`game-card mini win-path ${nextOnWin ? 'clickable' : ''}`}
                onClick={() => nextOnWin && handleWhatIf(currentGame.id, true)}
                style={nextOnWin ? { cursor: 'pointer', opacity: 0.9, transition: 'opacity 0.2s' } : {}}
              >
                <div className="card-label">IF WIN {nextOnWin && '(Click to explore)'}</div>
                {nextOnWin ? (
                  <>
                    <div className="tier-sub">{nextOnWin.tier}</div>
                    <div className="game-id">Game #{nextOnWin.id}</div>
                    <div className="game-time">{nextOnWin.time}</div>
                    <div className="game-opp">vs {nextOnWin.opponent}</div>
                    <div className="game-arena">
                      📍 {nextOnWin.arena || "TBD"}
                    </div>
                  </>
                ) : <div className="game-opp-status">Tournament Complete</div>}
              </div>

              <div 
                className={`game-card mini loss-path ${nextOnLoss ? 'clickable' : ''}`}
                onClick={() => nextOnLoss && handleWhatIf(currentGame.id, false)}
                style={nextOnLoss ? { cursor: 'pointer', opacity: 0.9, transition: 'opacity 0.2s' } : {}}
              >
                <div className="card-label">IF LOSS {nextOnLoss && '(Click to explore)'}</div>
                {nextOnLoss ? (
                  <>
                    <div className="tier-sub">{nextOnLoss.tier}</div>
                    <div className="game-id">Game #{nextOnLoss.id}</div>
                    <div className="game-time">{nextOnLoss.time}</div>
                    <div className="game-opp">vs {nextOnLoss.opponent}</div>
                    <div className="game-arena">
                      📍 {nextOnLoss.arena || "TBD"}
                    </div>
                  </>
                ) : (
                  <div className="game-opp-status eliminated">
                    {losses >= 2 ? "OUT - ELIMINATED" : "Tournament Complete"}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {currentState.history.length > 0 && (
          <section className="history-section">
            <h3>Path History</h3>
            <div className="history-list">
              {currentState.history.map((h, i) => (
                <div key={i} className={`history-item ${(h as any).isWhatIf ? 'what-if-item' : ''}`} style={(h as any).isWhatIf ? { borderStyle: 'dashed', opacity: 0.8 } : {}}>
                  <span>Game #{h.gameId} {h.opponent && <span style={{fontSize: '0.85em', color: '#555'}}>vs {h.opponent}</span>}</span>
                  <span className={h.win ? "txt-win" : "txt-loss"}>
                    {h.score && <span style={{color: '#333', marginRight: '6px', fontSize: '0.9em'}}>{h.score}</span>}
                    {h.win ? "WIN" : "LOSS"} {(h as any).isWhatIf && <small style={{ color: '#888', marginLeft: '5px' }}>(What If)</small>}
                  </span>
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
