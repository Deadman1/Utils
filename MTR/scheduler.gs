var maxMasters = 50;
var maxApprentices = 50;
var email = 'ENTER EMAIL HERE';
var APIToken = 'ENTER API TOKEN HERE';


function runForMonth(monthSheetName){  
  var monthlySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(monthSheetName);
  var rows = monthlySheet.getRange(1, 1).getValue().split(",");
  var areAllGamesFinished = true;
      
  // For each tourney
  for (var i = 0; i < rows.length; i++){
    var row = parseInt(rows[i]);
    if (!isNaN(row)){
      var masters = [];
      var masterLinks = monthlySheet.getRange(row + 1, 1, maxMasters).getFormulas();
      for (var j = 0; j < masterLinks.length; j++){
        var master = masterLinks[j];
        if (isNaN(master)){
          masters.push(master[0]);
        }
        else{        
          break;
        }
      }
      
      var apprentices = [];
      var apprenticeLinks = monthlySheet.getRange(row, 2, 1, maxApprentices).getFormulas();
      for (var j = 0; j < apprenticeLinks[0].length; j++){
        var apprentice = apprenticeLinks[0][j];
        if (isNaN(apprentice)){
          apprentices.push(apprentice);
        }
        else{        
          break;
        }
      }
      
      var gamesRange = monthlySheet.getRange(row + 1, 2, masters.length, apprentices.length);
      var areTourneyGamesFinished = trackGames(gamesRange, masters, apprentices);
      areAllGamesFinished = areAllGamesFinished && areTourneyGamesFinished;    
      
      var templateCell = monthlySheet.getRange(row, 1);
      createGames(gamesRange, masters, apprentices, templateCell);   
    }
  }
  
  if(areAllGamesFinished){
    // All games are complete and this month does not need to be tracked anymore.    
    var trackedMonthsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Tracked Months");    
    var trackedMonths = [i[0] for each (i in trackedMonthsSheet.getRange('A1:A').getValues())if (isNaN(i))];
    for(var i = 0; i<trackedMonths.length;i++){
        var currentMonth = Utilities.formatDate(trackedMonths[i], Session.getScriptTimeZone(), "MMM, yyyy");
        if(currentMonth == monthSheetName){ 
          // Delete record in "Tracked Months" sheet so the scheduler knows to avoid those games.
          trackedMonthsSheet.deleteRow(i+1);
        }
    }
  }
}

/**
 * Extract a number from a cell which contains a hyperlink.
 * @param value - the cell content(includes the formula, aka hyperlink).
 * @return - A number. Ex - =HYPERLINK("https://www.warlight.net/Profile?p=611489923","timon92") returns 611489923.
 */
function getHyperLinkValue(value){
  var regex = new RegExp(".*?(\\d+)",["i"]);
  var m = regex.exec(value);
  return m ? m[1].toString() : m;
}

function runAll(){
  var trackedMonthsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Tracked Months");
  var trackedMonths = [i[0] for each (i in trackedMonthsSheet.getRange('A1:A').getValues())if (isNaN(i))];
  for (var i = 0; i < trackedMonths.length; i++){
    var currentMonth = Utilities.formatDate(trackedMonths[i], Session.getScriptTimeZone(), "MMM, yyyy");
    runForMonth(currentMonth);
  }
}
