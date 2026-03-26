import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, terminate } from 'firebase/firestore';
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
  "u11a-truro": "https://play.sedmha.com/l/1072/u11-a/teams/schedule/11262/truro-bearcats/",
  "u13b-truro": "https://play.sedmha.com/l/1077/u13-b/teams/schedule/11342/truro-bearcats/",
  "u13c-truro": "https://play.sedmha.com/l/1078/u13-c/teams/schedule/11363/trurobearcats-campbell/",
  "u15c-truro": "https://play.sedmha.com/l/1082/u15-c/teams/schedule/11479/trurobearcatscampbell/",
  "u18aa-truro": "https://play.sedmha.com/l/1083/u18-aa/teams/schedule/11418/truro-bearcats/"
};

// TEST MODE: Tracking the Hawks to prove parsing works on a completed division
const TARGET_NAME = "Bearcats";
const TIMEZONE = "America/Halifax";

function formatTimeAtlantic(timestamp) {
    if (!timestamp) return null;
    const dateObj = new Date(timestamp * 1000);
    const dayShort = dateObj.toLocaleString('en-US', { timeZone: TIMEZONE, weekday: 'short' });
    const dateNum = dateObj.toLocaleString('en-US', { timeZone: TIMEZONE, day: 'numeric' });
    const timeStr = dateObj.toLocaleString('en-US', { timeZone: TIMEZONE, hour: 'numeric', minute: '2-digit', hour12: true });
    return `${dayShort} ${dateNum} ${timeStr}`;
}

async function fetchTeamGames(teamGrayjayId) {
    // Fetch team-specific games from 3 endpoints
    let allGames = [];
    try {
        // Today's games (includes same-day finished games with scores)
        const todayRes = await fetch(`https://play.sedmha.com/api/games/upcoming/${teamGrayjayId}?today=1&limit=100&offset=0`);
        const todayData = await todayRes.json();
        if (todayData.data && Array.isArray(todayData.data)) {
            allGames = allGames.concat(todayData.data);
        }
        
        // Upcoming games (future games)
        const upRes = await fetch(`https://play.sedmha.com/api/games/upcoming/${teamGrayjayId}?limit=100&offset=0`);
        const upData = await upRes.json();
        if (upData.data && Array.isArray(upData.data)) {
            allGames = allGames.concat(upData.data);
        }
        
        // Past games (completed games from previous days)
        const pastRes = await fetch(`https://play.sedmha.com/api/games/past/?team_id=${teamGrayjayId}&limit=100&offset=0`);
        const pastData = await pastRes.json();
        if (pastData.data && Array.isArray(pastData.data)) {
            allGames = allGames.concat(pastData.data);
        } else if (pastData.data?.games && Array.isArray(pastData.data.games)) {
            allGames = allGames.concat(pastData.data.games);
        }
    } catch (e) {
        console.error("Team API fetch failed", e);
    }
    
    // Deduplicate by game_id
    const seen = new Set();
    allGames = allGames.filter(g => {
        if (!g.game_id || seen.has(g.game_id)) return false;
        seen.add(g.game_id);
        return true;
    });
    
    // Sort chronologically
    allGames.sort((a,b) => {
        const tsA = a.game_start_timestamp || Number.MAX_SAFE_INTEGER;
        const tsB = b.game_start_timestamp || Number.MAX_SAFE_INTEGER;
        return tsA - tsB;
    });
    return allGames;
}

async function fetchLeagueGames(leagueId) {
    // Fetch ALL games in the league for fullSchedule (all teams, not just Bearcats)
    const url = `https://play.sedmha.com/api/games/upcoming/?master_schedule=1&league_id=${leagueId}&limit=1000`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.data && data.data.games_and_events) {
            return data.data.games_and_events.filter(g => g.row_type === 'game');
        }
    } catch (e) {
        console.error("League API fetch failed", e);
    }
    return [];
}

async function scrapeTeamSchedule(teamId, url) {
    console.log(`Fetching games for ${teamId} at ${url} via API...`);
    const leagueMatch = url.match(/\/l\/(\d+)\//);
    const teamMatch = url.match(/\/schedule\/(\d+)\//);
    if (!leagueMatch || !teamMatch) {
        console.error("Could not extract IDs from URL:", url);
        return { realGames: [], upcomingOpponent: null, upcomingArena: null, fullSchedule: {} };
    }
    const leagueId = leagueMatch[1];
    const teamGrayjayId = teamMatch[1];
    
    // Fetch team-specific games (for results + upcoming) and league-wide games (for full schedule)
    const [teamGames, leagueGames] = await Promise.all([
        fetchTeamGames(teamGrayjayId),
        fetchLeagueGames(leagueId)
    ]);
    
    const realGames = [];
    const fullSchedule = {};
    let upcomingOpponent = null;
    let upcomingArena = null;

    // Build fullSchedule from league-wide games (all teams in the division)
    for (const game of leagueGames) {
        if (!game.game_number) continue;
        const gameKey = game.game_number.toString();
        const hasRealVenue = game.venue_short_name || game.venue_name;
        if (!fullSchedule[gameKey] || hasRealVenue) {
            const formattedTime = formatTimeAtlantic(game.game_start_timestamp);
            const aName = game.team_a_name || "";
            const bName = game.team_b_name || "";
            const entry = {
                opponent: `${aName} vs ${bName}`,
                arena: game.venue_short_name || game.venue_name || "TBD",
                tier: game.subseason_name || "TBD",
            };
            if (formattedTime) entry.time = formattedTime;
            fullSchedule[gameKey] = entry;
        }
    }

    // Process team-specific games for results and upcoming opponent
    for (const game of teamGames) {
        const aName = game.team_a_name || "";
        const bName = game.team_b_name || "";
        
        // Also add team games to fullSchedule (they may include opening round games missing from league)
        if (game.game_number) {
            const gameKey = game.game_number.toString();
            const formattedTime = formatTimeAtlantic(game.game_start_timestamp);
            const entry = {
                opponent: `${aName} vs ${bName}`,
                arena: game.venue_short_name || game.venue_name || "TBD",
                tier: game.subseason_name || "TBD",
            };
            if (formattedTime) entry.time = formattedTime;
            // Team-specific data overrides league data (more accurate for our team)
            fullSchedule[gameKey] = entry;
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
    const gamesConfigRef = doc(db, "tournament", "gamesConfig");
    const stateDoc = await getDoc(stateDocRef);
    const gamesConfigDoc = await getDoc(gamesConfigRef);
    let dbData = stateDoc.exists() ? stateDoc.data() : {};
    let teamStates = dbData.teamStates || scheduleData.teams.map((t) => ({ teamId: t.id, currentGameId: t.start_game, history: [] }));
    let gamesConfig = gamesConfigDoc.exists() ? gamesConfigDoc.data() : {};

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

    // Save teamStates
    console.log(`Writing to Firestore: ${teamStates.length} teams...`);
    await setDoc(stateDocRef, { teamStates, updatedAt: new Date().toISOString() });
    
    // Save gamesConfig separately to avoid onSnapshot overwrites
    console.log(`Writing gamesConfig: ${Object.keys(gamesConfig).length} divisions...`);
    await setDoc(gamesConfigRef, gamesConfig);
    
    // Verify gamesConfig persisted
    const verifyDoc = await getDoc(gamesConfigRef);
    const verifyData = verifyDoc.data();
    console.log(`Verified gamesConfig divisions: [${Object.keys(verifyData || {}).join(', ')}]`);
    
    // Ensure Firestore flushes all writes before exiting
    await terminate(db);
    process.exit(0);
}

main().catch(err => {
    console.error("FATAL ERROR:", err);
    process.exit(1);
});
