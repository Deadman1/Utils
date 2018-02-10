/**
 * Creates a game on WL.
 * @param player1 - player1.
 * @param player2 - player2.
 * @param templateId - Template cell.
 * @return - WL game id.
 */
function createGame(player1, player2, templateCell){
  var players = [{ "token": getHyperLinkValue(player1), "team": "1" }, { "token": getHyperLinkValue(player2), "team": "2" }]; 
 
  var payload = {}
  var player1_name = player1.split("\",\"")[1].replace("\")", "");
  var player2_name = player2.split("\",\"")[1].replace("\")", "");
  var gameName = "MTR " + templateCell.getValue() + " : " + player1_name + " vs " + player2_name;
  gameName = gameName.substring(0, 45);
  
  payload['hostEmail'] = email;
  payload['hostAPIToken'] = APIToken;  
  payload['templateID'] = getHyperLinkValue(templateCell.getFormula());
  payload['gameName'] = gameName;
  payload['personalMessage'] = "This game has been created by the MTR bot. If you fail to join it within 3 days, vote to end or decline, the game will be ignored.";
  payload['players'] = players;   
  
  var options = {
    'method' : 'post',
    'payload' : JSON.stringify(payload),
    'contentType': 'application/json'
  };
  
  var url = "https://www.warlight.net/API/CreateGame";  
  var response = UrlFetchApp.fetch(url, options);
  var data = JSON.parse(response.getContentText());
  return data['gameID'];
}

/**
 * Queries the GameFeed WL API to get status of a game.
 * @param gameId - The WL game id.
 * @return - The WL API response.
 */
function queryGame(gameId){  
  var data = {'Email': email, 'APIToken': APIToken};
  var options = {
    'method' : 'post',
    'payload' : data,
    'contentType': 'application/json'
  };
  var url = "https://www.warlight.net/API/GameFeed?GameID=" + gameId;
  
  var response = UrlFetchApp.fetch(url, options);
  var data = JSON.parse(response.getContentText());
  
  return data;
}

function deleteGame(gameId) {
  var data = {'Email': email, 'APIToken': APIToken, 'gameID' : parseInt(gameId)};
  var options = {
    'method' : 'post',
    'payload' : JSON.stringify(data),
    'contentType': 'application/json'
  };
  var url = "https://www.warlight.net/API/DeleteLobbyGame";
  
  var response = UrlFetchApp.fetch(url, options);
  var data = JSON.parse(response.getContentText());
  
  return data;
}    
