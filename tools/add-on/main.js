function onOpen() {
  SpreadsheetApp.getUi().createMenu("Areas of Contribution")
  .addItem("Troubleshooting: Set skill version...", "setSkillVersionUI_")
  .addSeparator()
  .addItem("Migrate...", "migrateUI_")
  .addSeparator()
  .addItem("Bugfix to v2.0.2", "bugfix_normalized_impact_with_sparse_")
  .addToUi();
}

function onInstall(e) {
  onOpen();
}

function promptOkCancel_(ui, title, message) {
  const result = ui.prompt(
      title,
      message,
      ui.ButtonSet.OK_CANCEL);

  const button = result.getSelectedButton();
  const response = result.getResponseText();
  if (button !== ui.Button.OK) {
    return; // clicked cancel or close
  }
  return response;
}


function alertOkCancel_(ui, title, message) {
  return ui.alert(title,message,ui.ButtonSet.OK_CANCEL) === ui.Button.OK;
}



function migrateUI_() {
  const ui = SpreadsheetApp.getUi();
  const toGitRef = promptOkCancel_(ui, "Migrate",
      "Migrate the sheet, linked form, and all response data\nfrom your current version of Areas of Contribution to a new version.\n\nMigrate to git ref:");
  if (!toGitRef) {
    return;
  }

  const really = alertOkCancel_(ui, "Ready?", "This may take up to *** 3 minutes *** to complete.\n\nContinue?");
  if (!really) {
    return;
  }

  const successMessage = migrateCore_(SpreadsheetApp.getActiveSpreadsheet(), toGitRef);

  ui.alert("Migration: Success!", successMessage, ui.ButtonSet.OK);
}

function setSkillVersionUI_() {
  const ui = SpreadsheetApp.getUi();
  const gitRef = promptOkCancel_(ui, 'Set Skill Version',
    "This won't migrate data, it just picks the version of skills\nto use with the raw response data.\n\nEnter git ref:");
  if (!gitRef) {
    return;
  }

  setSkillsCore_(SpreadsheetApp.getActiveSpreadsheet(), gitRef)
  ui.alert("Skill definitions updated to " + gitRef);
}
