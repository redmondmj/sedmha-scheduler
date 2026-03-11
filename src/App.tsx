import { useState } from 'react';
import './App.css';
import scheduleData from './data/schedule.json';

type Game = {
  id: number;
  time: string;
  opponent: string;
  arena: string;
  onWin: number;
  onLoss: number;
};

type TeamState = {
  teamId: string;
  currentGameId: number;
  history: number[];
};

function App() {
  const [teamStates, setTeamStates] = useState<TeamState[]>(
    scheduleData.teams.map((t) => ({
      teamId: t.id,
      currentGameId: t.start_game,
      history: [],
    }))
  );

  const handleResult = (teamId: string, win: boolean) => {
    setTeamStates((prev) =>
      prev.map((state) => {
        if (state.teamId !== teamId) return state;

        const currentGames = teamId.includes('u11a') ? scheduleData.games.u11a : scheduleData.games.u13c;
        const currentGame = currentGames[state.currentGameId.toString() as keyof typeof currentGames] as Game;

        if (!currentGame) return state;

        const nextGameId = win ? currentGame.onWin : currentGame.onLoss;

        return {
          ...state,
          currentGameId: nextGameId,
          history: [...state.history, state.currentGameId],
        };
      })
    );
  };

  const resetTeam = (teamId: string) => {
    const team = scheduleData.teams.find((t) => t.id === teamId);
    if (!team) return;
    setTeamStates((prev) =>
      prev.map((state) =>
        state.teamId === teamId ? { teamId, currentGameId: team.start_game, history: [] } : state
      )
    );
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>SEDMHA 2026</h1>
        <p>Truro Bearcats Tracker</p>
      </header>

      <main className="team-grid">
        {scheduleData.teams.map((team) => {
          const state = teamStates.find((s) => s.teamId === team.id)!;
          const currentGames = team.id.includes('u11a') ? scheduleData.games.u11a : scheduleData.games.u13c;
          const currentGame = currentGames[state.currentGameId.toString() as keyof typeof currentGames] as Game;

          return (
            <div key={team.id} className="team-card">
              <div className="team-header">
                <h2>{team.name}</h2>
                <span className="badge">{team.level}</span>
              </div>

              {currentGame ? (
                <div className="game-info">
                  <div className="game-status">Next Game: #{currentGame.id}</div>
                  <div className="detail"><strong>Time:</strong> {currentGame.time}</div>
                  <div className="detail"><strong>Opponent:</strong> {currentGame.opponent}</div>
                  <div className="detail">
                    <strong>Arena:</strong> {currentGame.arena}
                  </div>
                  <div className="actions">
                    <button className="btn win" onClick={() => handleResult(team.id, true)}>Won Game</button>
                    <button className="btn loss" onClick={() => handleResult(team.id, false)}>Lost Game</button>
                  </div>
                </div>
              ) : (
                <div className="game-info finished">
                  <p>Bracket progression beyond this point needs more data from the schedules.</p>
                  <button className="btn reset" onClick={() => resetTeam(team.id)}>Reset Bracket</button>
                </div>
              )}

              {state.history.length > 0 && (
                <div className="history">
                  <h3>History</h3>
                  <ul>
                    {state.history.map((gid, idx) => (
                      <li key={idx}>Game #{gid}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </main>

      <section className="arenas">
        <h3>Quick Arena Links</h3>
        <div className="arena-links">
          {Object.entries(scheduleData.arenas).map(([name, url]) => (
            <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="arena-link">
              {name}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
