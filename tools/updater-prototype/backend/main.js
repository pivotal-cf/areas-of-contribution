function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

function getUserEmail() {
  return Session.getActiveUser().getEmail();
}

function getFormAndSheetMetadata(feedbackFormUrl) {
  const form = FormApp.openByUrl(feedbackFormUrl);
  const sheet = SpreadsheetApp.openById(form.getDestinationId());
  const sheetConfig = configLoad_(sheet);
  
  return {
    formTitle: form.getTitle(),
    sheetTitle: sheet.getName(),
    skillsVersion: sheetConfig.get(configOption_SkillsRepoRelease),
  };
}

function doGet(e) {
  return HtmlService.createTemplateFromFile('frontend/index').evaluate().setTitle("Form/Sheet Updater");
}

// step 2
function getCurrentState(feedbackFormUrl) {
  const form = FormApp.openByUrl(feedbackFormUrl);
  const formResponseSheet = findLinkedSheet_(form);

  return {
    responsesSheet: {
      sheetName: formResponseSheet.getName(),
      columnHeaders: getColumnHeaders_(formResponseSheet),
    },
    form: getForm_(form),
  };
}

// step 4
function migrateFormAndSheet(updateSpec) {
  const form = FormApp.openByUrl(updateSpec.formUrl);
  const edits = updateSpec.edits;
  const migrationPlan = updateSpec.migrationPlan;
  
  const origLinkedRespSheet = findLinkedSheet_(form);
  const spreadsheet = SpreadsheetApp.openById(form.getDestinationId());
  const sheetConfig = configLoad_(spreadsheet);
  
  if (sheetConfig.get(configOption_SkillsRepoRelease) !== migrationPlan.migrateFrom.gitRef) {
    throw "migration start-version mismatch.  Spreadsheet tab 'Config' claims '" 
        + configOption_SkillsRepoRelease + "' is " + sheetConfig.get(configOption_SkillsRepoRelease)
       + " but we're attempting to start a migration from " + migrationPlan.migrateFrom.gitRef;
  }
  
  // if there's an error here, then abort
  assertSkillsMatch_(spreadsheet);
  
  const origLinkedRespSheetName = origLinkedRespSheet.getName();
  const destSpreadsheetId = form.getDestinationId();
  sheetConfig.updateExisting(configOption_LastMigration, "In-flight as of " + new Date());
  sheetConfig.updateExisting(configOption_SkillsRepoRelease,
                             "In-flight from " 
                             + migrationPlan.migrateFrom.gitRef 
                             + " to " 
                             + migrationPlan.migrateTo.gitRef);
  
  // rename additional-context item titles so each one is unique
  // we do this before unlinking, so that we can migrate them by their unique title
  // these changes take some time to propogate to the sheet though, so we'l wait below
  updateContextItemTitles_(form);
  
  // set landing page text
  updateLandingPageText(form);
  
  // stop accepting responses while we migrate
  const wasAcceptingResponses = form.isAcceptingResponses();
  form.setAcceptingResponses(false);

  // don't unlink until these changes propogate to the google sheet!
  var tries = 0;
  while(!sheetHasCorrectAdditionalContextHeaders_(origLinkedRespSheet, migrationPlan.migrateFrom.areas)) {
    Utilities.sleep(1000);
    if (tries++ > 5) {
      throw "raw response sheet never received updated column headers.  aborting."
    }
  }
  
  // unlink form
  // this way we can make further edits to the form without modifying the old response sheet
  form.removeDestination();
  origLinkedRespSheet.setName("Old Responses as of " + (new Date()).toISOString()); 

  // delete all form responses, since we're treating the sheet as the source of truth
  // we don't want the new sheet to get populated with existing responses, since the
  // data copied from the old sheet may not be in the same order.
  form.deleteAllResponses();

  // edit the form
  edits.forEach(function(edit) {  
    form.getItemById(edit.id).asCheckboxGridItem().setRows(edit.newRows);
  });
  
  // relink form.  this creates a new responses sheet
  form.setDestination(FormApp.DestinationType.SPREADSHEET, destSpreadsheetId);
  
  // find new linked sheet
  const newLinkedRespSheet = findLinkedSheet_(form);
  newLinkedRespSheet.setName("Raw");
  
  // migrate data
  const migrationResult = migrateRawResponses_(migrationPlan, origLinkedRespSheet, newLinkedRespSheet);

  // rebuild skills tab and update release version in Config
  regenerateSkillsTab_(spreadsheet, migrationPlan.migrateTo);
  sheetConfig.updateExisting(configOption_SkillsRepoRelease, migrationPlan.migrateTo.gitRef);
  
  // this causes the breakdown pages and impact summary to reload
  sheetConfig.updateExisting(configOption_rawResponsesSheetName, newLinkedRespSheet.getName());
  
  // ensure breakdown pages have all formulas in all rows
  refillAllBreakdownPages_(spreadsheet, migrationPlan.migrateTo.areas);
  
  
  // save metadata
  sheetConfig.updateExisting(configOption_LastMigration, new Date());

  // re-allow responses now that migration is complete
  form.setAcceptingResponses(wasAcceptingResponses);
  
  return { message: "migration successful", details: migrationResult };
}


