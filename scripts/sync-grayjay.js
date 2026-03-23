import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = {
  apiKey: "AIzaSyBnfs5FK1e-raB0cimfzzplkdf0bJGyu1A",
  authDomain: "sedmha-2026-truro.firebaseapp.com",
  projectId: "sedmha-2026-truro",
  storageBucket: "sedmha-2026-truro.firebasestorage.app",
  messagingSenderId: "570108674333",
  appId: "1:570108674333:web:6971a6ba0450da9b2961f4"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TEAM_URLS = {
  // TEST MODE: Pointing u11a-truro to the completed u11aa-female division to simulate an active tournament
  "u11a-truro": "https://play.sedmha.com/l/1072/u11-a/schedule/",
  "u13b-truro": "https://play.sedmha.com/l/1077/u13-b/schedule/",
  "u13c-truro": "https://play.sedmha.com/l/1078/u13-c/schedule/",
  "u15c-truro": "https://play.sedmha.com/l/1082/u15-c/schedule/"
};

// TEST MODE: Tracking the Hawks to prove parsing works on a completed division
const TARGET_NAME = "Bearcats";

async function fetchApiGames(leagueId) {
    const upcomingUrl = `https://play.sedmha.com/api/games/upcoming/?master_schedule=1&league_id=${leagueId}&limit=1000`;
    const pastUrl = `https://play.sedmha.com/api/games/past/?master_schedule=1&league_id=${leagueId}&limit=1000`;
    
    let allGames = [];
    try {
        const uRes = await fetch(upcomingUrl);
        const uData = await uRes.json();
        if (uData.data && uData.data.games_and_events) {
            allGames = allGames.concat(uData.data.games_and_events.filter(g => g.row_type === 'game'));
        }
        
        const pRes = await fetch(pastUrl);
        const pData = await pRes.json();
        if (pData.data && pData.data.games) {
            allGames = allGames.concat(pData.data.games.filter(g => g.row_type === 'game'));
        }
    } catch (e) {
        console.error("API fetch failed", e);
    }
    
    // Sort chronologically by game_start_timestamp, push nulls to the end
    allGames.sort((a,b) => {
        const tsA = a.game_start_timestamp || Number.MAX_SAFE_INTEGER;
        const tsB = b.game_start_timestamp || Number.MAX_SAFE_INTEGER;
        return tsA - tsB;
    });
    return allGames;
}

async function scrapeTeamSchedule(teamId, url) {
    console.log(`Fetching chronologically ordered games for ${teamId} at ${url} via API...`);
    const match = url.match(/\/l\/(\d+)\//);
    if (!match) {
        console.error("Could not extract league ID from URL:", url);
        return { realGames: [], upcomingOpponent: null, upcomingArena: null };
    }
    const leagueId = match[1];
    const games = await fetchApiGames(leagueId);
    
    const realGames = [];
    const fullSchedule = {};
    let upcomingOpponent = null;
    let upcomingArena = null;

    for (const game of games) {
        if (game.row_type !== 'game') continue;
        
        const aName = game.team_a_name || "";
        const bName = game.team_b_name || "";
        
        if (game.game_number) {
            const gameKey = game.game_number.toString();
            const hasRealVenue = game.venue_short_name || game.venue_name;
            // Only overwrite if this game has a real venue, or no entry exists yet
            if (!fullSchedule[gameKey] || hasRealVenue) {
                fullSchedule[gameKey] = {
                    opponent: `${aName} vs ${bName}`,
                    arena: game.venue_short_name || game.venue_name || "TBD",
                };
            }
        }
        
        if (aName.includes(TARGET_NAME) || bName.includes(TARGET_NAME)) {
            const isTeamA = aName.includes(TARGET_NAME);
            const opponentName = isTeamA ? bName : aName;
            const teamScore = isTeamA ? game.goals_a : game.goals_b;
            const oppScore = isTeamA ? game.goals_b : game.goals_a;

            if (game.game_locked === 1 || game.game_locked === 2) { // 1=final, 2=in_progress
                if (teamScore !== null && oppScore !== null) {
                    realGames.push({
                        raw: `Game ${game.game_number}`,
                        win: parseInt(teamScore) > parseInt(oppScore),
                        opponent: opponentName.substring(0, 20),
                        score: `${teamScore} - ${oppScore}`
                    });
                }
            } else {
                // Future game
                if (!upcomingOpponent) {
                    upcomingOpponent = opponentName.substring(0, 20) || "TBD";
                    upcomingArena = game.venue_short_name || game.venue_name || "TBD";
                }
            }
        }
    }

    return { realGames, upcomingOpponent, upcomingArena, fullSchedule };
}

async function main() {
    console.log("Starting Sedmha sync...");
    const scheduleData = JSON.parse(fs.readFileSync('./src/data/schedule.json', 'utf8'));
    
    const stateDocRef = doc(db, "tournament", "state");
    const stateDoc = await getDoc(stateDocRef);
    let dbData = stateDoc.exists() ? stateDoc.data() : {};
    let teamStates = dbData.teamStates || scheduleData.teams.map((t) => ({ teamId: t.id, currentGameId: t.start_game, history: [] }));
    let gamesConfig = dbData.gamesConfig || {};

    // Merge any new teams from schedule.json that aren't in Firebase yet
    for (const team of scheduleData.teams) {
        if (!teamStates.find(s => s.teamId === team.id)) {
            console.log(`-> Adding new team: ${team.id}`);
            teamStates.push({ teamId: team.id, currentGameId: team.start_game, history: [] });
        }
    }

    let madeChanges = false;

    for (const team of scheduleData.teams) {
        const teamId = team.id;
        const url = TEAM_URLS[teamId];
        let currentState = teamStates.find(s => s.teamId === teamId);
        if (!currentState || currentState.currentGameId === -1 || !url) continue;

        const scrapedSequence = await scrapeTeamSchedule(teamId, url);
        const realGames = scrapedSequence.realGames;
        
        let tempGameId = team.start_game;
        let tempHistory = [];
        
        // Apply the ordered chronological wins/losses from the scraper!
        for (let i = 0; i < realGames.length; i++) {
            const expectedGameDefinition = scheduleData.games[teamId.split('-')[0]][tempGameId.toString()];
            if (!expectedGameDefinition) break;
            const win = realGames[i].win; // determined by scraper parsing
            const opponent = realGames[i].opponent;
            const score = realGames[i].score;
            tempHistory.push({ gameId: tempGameId, win, opponent, score });
            tempGameId = win ? (expectedGameDefinition.onWin || -1) : (expectedGameDefinition.onLoss || -1);
        }
        
        if (tempHistory.length > currentState.history.length) {
            console.log(`-> Updating ${teamId} history: advanced to ${tempGameId}`);
            currentState.history = tempHistory;
            currentState.currentGameId = tempGameId;
            madeChanges = true;
        }

        // ALWAYS update upcoming metadata if we found it, regardless of history progression
        if (scrapedSequence.upcomingOpponent && currentState.currentOpponent !== scrapedSequence.upcomingOpponent) {
            console.log(`-> Updating ${teamId} opponent: ${scrapedSequence.upcomingOpponent}`);
            currentState.currentOpponent = scrapedSequence.upcomingOpponent;
            madeChanges = true;
        }
        if (scrapedSequence.upcomingArena && currentState.currentArena !== scrapedSequence.upcomingArena) {
            console.log(`-> Updating ${teamId} arena: ${scrapedSequence.upcomingArena}`);
            currentState.currentArena = scrapedSequence.upcomingArena;
            madeChanges = true;
        }

        const category = teamId.split('-')[0];
        if (scrapedSequence.fullSchedule && Object.keys(scrapedSequence.fullSchedule).length > 0) {
            const stringifiedConfig = JSON.stringify(gamesConfig[category] || {});
            const stringifiedNew = JSON.stringify(scrapedSequence.fullSchedule || {});
            if (stringifiedConfig !== stringifiedNew) {
                console.log(`-> Updating ${category} global games config with ${Object.keys(scrapedSequence.fullSchedule).length} matches.`);
                gamesConfig[category] = scrapedSequence.fullSchedule;
                madeChanges = true;
            }
        }
    }

    if (madeChanges) {
        await setDoc(stateDocRef, { teamStates, gamesConfig, updatedAt: new Date().toISOString() });
        console.log("Save complete!");
    } else {
        console.log("No new updates required.");
    }
    
    process.exit(0);
}

main().catch(err => {
    console.error("FATAL ERROR:", err);
    process.exit(1);
});
