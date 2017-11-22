/**
* Gets the options needed by WL APIs.
 * @return - options.
 */
function getOptions() {
  var data = {'Email': 'ENTER-EMAIL-HERE', 'APIToken': 'ENTER-TOKEN-HERE'};
  var options = {
    'method' : 'post',
    'payload' : data
  };
  
  return options;
}

/**
 * Updates the status of tournaments in 'Tournaments - Season 2' sheet.
 * @param gameResp - The WL response for a game from the GameFeed API. 
 * @return A list of [winnerPlayerId, loserPlayerId]. If it is a team game, concatenate all playerIds on each team using _.
 */
function main(){  
  // 1v1s
  updateTournament(['C1', 'C3:E8']);
  
  // 2v2s
  updateTournament(['C10', 'C12:E23']);
}

/**
 * Parses the WL Game API response and returns the winner(s) and loser(s).
 * @param gameResp - The WL response for a game from the GameFeed API. 
 * @return - A list of [winnerPlayerId, loserPlayerId]. If it is a team game, concatenate all playerIds on each team using _.
 */
function getResult(gameResp){
  var players = gameResp['players'];
  var winners = [];
  var losers = [];
  for (var i = 0; i < players.length; i++){
    var player = players[i];
    if (player['state'] == 'Won'){
      winners.push(player["id"]);
    }
    else if (player['state'] != 'Won'){
      losers.push(player["id"]);
    }
  }  
  
  if(winners.length > 0 && losers.length > 0){
    return [winners.join("_"), losers.join("_")];
  }
  else{
    // Game is still undecided.
    return null;
  }
}

/**
 * Queries the GameFeed WL API to get status of a game.
 * @param gameId - The WL game id.
 * @return - The WL API response.
 */
function queryGame(gameId){
  var options = getOptions();
  var url = "https://www.warlight.net/API/GameFeed?GameID=" + gameId;
  
  var response = UrlFetchApp.fetch(url, options);
  var data = JSON.parse(response.getContentText());
  
  return data;
}

/**
 * Extract a number from a cell which contains a hyperlink.
 * @param value - the cell content(includes the formula, aka hyperlink).
 * @return - A number. Ex - =HYPERLINK("https://www.warlight.net/Profile?p=611489923","timon92") returns 611489923.
 */
function getHyperLinkValue(value){
  var regex = new RegExp(".*?(\\d+)",["i"]);
  var m = regex.exec(value);
  return m ? m[1] : m;
}

/**
 * Fetch results for all games in the tournament and update the sheet with the results.
 * @param tournamentInfo - contains the cell containing the tournament link and the range to update.
 *                         Ex - ['C1', 'C3:E8'], tourney link in C1, C3:E8 contains the cells to be updated.
 */
function updateTournament(tournamentInfo){
  var tournamentCell = tournamentInfo[0];
  var tournamentSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Tournaments - Season 2");
  var tournamentHyperlink = tournamentSheet.getRange(tournamentCell).getFormula();
  
  var tournamentId = getHyperLinkValue(tournamentHyperlink);
  if (tournamentId)
  {  
    var options = getOptions();
    var url = "https://www.warlight.net/API/GameIDFeed?TournamentID=" + tournamentId;
    var response = UrlFetchApp.fetch(url, options);
    
    var data = JSON.parse(response.getContentText());  
    var gameIds = data['gameIDs']; 
    
    var results = [];
    for (var i = 0; i < gameIds.length; i++) {  
      var gameResp = queryGame(gameIds[i]);
      var result = getResult(gameResp);
      if(result){
        results.push(result);  
      }    
    }   

    var range = tournamentSheet.getRange(tournamentInfo[1]);    
    updateTeamResults(results, range);   
  }    
}

/**
 * Given a set of results, updates the win/loss count of each team.
 * @param results - A list containing pairs of [winner,loser]. Ex - [[611489923, 425089923], [611489923_520489923_670489923, 425089923_273089923_359089923]]
 * @param range - The range of cells to update.
 */
function updateTeamResults(results, range){
  var playerWins = {};
  var playerLosses = {};
  for (var i = 0; i < results.length; i++){
    var winnerIds = results[i][0].split("_");
    var loserIds = results[i][1].split("_");
    for(var k in winnerIds){
      var winnerId = winnerIds[k];
      playerWins[winnerId] = playerWins[winnerId] ? playerWins[winnerId] + 1 : 1;
    }
    for(var k in loserIds){
      var loserId = loserIds[k];
      playerLosses[loserId] = playerLosses[loserId] ? playerLosses[loserId] + 1 : 1;
    }
  }  
  
  var numRows = range.getNumRows();
  for (var i = 1; i <= numRows; i++) {
    var playerId = getHyperLinkValue(range.getCell(i,1).getFormula());
     
    if(playerWins[playerId]){
      // Set Win column
      range.getCell(i,2).setValue(playerWins[playerId]);
    }
    
    if(playerLosses[playerId]){
      // Set Loss column
      range.getCell(i,3).setValue(playerLosses[playerId]);
    }
  } 
}
