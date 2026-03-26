import fs from 'fs';

const u11_lines = `
Thu 26 1:30 PM U11 A 1 Riverview Blues Dartmouth Whalers Greenfoot Energy Center (Rink C)
Thu 26 1:30 PM U11 A 2 Northside Vikings Kent-Sud Flames RBC Centre - Rink B
Thu 26 1:30 PM U11 A 3 Brewer Witches Chaleur Titan RBC Centre - Rink D
Thu 26 1:30 PM U11 A 4 St Johns Caps TASA Ducks CFB Halifax - Shearwater Arena
Thu 26 1:30 PM U11 A 5 Sackville AIL Rangers Clare-Digby Dartmouth Zatzman Sportsplex
Thu 26 1:30 PM U11 A 6 Sackville Flyers Dieppe Memramcook Aigles Spryfield Lions Rink
Thu 26 1:30 PM U11 A 7 Bedford Blues White Nasis Y's Wildcats St. Margaret's Centre (Fountain)
Thu 26 1:30 PM U11 A 8 Truro Bearcats Moncton Hawks Firth East Hants Sportsplex (Ice Pad B)
Thu 26 2:00 PM U11 A 9 Antigonish Bulldogs Black Halifax Hawks Cole Harbour Place (Scotia 2)
Fri 27 8:00 AM U11 A 14 Winner Game 9 Bedford Blues Blue Centennial Arena (Halifax)
Fri 27 8:00 AM U11 A 10 Winner Game 1 Winner Game 2 St. Margaret's Centre (Fountain)
Fri 27 8:30 AM U11 A 23 Loser Game 1 Loser Game 2 St. Margaret's Centre (Smith)
Fri 27 9:30 AM U11 A 25 Loser Game 3 Loser Game 4 Centennial Arena (Halifax)
Fri 27 9:30 AM U11 A 11 Winner Game 3 Winner Game 4 St. Margaret's Centre (Fountain)
Fri 27 10:00 AM U11 A 24 Loser Game 5 Loser Game 6 St. Margaret's Centre (Smith)
Fri 27 11:00 AM U11 A 26 Loser Game 7 Loser Game 9 Centennial Arena (Halifax)
Fri 27 12:30 PM U11 A 13 Winner Game 7 Winner Game 8 Centennial Arena (Halifax)
Fri 27 2:00 PM U11 A 12 Winner Game 5 Winner Game 6 Centennial Arena (Halifax)
Fri 27 2:30 PM U11 A 31 Loser Game 14 Loser Game 8 Greenfoot Energy Center (Rink D)
Fri 27 3:30 PM U11 A 15 Winner Game 10 Winner Game 11 Centennial Arena (Halifax)
Fri 27 5:00 PM U11 A 16 Winner Game 13 Winner Game 14 Centennial Arena (Halifax)
Sat 28 8:00 AM U11 A 17 Loser Game 15 Loser Game 16 Centennial Arena (Halifax)
Sat 28 8:00 AM U11 A 37 Loser Game 26 Loser Game 24 Cole Harbour Place (Scotia 1)
Sat 28 8:00 AM U11 A 27 Loser Game 12 Winner Game 23 St. Margaret's Centre (Fountain)
Sat 28 8:30 AM U11 A 30 Loser Game 10 Winner Game 26 St. Margaret's Centre (Smith)
Sat 28 9:30 AM U11 A 18 Winner Game 12 Winner Game 16 Centennial Arena (Halifax)
Sat 28 9:30 AM U11 A 28 Loser Game 11 Winner Game 24 St. Margaret's Centre (Fountain)
Sat 28 3:30 PM U11 A 19 Winner Game 17 Loser Game 18 Centennial Arena (Halifax)
Sat 28 5:00 PM U11 A 20 Winner Game 15 Winner Game 18 Centennial Arena (Halifax)
Sat 28 5:00 PM U11 A 36 Loser Game 23 Loser Game 25 Cole Harbour Place (Scotia 1)
Sat 28 5:00 PM U11 A 33 Winner Game 30 Winner Game 31 St. Margaret's Centre (Fountain)
Sat 28 7:00 PM U11 A 38 Loser Game 31 Winner Game 37 Cole Harbour Place (Scotia 2)
Sat 28 5:30 PM U11 A 29 Loser Game 13 Winner Game 25 St. Margaret's Centre (Smith)
Sat 28 7:00 PM U11 A 32 Winner Game 27 Winner Game 28 St. Margaret's Centre (Smith)
Sun 29 8:00 AM U11 A 34 Winner Game 29 Winner Game 33 Centennial Arena (Halifax)
Sun 29 8:00 AM U11 A 21 Winner Game 19 Loser Game 20 Spryfield Lions Rink
Sun 29 9:30 AM U11 A 39 Winner Game 36 Civic Final Winner Game 38 Spryfield Lions Rink
Sun 29 12:30 PM U11 A 35 Winner Game 32 Accord Championship Winner Game 34 Greenfoot Energy Center (Rink B)
Sun 29 1:00 PM U11 A 22 Winner Game 21 Odyssey Championship Winner Game 20 RBC Centre - Rink B
`.trim().split('\n');

const u13_lines = `
Thu 26 3:00 PM U13 C 1 Bedford Bolts Sackville Rangers Cormier Greenfoot Energy Center (Rink A)
Thu 26 3:00 PM U13 C 2 Dieppe Memramcook Aigles Therrien Bedford Spitfires Greenfoot Energy Center (Rink C)
Thu 26 3:00 PM U13 C 4 Dartmouth Orcas Riverview Blues Grundy RBC Centre - Rink D
Thu 26 3:00 PM U13 C 5 Dieppe Memramcook Aigles Cormier Northside Vikings Team 1 CFB Halifax - Shearwater Arena
Thu 26 3:00 PM U13 C 6 Cole Harbour White Wings Northside Vikings Team 2 Dartmouth Zatzman Sportsplex
Thu 26 3:00 PM U13 C 7 Shediac Cap Pele Predators Leblanc Cole Harbour Black Wings Spryfield Lions Rink
Thu 26 3:00 PM U13 C 8 Dieppe Memramcook Aigles Leger Oromocto Eagles Fairweather St. Margaret's Centre (Fountain)
Thu 26 3:00 PM U13 C 9 TASA Ducks Black Shediac Cap Pele Predatours Boudreau East Hants Sportsplex (Ice Pad B)
Thu 26 3:30 PM U13 C 10 Moncton Hawks Ellis Sussex Rangers Team 2 Cole Harbour Place (Scotia 2)
Thu 26 3:30 PM U13 C 11 Lewisville Lightning Maltais Truro Bearcats - Campbell Greenfoot Energy Center (Rink B)
Thu 26 3:30 PM U13 C 12 Bedford Mooseheads Shediac Cap Pele Predatours Pascal Greenfoot Energy Center (Rink D)
Thu 26 4:30 PM U13 C 3 I.I.H.A. Saints Dartmouth Sharks RBC Centre - Rink B
Fri 27 8:30 AM U13 C 14 Winner Game 3 Winner Game 4 Greenfoot Energy Center (Rink B)
Fri 27 9:30 AM U13 C 15 Winner Game 5 Winner Game 6 Greenfoot Energy Center (Rink C)
Fri 27 1:00 PM U13 C 18 Winner Game 12 Dartmouth Hurricanes Greenfoot Energy Center (Rink B)
Fri 27 10:00 AM U13 C 16 Winner Game 8 Winner Game 9 Greenfoot Energy Center (Rink D)
Fri 27 11:00 AM U13 C 13 Winner Game 1 Winner Game 2 Greenfoot Energy Center (Rink A)
Fri 27 12:30 PM U13 C 17 Winner Game 10 Winner Game 11 Greenfoot Energy Center (Rink A)
Fri 27 1:00 PM U13 C 30 Loser Game 12 Loser Game 11 Greenfoot Energy Center (Rink D)
Fri 27 4:00 PM U13 C 35 Loser Game 8 Loser Game 9 RBC Centre - Rink A
Fri 27 5:00 PM U13 C 32 Loser Game 5 Loser Game 4 RBC Centre - Rink B
Fri 27 5:00 PM U13 C 33 Loser Game 1 Loser Game 2 RBC Centre - Rink D
Fri 27 5:30 PM U13 C 19 Winner Game 13 Winner Game 14 Greenfoot Energy Center (Rink B)
Fri 27 5:30 PM U13 C 31 Loser Game 10 Loser Game 6 RBC Centre - Rink A
Fri 27 6:30 PM U13 C 34 Loser Game 3 Loser Game 7 RBC Centre - Rink D
Fri 27 7:00 PM U13 C 20 Winner Game 7 Winner Game 16 Greenfoot Energy Center (Rink B)
Fri 27 8:30 PM U13 C 21 Winner Game 17 Winner Game 18 Greenfoot Energy Center (Rink D)
Sat 28 9:30 AM U13 C 47 Loser Game 33 Loser Game 30 Greenfoot Energy Center (Rink A)
Sat 28 9:30 AM U13 C 23 Winner Game 19 Winner Game 15 Greenfoot Energy Center (Rink C)
Sat 28 11:00 AM U13 C 48 Loser Game 31 Loser Game 34 Greenfoot Energy Center (Rink A)
Sat 28 11:00 AM U13 C 24 Winner Game 20 Winner Game 21 Greenfoot Energy Center (Rink C)
Sat 28 11:30 AM U13 C 22 Loser Game 19 Loser Game 20 Greenfoot Energy Center (Rink D)
Sat 28 11:30 AM U13 C 38 Loser Game 16 Winner Game 32 RBC Centre - Rink C
Sat 28 12:30 PM U13 C 49 Loser Game 35 Loser Game 32 Greenfoot Energy Center (Rink A)
Sat 28 12:30 PM U13 C 37 Loser Game 13 Winner Game 31 RBC Centre - Rink B
Sat 28 12:30 PM U13 C 39 Loser Game 15 Winner Game 33 RBC Centre - Rink D
Sat 28 1:00 PM U13 C 36 Loser Game 18 Winner Game 30 RBC Centre - Rink A
Sat 28 1:00 PM U13 C 40 Loser Game 14 Winner Game 34 RBC Centre - Rink C
Sat 28 2:00 PM U13 C 41 Loser Game 17 Winner Game 35 RBC Centre - Rink B
Sat 28 5:00 PM U13 C 26 Loser Game 21 Loser Game 23 Greenfoot Energy Center (Rink C)
Sat 28 5:30 PM U13 C 25 Winner Game 22 Loser Game 24 Greenfoot Energy Center (Rink D)
Sat 28 6:30 PM U13 C 51 Loser Game 36 Winner Game 49 Greenfoot Energy Center (Rink A)
Sat 28 7:00 PM U13 C 42 Winner Game 36 Winner Game 37 RBC Centre - Rink C
Sat 28 8:00 PM U13 C 50 Winner Game 47 Winner Game 48 Greenfoot Energy Center (Rink A)
Sat 28 8:00 PM U13 C 43 Winner Game 38 Winner Game 39 RBC Centre - Rink B
Sat 28 8:00 PM U13 C 44 Winner Game 40 Winner Game 41 RBC Centre - Rink D
Sun 29 8:00 AM U13 C 27 Winner Game 25 Winner Game 23 Greenfoot Energy Center (Rink C)
Sun 29 8:00 AM U13 C 28 Winner Game 26 Winner Game 24 RBC Centre - Rink B
Sun 29 8:00 AM U13 C 45 Winner Game 42 Winner Game 43 RBC Centre - Rink D
Sun 29 10:00 AM U13 C 52 Winner Game 50 Civic Final Winner Game 51 Greenfoot Energy Center (Rink D
Sun 29 12:30 PM U13 C 46 Winner Game 45 Accord Championship Winner Game 44 RBC Centre - Rink C
Sun 29 2:30 PM U13 C 29 Winner Game 27 Odyssey Championship Winner Game 28 Greenfoot Energy Center (Rink B)
`.trim().split('\n');

const u18_lines = `
Thu 26 9:00 PM U18 AA 1 Bedford Blues Truro Bearcats RBC Centre - Rink D
Thu 26 9:00 PM U18 AA 2 Cole Harbour Wings Moncton Hawks Shearwater Arena
Thu 26 9:00 PM U18 AA 3 Antigonish Bulldogs Sackville Flyers Zatzman Sportsplex
Thu 26 9:00 PM U18 AA 4 Queens County Cougars Dartmouth Whalers Spryfield Lions Rink
Fri 27 11:30 AM U18 AA 5 Loser Game 1 Loser Game 2 RBC Centre - Rink C
Fri 27 12:30 PM U18 AA 6 Loser Game 3 Loser Game 4 RBC Centre - Rink B
Fri 27 12:30 PM U18 AA 7 Winner Game 1 Winner Game 2 RBC Centre - Rink D
Fri 27 1:00 PM U18 AA 8 Winner Game 3 Winner Game 4 RBC Centre - Rink A
Fri 27 8:30 PM U18 AA 9 Winner Game 5 Loser Game 8 RBC Centre - Rink A
Fri 27 8:30 PM U18 AA 10 Winner Game 6 Loser Game 7 RBC Centre - Rink C
Sat 28 1:00 PM U18 AA 11 Winner Game 9 Winner Game 10 Cole Harbour Place (Scotia 2)
Sat 28 2:00 PM U18 AA 12 Winner Game 7 Winner Game 8 Cole Harbour Place (Scotia 1)
Sat 28 8:00 PM U18 AA 13 Winner Game 11 Winner Game 12 Greenfoot Energy Center (Rink C)
Sun 29 9:30 AM U18 AA 14 Loser Game 12 Loser Game 13 RBC Centre - Rink D
Sun 29 3:00 PM U18 AA 15 Winner Game 14 Odyssey Championship Winner Game 13 Greenfoot Energy Center (Rink C)
Sat 28 2:30 PM U18 AA 16 Loser Game 5 Loser Game 10 RBC Centre - Rink A
Sat 28 3:30 PM U18 AA 17 Loser Game 6 Loser Game 9 Cole Harbour Place (Scotia 1)
Sun 29 12:30 PM U18 AA 18 Winner Game 16 Accord Championship Winner Game 17 Cole Harbour Place (Scotia 2)
`.trim().split('\n');

function parseLine(line) {
    const m = line.match(/^(Thu 26|Fri 27|Sat 28|Sun 29) (\d{1,2}:\d{2} (?:AM|PM)) (U\d+ [A-Z]+) (\d+) (.*)$/);
    if (!m) {
        console.log("Failed to parse:", line);
        return null;
    }
    const [_, dateRaw, time, levCat, id, rest] = m;
    const dateStr = dateRaw + ' ' + time;
    return { id, date: dateStr, rest };
}

function processBracket(lines, startId, teamName) {
    const games = {};
    const winProgression = {};
    const loseProgression = {};

    lines.forEach(line => {
        const parsed = parseLine(line);
        if (parsed) {
            games[parsed.id] = parsed;
        }
    });

    Object.values(games).forEach(g => {
        const mWin1 = g.rest.match(/Winner Game (\d+)/g);
        if (mWin1) {
            mWin1.forEach(mw => {
                const prevId = mw.replace('Winner Game ', '');
                winProgression[prevId] = g.id;
            });
        }
        const mLose1 = g.rest.match(/Loser Game (\d+)/g);
        if (mLose1) {
            mLose1.forEach(ml => {
                const prevId = ml.replace('Loser Game ', '');
                loseProgression[prevId] = g.id;
            });
        }
    });

    const reachable = new Set();
    const toProcess = [startId];
    
    while (toProcess.length > 0) {
        const cur = toProcess.pop();
        if (!reachable.has(cur)) {
            reachable.add(cur);
            if (winProgression[cur]) toProcess.push(winProgression[cur]);
            if (loseProgression[cur]) toProcess.push(loseProgression[cur]);
        }
    }

    const schedule = {};
    Array.from(reachable).sort((a,b)=>Number(a)-Number(b)).forEach(id => {
        const g = games[id];
        const w = winProgression[id];
        const l = loseProgression[id];

        let opponent = "TBD";
        if (id === startId) opponent = "Initial Opponent (see schedule)";
        else {
            const wMatch = g.rest.match(/Winner Game \d+|Loser Game \d+/g);
            if (wMatch) opponent = wMatch.join(" vs ");
        }

        schedule[id] = {
            id: Number(id),
            time: g.date,
            opponent: opponent,
            arena: g.rest.split('Winner Game')[0].split('Loser Game')[0].trim(),
            onWin: w ? Number(w) : null,
            onLoss: l ? Number(l) : null,
            tier: g.rest.includes('Championship') ? 'Odyssey (CHAMPIONSHIP)' : 
                  g.rest.includes('Accord Championship') ? 'Accord (CHAMPIONSHIP)' :
                  g.rest.includes('Civic Final') ? 'Civic (CHAMPIONSHIP)' : 'TBD'
        };
    });

    return schedule;
}

const u11_schedule = processBracket(u11_lines, "8", "Truro Bearcats");
const u13_schedule = processBracket(u13_lines, "11", "Truro Bearcats");
const u15_schedule = processBracket(u15_lines, "7", "Truro Bearcats");

const result = {
  "teams": [
    { "id": "u11a-truro", "name": "U11A Truro Bearcats", "level": "U11 A", "start_game": 8 },
    { "id": "u13c-truro", "name": "U13C Truro Bearcats", "level": "U13 C", "start_game": 11 },
    { "id": "u15c-truro", "name": "U15C Truro Bearcats", "level": "U15 C", "start_game": 7 }
  ],
  "games": {
    "u11a": u11_schedule,
    "u13c": u13_schedule,
    "u15c": u15_schedule
  },
  "arenas": {
    "Cole Harbour Place": "https://www.google.com/maps/search/?api=1&query=Cole+Harbour+Place+Dartmouth",
    "Centennial Arena": "https://www.google.com/maps/search/?api=1&query=Centennial+Arena+Halifax",
    "Greenfoot Energy Center": "https://www.google.com/maps/search/?api=1&query=Greenfoot+Energy+Centre+Dartmouth",
    "RBC Centre": "https://www.google.com/maps/search/?api=1&query=RBC+Centre+Dartmouth",
    "St. Margaret's Centre": "https://www.google.com/maps/search/?api=1&query=St.+Margaret's+Centre+Upper+Tantallon",
    "Spryfield Lions Rink": "https://www.google.com/maps/search/?api=1&query=Spryfield+Lions+Rink",
    "East Hants Sportsplex": "https://www.google.com/maps/search/?api=1&query=East+Hants+Sportsplex+Lantz"
  }
};

fs.writeFileSync('src/data/schedule.json', JSON.stringify(result, null, 2));
console.log("Success");
