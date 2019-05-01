function migrateCore_(spreadsheet, toGitRef) {
  console.log("starting migration for " + spreadsheet.getId());
  assertConfigOk_(spreadsheet);    // ensure the current is internally consistent
  const sheetConfig = configLoad_(spreadsheet);  
  const origLinkedRespSheet = getConfiguredRawRespSheet_(spreadsheet, sheetConfig);

  const formUrl = origLinkedRespSheet.getFormUrl();
  if (!formUrl) {
    throw "Error: link the Feedback Form to this spreadsheet before attempting to migrate."
  }
  const form = FormApp.openByUrl(formUrl);
  
  const fromGitRef = sheetConfig.get(configOption_SkillsRepoRelease);
  if (hasWhiteSpace(fromGitRef)) {
    throw "starting git ref is invalid: " + fromGitRef; 
  }
  if (hasWhiteSpace(toGitRef)) {
    throw "dest git ref is invalid: " + toGitRef; 
  }
  
  // { migrateFrom: { gitRef, areas, skills }, migrateTo: { gitRef, areas, skills } }
  const migrationPlan = fetchMigrationPlan(fromGitRef, toGitRef);
  console.log("fetched migration from " + fromGitRef + " to " + toGitRef);

  const skillsSheet = spreadsheet.getSheetByName("Skills");
  validateCurrentSkillsSheet_(skillsSheet, migrationPlan.migrateFrom);
  
  validateFormRewrites_(form, migrationPlan);
  
  // non-destructive updates before unlinking form
  const titleUpdates = updateContextItemTitles_(form);  // these changes need to propogate to the sheet before we unlink
  if (titleUpdates != 2 * migrationPlan.migrateFrom.areas.length) { // one title for basic, one for advanced
   throw "title updates only applied to " + titleUpdates + " but we were expecting " + (2 * migrationPlan.migrateFrom.areas.length);
  }
  updateLandingPageText_(form);

  // don't unlink form from sheet until title changes propogate to sheet
  waitUntilTitlesHavePropogatedToOriginalSheet_(origLinkedRespSheet, migrationPlan);
   
  console.log("migration pre-checks passed, starting changes...");
  const wasAcceptingResponses = form.isAcceptingResponses();
  form.setAcceptingResponses(false);
  
  // we've validated as much as we can....
   
  sheetConfig.updateExisting(configOption_LastMigration, "In-flight as of " + new Date());
  sheetConfig.updateExisting(configOption_SkillsRepoRelease,
                             "In-flight from " + migrationPlan.migrateFrom.gitRef 
                              + " to " + migrationPlan.migrateTo.gitRef);
   
  // unlink form, this way we can make further edits to the form without modifying the old response sheet
  form.removeDestination();
  origLinkedRespSheet.setName("Old Responses as of " + (new Date()).toISOString()); 

  // begin destructive changes
  
  // we're treating the raw responses sheet as the source of truth and will explicitly migrate
  // old to new, column by column. so we delete all responses from the form
  form.deleteAllResponses();

  rewriteFormQuestions_(form, migrationPlan);
  
  // relink form.  this creates a new responses sheet with headers for the new questions
  form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId());
  
  // find new linked sheet
  const newLinkedRespSheet = findLinkedSheet_(spreadsheet, form);
  newLinkedRespSheet.setName("Raw");
  
  // migrate data, header-by-header from old raw-response sheet to new one
  const migrationResult = migrateRawResponsesSheets_(migrationPlan, origLinkedRespSheet, newLinkedRespSheet);

  regenerateSkillsSheet_(skillsSheet, migrationPlan.migrateTo);
  sheetConfig.updateExisting(configOption_SkillsRepoRelease, migrationPlan.migrateTo.gitRef);
  
  // update raw responses sheet name in config
  // this causes the breakdown pages and impact summary to reload
  sheetConfig.updateExisting(configOption_rawResponsesSheetName, newLinkedRespSheet.getName());
 
  // ensure breakdown pages have all formulas in all rows
  refillAllBreakdownPages_(spreadsheet, migrationPlan.migrateTo.areas);
   
  assertConfigOk_(spreadsheet);

  sheetConfig.updateExisting(configOption_LastMigration, new Date());  
  form.setAcceptingResponses(wasAcceptingResponses);
  
  const successMessage = "Migrated form and sheet from " + fromGitRef + " to " + toGitRef + ".\n" + migrationResult;
  console.log(successMessage);
  return successMessage;
}



function fetchMigrationPlan(fromGitRef, toGitRef) {
  const baseUrl = "https://us-central1-cf-rd-managers-feedback-eval.cloudfunctions.net/";
  const url = baseUrl + "migrationPlan?fromGitRef=" + fromGitRef + "&toGitRef=" + toGitRef;
  
  const resp = UrlFetchApp.fetch(url);
  if (resp.getResponseCode() != 200) {
    throw "error fetching migration plan: code " + resp.getResponseCode();
  }
  
  return JSON.parse(resp.getContentText());  
}





function migrateRawResponsesSheets_(migrationPlan, origLinkedRespSheet, newLinkedRespSheet) {
  const columnPlan = planRawResponseSheetColumnMigrations_(
    migrationPlan,
    getColumnHeaders_(origLinkedRespSheet),
    getColumnHeaders_(newLinkedRespSheet));
  
  if (!(columnPlan.length > 3)) {
    throw "planned raw response migrations is too short"; 
  }
  
  const numRows = origLinkedRespSheet.getLastRow()-1;
  if (numRows < 1) {
    return "no responses in original raw responses sheet.";
  }
  
  columnPlan.forEach(function(mig) {
    if (typeof mig.srcColIndex !== "number") {
      throw "expected srcColIndex to be number, instead was " + mig.srcColIndex;
    }
    const srcRange = origLinkedRespSheet.getRange(2, mig.srcColIndex, numRows);
    const dstColumn = newLinkedRespSheet.getRange(2, mig.dstColIndex);
    srcRange.copyTo(dstColumn);
  });
  
  return "migrated " + numRows + " responses across " + columnPlan.length + " columns.";
}


// returns mapping from old column to new column
function planRawResponseSheetColumnMigrations_(migrationPlan, startRawResponseColHeaders, endRawResponseColHeaders) {
  const startColIndex = makeColumnHeaderIndex_(startRawResponseColHeaders);
  const endColIndex = makeColumnHeaderIndex_(endRawResponseColHeaders);
  
  function toColumnIndicies_(hdrMigrations) {
    return hdrMigrations.map(function(m) {
      const ret = { 
        srcColIndex: startColIndex[m.srcColHeader],
        dstColIndex: endColIndex[m.dstColHeader]
      };
      if ((ret.srcColIndex > 0) && (ret.dstColIndex > 0)) {
        return ret;
      }
      throw "unable to find indicies for column headers: " + JSON.stringify(m);
    });
  }
  
  const metadataColumnsToMigrate = [1,2,3,4].map(function(i) { return { srcColIndex: i, dstColIndex: i }; });
  const skillColumnsToMigrate = toColumnIndicies_(planMigrationSkills_(migrationPlan));
  const additionalContextColumnsToMigrate = toColumnIndicies_(planMigrationAdditionalContext_(migrationPlan));

  return metadataColumnsToMigrate.concat(additionalContextColumnsToMigrate).concat(skillColumnsToMigrate);
}

function planMigrationAdditionalContext_(migrationPlan) {
  return planMigrationColHeaders_(
    migrationPlan.migrateFrom.areas,
    migrationPlan.migrateTo.areas,
    form_additionalContextTitle_basic_
  ).concat(planMigrationColHeaders_(
    migrationPlan.migrateFrom.areas,
    migrationPlan.migrateTo.areas,
    form_additionalContextTitle_advanced_
  ));
}

function planMigrationSkills_(migrationPlan) {
  return planMigrationColHeaders_(
    migrationPlan.migrateFrom.skills,
    migrationPlan.migrateTo.skills,
    function(skill) { return sheet_formatSkill_(skill.description); }
  );
}

function planMigrationColHeaders_(startItems, endItems, getColHeader) {
  const endDict = arrayToDict_(endItems, function(i) { return [i.id, i] });
  const toMigrate = startItems.filter(function(i) { return (i.id in endDict); });
  return toMigrate.map(function(startItem) {
    return {
      srcColHeader: getColHeader(startItem),
      dstColHeader: getColHeader(endDict[startItem.id])
    };
  });  
}