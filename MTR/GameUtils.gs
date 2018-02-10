function findWinner(gameResp) {
  var players = gameResp['players'];
  
  var winners = [];
  for (var i = 0; i < players.length; i++){
    var player = players[i];
    if (player['state'] == 'Won'){
      winners.push(player["id"]);
    }
  }

  if (winners.length == 0) {
    //The only way there can be no winner is if the players VTE.  Return the first player.
    return players[0]["id"];
  }
  
  return winners[0];
}

function findOffendersOfDeletedGame(gameResp) {
  var notJoined = [];
  var players = gameResp['players'];
  for (var i = 0; i < players.length; i++){
    var player = players[i];
    if (player['state'] != 'Playing'){
      notJoined.push(player["id"]);
    }
  }

  return notJoined;  
}


/**
 * Parses the WL Game API response and returns the winner and offender(s).
 * @param gameResp - The WL response for a game from the GameFeed API. 
 * @return - An object of {"winner" : winner, "offenders" : offenders, "isGameDeleted" : isGameDeleted}. offenders is a list of all players who have not joined/gone on vacation.
 */
function getResult(gameResp) {
  var winner = null;
  var offenders = [];
  var isGameDeleted = false;
  
  var state = gameResp['state'];
  if (state == 'Finished'){
    //It's finished. Record the winner and save it back.
    winner = findWinner(gameResp)
  }
  else if (state == 'WaitingForPlayers') {
    var today = new Date();
    var lastTurnTime = new Date(gameResp["lastTurnTime"]);
    var elapsed = Math.floor((Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) 
                              - Date.UTC(lastTurnTime.getFullYear(), lastTurnTime.getMonth(), lastTurnTime.getDate()) ) /(1000 * 60 * 60 * 24));
    
    if(elapsed >= 0){
      // Game has been stuck for 3 days. Someone is on vacation or hasn't joined yet.
      try {
        offenders = findOffendersOfDeletedGame(gameResp);
        
        // Delete it over at warlight.net so that players know we no longer consider it a real game
        deleteGame(gameResp["id"]);
        isGameDeleted = true;
      }
      catch(Exception) {
        // If the API doesn't return success, just ignore this game on this run. The game might have already started and one of the players are just on vacation.
      }
    }
  }
  
  return {"winner" : winner, "offenders" : offenders, "isGameDeleted" : isGameDeleted};
}


function createGames(gamesRange, masters, apprentices, templateCell) {
  var playerGameCountMap = {}
  for (var j = 0; j < apprentices.length; j++){
    playerGameCountMap["A_" + getHyperLinkValue(apprentices[j])] = 0;
  }
  
  var gamesMatrix = [i for each (i in gamesRange.getValues())];
  
  // Compute game count for every player.
  for( var i = 0; i < gamesMatrix.length; i++){
    var gamesRow = gamesMatrix[i];          
    for( var j = 0; j < gamesRow.length; j++){
      if(gamesRow[j].indexOf("Won") > -1 || gamesRow[j].indexOf("Lost") > -1){  
        var apprentice = getHyperLinkValue(apprentices[j]);
        playerGameCountMap["A_" + apprentice] += 1;
      }
    }    
  } 
  
  // Create games if master has no games.
  for( var i = 0; i < gamesMatrix.length; i++){
    var gamesRow = gamesMatrix[i];
    if(gamesRow.indexOf("In Progress") == -1){
      var isGameAllotted = false;
      
      // No game in progress. Find an opponent.      
      for( var k = 1; k <= 2; k++){
        // First try to allocate games such that each apprentice has a max of 1 game. If that doesn't give every master a game, then allow a max of 2 games per apprentice.
        for( var j = 0; j < gamesRow.length; j++){
          if(!gamesRow[j]){
            if(playerGameCountMap["A_" + getHyperLinkValue(apprentices[j])] < k){
              // Suitable apprentice found. Create game.              
              var gameId = createGame(masters[i], apprentices[j], templateCell);
              var newGameLink = '=HYPERLINK("https://www.warzone.com/MultiPlayer?GameID=' + gameId + '","In Progress")';
              var gameCell = gamesRange.getCell(i+1,j+1);
              gameCell.setFormula(newGameLink);
              gameCell.setBackground("#E8E66D");
              isGameAllotted = true;
              playerGameCountMap["A_" + getHyperLinkValue(apprentices[j])] += 1;
              
              // Break loop as we want to allocate only one game to the master.
              break;
            }
          }
        }
        
        if(isGameAllotted){
          // Game was already allotted for the master, break out of outer loop.
          break;
        }
      }
    }
  }
}

function trackGames(gamesRange, masters, apprentices) {
  var allGamesFinished = true;
  var numRows = gamesRange.getNumRows();
  var numCols = gamesRange.getNumColumns();
  
  var inactivePlayerRows = [];
  var inactivePlayerColumns = [];
  
  for (var i = 1; i <= numRows; i++) {
    for (var j = 1; j <= numCols; j++) {
      var gameCell = gamesRange.getCell(i,j);
      var gameLink = gameCell.getFormula();
      var gameState = gameCell.getValue();
      if (isNaN(gameLink)){
        // Only check games which are in progress.
        if (gameState == "In Progress"){
          var gameId = getHyperLinkValue(gameLink);
          var gameResp = queryGame(gameId);      
          var result = getResult(gameResp);
          
          if(result["winner"]){
            var newGameLink = "";
            var bgColor = "white";
            if(result[0] == getHyperLinkValue(masters[i-1])){
              // Master Won
              newGameLink = '=HYPERLINK("https://www.warzone.com/MultiPlayer?GameID=' + gameId + '","Won")';
              bgColor = "#4DB555";              
            }
            else{
              // Apprentice Won
              newGameLink = '=HYPERLINK("https://www.warzone.com/MultiPlayer?GameID=' + gameId + '","Lost")';
              bgColor = "#E58767";
            }
            
            gameCell.setFormula(newGameLink);
            gameCell.setBackground(bgColor);
          }
          else if(result["offenders"] && result["offenders"].length > 0){
            var offenders = result["offenders"];
            if(offenders.indexOf(getHyperLinkValue(masters[i-1])) > -1){
              // Mark all empty cells in row as NA so no further games are created
              inactivePlayerRows.push(i);
              
            }
            if(offenders.indexOf(getHyperLinkValue(apprentices[j-1])) > -1){
              // Mark all empty cells in column as NA so no further games are created
              inactivePlayerColumns.push(j);
            }
            
            if(result["isGameDeleted"]){
              // Mark this game cell as NA. If game wasn't deleted, someone is on vacation and this game's status needs to be updated later.
              gameCell.setValue("NA");
              gameCell.setBackground("black");
            }
          }
          else{
            allGamesFinished = false;
          }
        }        
      }
      else{
        allGamesFinished = false;
      }
    }
  }
  
  // Run one pass to mark all inactive rows and columns as NA.
  for (var i = 1; i <= numRows; i++) {
    var isRowInactive = inactivePlayerRows.indexOf(i) > -1;
    for (var j = 1; j <= numCols; j++) {
      if(isRowInactive || inactivePlayerColumns.indexOf(j) > -1){
        var gameCell = gamesRange.getCell(i,j);
        var gameCellValue = gameCell.getValue();
        if(!gameCellValue){
          gameCell.setValue("NA");
          gameCell.setBackground("black");
        }
      }      
    }
  }
  
  return allGamesFinished;
}
