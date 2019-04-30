function fetchAreasAndSkillsFromCSV_(gitRef) {
  const response = UrlFetchApp.fetch("https://us-central1-cf-rd-managers-feedback-eval.cloudfunctions.net/skillsAsCSV?gitRef=" + gitRef);
  return Utilities.parseCsv(response.getContentText());
}

function setAndTrimSkills_(skills, skillsSheet) {
  skillsSheet.getRange("A2:C").clear();
  if (skillsSheet.getMaxRows() < skills.length+1) {
   skillsSheet.insertRowsAfter(skillsSheet.getMaxRows(), skills.length+1-skillsSheet.getMaxRows());
  }
  skillsSheet.getRange(2, 1, skills.length,3).setValues(skills);
  if (skillsSheet.getMaxRows() > skills.length+1) {
    skillsSheet.deleteRows(skills.length+2,skillsSheet.getMaxRows()-skills.length-1);
  }
}

function setSkillsCore_(spreadsheet, gitRef) {
  const skillsSheet = spreadsheet.getSheetByName("Skills");
  
  configLoad_(spreadsheet).updateExisting(configOption_SkillsRepoRelease, gitRef);

  const skills = fetchAreasAndSkillsFromCSV_(gitRef);
  setAndTrimSkills_(skills, skillsSheet);
  
  // TODO: use regenerateSkillsTab_(skillsSheet, migrateTo) instead?
  // TODO: refill formulas and trim ranges on breakdown pages
}




function skillsSheetData_(migrateState) {
  const areasDict = arrayToDict_(migrateState.areas, function(a) { return [a.id, a] });
  return migrateState.skills.map(function(skill) {
    const area = sheet_areaTitle_(areasDict[skill.area]);
    const desc = sheet_formatSkill_(skill.description);
    const level = sheet_formatLevel_(skill.level);
    return [area, desc, level];
  });
}


// update Skills sheet to the given set of skills, and keep the number of rows exact 
function regenerateSkillsSheet_(skillsSheet, migrateTo) {
  const newSkillsTable = skillsSheetData_(migrateTo);
  const rowsToAdd = newSkillsTable.length + 1 - skillsSheet.getMaxRows();
  if (rowsToAdd > 0) {
    skillsSheet.insertRowsAfter(skillsSheet.getMaxRows(), rowsToAdd);
  } else if (rowsToAdd < 0) {
   skillsSheet.deleteRows(newSkillsTable.length + 1, -rowsToAdd);
  }
  
  skillsSheet.getRange("A2:C").setValues(newSkillsTable);
}

// validate the current skills are where we expect to be migrating from
function validateCurrentSkillsSheet_(skillsSheet, expectedMigrateState) {
  const currentData = skillsSheet.getRange("A2:C").getValues();
  const expectedData = skillsSheetData_(expectedMigrateState);
  if (currentData.length != expectedData.length) {
    throw "skills list length mismatch.  current list has " +  currentData.length 
          + " elements but we're expecting to migrate from " + expectedMigrateState.gitRef + " with " + expectedData.length;
  }
  currentData.forEach(function(currentRow, i) {
    const expectedRow = expectedData[i];
    const ok = currentRow.every(function(currentCell, j) { return (currentCell === expectedRow[j]) });
    if (!ok) {
      throw "current skill item " + i + " does not match what we'd expect when migrating from " + expectedMigrateState.gitRef
              + " expecting " + JSON.stringify(expectedRow) + " but got " + JSON.stringify(currentRow);
    }
  });
}