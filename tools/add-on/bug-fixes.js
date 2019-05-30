// Upgrades a sheet to v2.0.2 to address issues around impact normalization
//
// In v2.0.0 and earlier, the breakdown page column "Normalized Impact"
// had rows with equation
//    =iferror(E2/J2, 0)
// which didn't normalize for how many people had skipped that item but checked others in the same section.
// In v2.0.1 we changed it to
//    =iferror(E2/max(J:J), 0)
// This fixed the first problem but introduced the further problem:
// if a feedback giver just checks 1 box high-impact and clicked submit,
// (we call that a "sparse" response) then the normalized impact of all other items in the area went down.
//
// In v2.0.2 we add an enhancement to enable the manager to mark
// a feedback response as "Sparse" and thus have its blanks not count against normalized impact for
// skill items it didn't touch.
//
// This function will add columns and re-write formulas on the breakdown pages
function bugfix_normalized_impact_with_sparse_() {

  console.log("starting bugfix_normalized_impact_with_sparse_");
  const ui = SpreadsheetApp.getUi();

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  assertConfigExists_(spreadsheet);
  const sheetConfig = configLoad_(spreadsheet);
  const currentSheetVersion = sheetConfig.get(configOption_sheetVersion);

  const willUpgradeToVersion = "2.0.2";
  if (currentSheetVersion === willUpgradeToVersion) {
    throw "this sheet version is already at " + willUpgradeToVersion + " so this bugfix is unnecessary";
  }

  const allowedStartVersions = [ "2.0.0", "2.0.1" ];
  const okStart = allowedStartVersions.some(function(start) { return (currentSheetVersion === start) });
  if (!okStart) {
    throw "this bugfix only works when starting sheet version is one of " + allowedStartVersions;
  }

  const fromGitRef = sheetConfig.get(configOption_SkillsRepoRelease);
  if (hasWhiteSpace(fromGitRef)) {
    throw "starting git ref is invalid: " + fromGitRef;
  }

  const migrationPlan = fetchMigrationPlan(fromGitRef, fromGitRef);
  console.log("fetched areas info for " + fromGitRef);


  const titlesOfSheetsToFix = migrationPlan.migrateFrom.areas.map(sheet_areaTitle_);
  console.log("starting bugfixes for " + titlesOfSheetsToFix);

  titlesOfSheetsToFix.forEach(function(sheetTitle) {
    const sheet = spreadsheet.getSheetByName(sheetTitle);
    bugfix_normalized_impact_with_sparse_for_sheet_(sheet);
  });

  sheetConfig.updateExisting(configOption_sheetVersion, willUpgradeToVersion);
  console.log("finished bugfix_normalized_impact_with_sparse_");
  ui.alert("Bugfix: Success!", "Applied fix to sheets " + JSON.stringify(titlesOfSheetsToFix), ui.ButtonSet.OK);
}

function bugfix_normalized_impact_with_sparse_for_sheet_(sheet) {
  // assert that columns are where we expect them to be
  const actualStartColumnHeaders = getColumnHeaders_(sheet);
  const expectedStartColumnHeaders = [
    sheet.getName(),                   // A
    "Skill Level",                     // B
    "Column index",                    // C
    "IMPACT: Low",                     // D
    "IMPACT: High",                    // E
    "FREQUENCY: Only when asked",      // F
    "FREQUENCY: Occasionally",         // G
    "FREQUENCY: Appropriately often",  // H
    "Normalized Impact",               // I
    "total number of responses",       // J
    "Weighted Conflict ratio",         // K
    "Most Observed Frequency",         // L
    "Net Frequency"                    // M
  ];
  if (!stringArraysAreEqual(actualStartColumnHeaders, expectedStartColumnHeaders)) {
    throw "breakdown page column headers mismatch.\nexpected " + expectedStartColumnHeaders + " but got " + actualStartColumnHeaders;
  }

  sheet.insertColumnsAfter(actualStartColumnHeaders.length, 2)
  sheet.getRange("N1:O1").setValues([
   [ "Num sparse responses", "Num dense responses"]
  ]);


  const sparseCountFormula = '=counta(index(filter(indirect("'"&Config!$B$2&"'!$A2:1000"), indirect("'"&Config!$B$2&"'!$D2:D1000") = "Sparse"), 0, $C2))'
  const denseCountFormula = '=counta(index(filter(indirect("'"&Config!$B$2&"'!$A2:1000"), indirect("'"&Config!$B$2&"'!$D2:D1000") <> "Sparse"), 0, $C2))'
  const totalCountFormula = '=COUNTA(iferror(offset(indirect("'"&Config!$B$2&"'!$A$1"),1,$C2-1,10000,1)))'

  sheet.getRange("N1:N").setFormula(sparseCountFormula);
  sheet.getRange("O1:O").setFormula(denseCountFormula);
  sheet.getRange("J1:J").setFormula(totalCountFormula);
}

function stringArraysAreEqual(array1, array2) {
  if (array1.length !== array2.length) {
    return false
  }
  return array1.every(function(x, i) {
    return array1[i] === array2[i];
  });
}


function checkColumnHeader_(sheet, columnLetter, expectedHeaderText) {
  const currentHeader = sheet.getRange(columnLetter + "1").getValue()
  if (currentHeader !== expectedHeaderText) {
    throw "in sheet "  + sheet.getName() + " column " + columnLetter + " header: expected " + expectedHeaderText + " but got " + currentHeader;
  }
}
