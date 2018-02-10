var numberOfTemplatesPerMonth = 2;

function createMonthlySheet(){
  var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  var masterSheet = activeSpreadsheet.getSheetByName("Master");
  var apprenticeSheet = activeSpreadsheet.getSheetByName("Apprentice");
  var templateSheet = activeSpreadsheet.getSheetByName("Templates");  
  
  // get all data in one call each. Exclude empty rows.  
  var masters = [i[0] for each (i in masterSheet.getRange('A1:A').getFormulas())if (isNaN(i))];
  var apprentices = [i[0] for each (i in apprenticeSheet.getRange('A1:A').getFormulas())if (isNaN(i))];
  
  var date = new Date();
  var currentMonth = Utilities.formatDate(date, Session.getScriptTimeZone(), "MMM, yyyy");
  var currentMonthNumber = date.getMonth() + 1;
    
  // Create sheet if not exists.
  var currentMonthSheet = activeSpreadsheet.getSheetByName(currentMonth);
  if (currentMonthSheet == null){
    activeSpreadsheet.insertSheet(currentMonth);
    currentMonthSheet = activeSpreadsheet.getSheetByName(currentMonth);
    
    // Insert record in "Tracked Months" sheet so the scheduler knows to check those games.
    var trackedMonthsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Tracked Months");
    var trackedMonthsLastRow = getLastFilledRow(trackedMonthsSheet.getRange('A:A'));
    trackedMonthsSheet.getRange(trackedMonthsLastRow + 1, 1).setValue(currentMonth);
    
    var numOfRequiredRows = (masters.length + 2) * numberOfTemplatesPerMonth + 1;
    var numOfRequiredColumns = apprentices.length;
    if(numOfRequiredColumns < 26 && numOfRequiredRows <= 1000){
      currentMonthSheet.deleteRows(numOfRequiredRows, 1000 - numOfRequiredRows);
      currentMonthSheet.deleteColumns(numOfRequiredColumns, 26 - numOfRequiredColumns);
    }
    
    // Fetch 2 templates for this month
    var currentMonthTemplateRow = (currentMonthNumber - 1) * numberOfTemplatesPerMonth + 1;
    var templates = templateSheet.getRange(currentMonthTemplateRow, 1, numberOfTemplatesPerMonth).getFormulas();
    
    var row = 2;
    var column = 1;
    var templateRowNumbers = []
    for (var i = 0; i < templates.length; i++) {
      templateRowNumbers.push(row);
      var template = templates[i][0];
      var templateCell = currentMonthSheet.getRange(row, column);
      templateCell.setValue(template);
      templateCell.setBackgroundRGB(183, 214, 249);
      
      for (var j = 1; j <= apprentices.length; j++){
        var apprenticeCell = currentMonthSheet.getRange(row, column + j);
        apprenticeCell.setValue(apprentices[j - 1]);
        apprenticeCell.setBackgroundRGB(237, 219, 246);
      }
      
      for (var k = 1; k <= masters.length; k++){
        var masterCell = currentMonthSheet.getRange(row + k, column);
        masterCell.setValue(masters[k - 1]);
        masterCell.setBackgroundRGB(237, 219, 246);
      }
      
      // Set color for empty separator row
      currentMonthSheet.getRange(row + k, column, 1, j).setBackgroundRGB(199, 139, 231);
      row += masters.length + 2;
    }
    
    // The first cell of every month contains the row numbers of each tourney.
    currentMonthSheet.getRange(1, 1).setValue(templateRowNumbers.join(","));
    currentMonthSheet.hideRows(1);
  }
}

function getLastFilledRow(range) {  
  var values = range.getValues(); // get all data in one call
  var ct = 0; 
  while ( values[ct][0] != "" ) {
    ct++;
  }
  
  return (ct);
}
