// in v2.0.0 and earlier, the breakdown page column "Normalized Impact"
// had rows with equation
//    =iferror(E2/J2, 0)
// but should have had
//    =iferror(E2/max(J:J), 0)
// this function will re-write the formulas in that column to be correct
function bugfix_normalized_impact_() {

  console.log("starting bugfix_normalized_impact");
  const ui = SpreadsheetApp.getUi();

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  assertConfigExists_(spreadsheet);
  const sheetConfig = configLoad_(spreadsheet);
  const currentSheetVersion = sheetConfig.get(configOption_sheetVersion);
  const expectedSheetVersion = "2.0.0";
  const willUpgradeToVersion = "2.0.1";
  if (currentSheetVersion === willUpgradeToVersion) {
    throw "this sheet version is already at " + willUpgradeToVersion + " so this bugfix is unnecessary";
  }
  if (currentSheetVersion !== expectedSheetVersion) {
    throw "this bugfix only applies to sheet version " + expectedSheetVersion;
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
    bugfix_normalized_impact_for_sheet_(sheet);
  });

  sheetConfig.updateExisting(configOption_sheetVersion, "2.0.1");
  console.log("finished bugfix_normalized_impact");
  ui.alert("Bugfix: Success!", "Applied fix to sheets " + JSON.stringify(titlesOfSheetsToFix), ui.ButtonSet.OK);
}

function bugfix_normalized_impact_for_sheet_(sheet) {
  // assert that columns are where we expect them to be
  checkColumnHeader_(sheet, "E", "IMPACT: High");
  checkColumnHeader_(sheet, "I", "Normalized Impact");
  checkColumnHeader_(sheet, "J", "total number of responses");
  const correctFormula = "=iferror(E2/max(J:J), 0)";

  const firstCell = sheet.getRange("I2:I");
  firstCell.setFormula(correctFormula);

}


function checkColumnHeader_(sheet, columnLetter, expectedHeaderText) {
  const currentHeader = sheet.getRange(columnLetter + "1").getValue()
  if (currentHeader !== expectedHeaderText) {
    throw "in sheet "  + sheet.getName() + " column " + columnLetter + " header: expected " + expectedHeaderText + " but got " + currentHeader;
  }
}
