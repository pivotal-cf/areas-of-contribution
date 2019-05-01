function getConfiguredRawRespSheet_(spreadsheet, sheetConfig) {
  return spreadsheet.getSheetByName(sheetConfig.get(configOption_rawResponsesSheetName));
}

function findLinkedSheet_(spreadsheet, form) {
  const sheets = spreadsheet.getSheets();
  
  var linkedSheets = [];
  sheets.forEach(function(s) { 
    const u = s.getFormUrl();
    if (!u) {
      return;
    }
    if (u.indexOf(form.getId()) < 1) {
      return;
    }
    linkedSheets.push(s);
  });
  
  if (linkedSheets.length > 1) {
    throw "too many sheet tabs are linked to the form";
  }
  if (linkedSheets.length < 1) {
    throw "expecting to find one sheet linked to form " + form.getId() + " but found none";
  }
  return linkedSheets[0];  
}

function getUnpropogatedHeaders(sheet, areas) {
  const colHeaderIndex = makeColumnHeaderIndex_(getColumnHeaders_(sheet));
  var unprop = [];
  areas.forEach(function(area) {
    const basic = form_additionalContextTitle_basic_(area);
    const advanced = form_additionalContextTitle_advanced_(area);
    const ok = !!(colHeaderIndex[basic] && colHeaderIndex[advanced]);
    if (!ok) {
      unprop.push(form_areaTitle_(area));
    }
  });
  return unprop;  
}

// don't unlink until title changes propogate to the google sheet
// if the form is unlinked too soon after the titles are changed, the title changes
// won't make it to the sheet, which results in the sheet being inconsistent with the form
function waitUntilTitlesHavePropogatedToOriginalSheet_(origLinkedRespSheet, migrationPlan) {
  const getUnpropHeaders = function() { return getUnpropogatedHeaders(origLinkedRespSheet, migrationPlan.migrateFrom.areas); }
  var tries = 0;
  while(getUnpropHeaders().length > 0) {
    console.log("column headers didn't propogate within " + tries + " tries.  waiting...");
    Utilities.sleep(1000);
    if (tries++ > 30) {
      const unprop = getUnpropHeaders();
      console.log("column headers didn't propogate within timeout.  missing: " + unprop);
      throw "some updated column headers didn't propogate to raw response sheet.  outstanding: " + unprop;
    }
  } 
}



// ensures formulas on row 1 are copied all the way down to the last row
// then trims the rows
function refillBreakdownPage_(sheet) {
  const firstRow = sheet.getRange("D2:2");
  const lastSkillRow = sheet.getRange("A1:A").getLastRow();
  firstRow.autoFill(sheet.getRange("D2:" + lastSkillRow), SpreadsheetApp.AutoFillSeries.DEFAULT_SERIES);
  if (lastSkillRow < sheet.getMaxRows()) {
    sheet.deleteRows(lastSkillRow+1,sheet.getMaxRows()-lastSkillRow);
  } 
}

// ensures all breakdown pages have the correct size and all formulas filled
function refillAllBreakdownPages_(spreadsheet, areas) {
  areas.forEach(function(area) {
    const sheetName = sheet_areaTitle_(area);
    const sheet = spreadsheet.getSheetByName(sheetName);
    refillBreakdownPage_(sheet);
  });
}





function getColumnHeaders_(sheet) {
  return trimFinalBlanks_(sheet.getRange("A1:1").getValues()[0]);
}

function trimFinalBlanks_(input) {
 var ar = input.slice(); // shallow copy
 while (ar.length) {
   if (ar[ar.length-1] !== "") { 
     break;
   }
   ar.pop();
 }
 return ar;
}

function makeColumnHeaderIndex_(headerStrings) {
  return arrayToDict_(headerStrings, function(s, i) { return [s, i+1] });
}

function arrayToDict_(arrayElements, getKeyAndValue) {
  var dict = {}
  arrayElements.map(getKeyAndValue).forEach(function(kv) {
    dict[kv[0]] = kv[1];
  })
  return dict;
}
