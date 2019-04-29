function onOpen() {
  SpreadsheetApp.getUi().createMenu("Areas of Contribution").addItem("Set skill version...", "pickSkillVersion_").addToUi(); 
}

function onInstall(e) {
  onOpen();
}

function fetchAreasAndSkills_(gitRef) {
  const response = UrlFetchApp.fetch("https://us-central1-cf-rd-managers-feedback-eval.cloudfunctions.net/skillsAsCSV?gitRef=" + gitRef);
  return Utilities.parseCsv(response.getContentText());
}

function pickSkillVersion_() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt(
      'Set Skill Version',
    "This won't migrate data, it just picks the version of skills\nto use with the raw response data.\n\nEnter git ref:",
      ui.ButtonSet.OK_CANCEL);

  // Process the user's response.
  const button = result.getSelectedButton();
  const gitRef = result.getResponseText();
  if (button !== ui.Button.OK) {
    return; // clicked cancel or close
  }
  
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Config").getRange("B4").setValue(gitRef);
  const skills = fetchAreasAndSkills_(gitRef);
  const skillsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Skills");
  skillsSheet.getRange("A2:C").clear();
  if (skillsSheet.getMaxRows() < skills.length+1) {
   skillsSheet.insertRowsAfter(skillsSheet.getMaxRows(), skills.length+1-skillsSheet.getMaxRows());
  }
  skillsSheet.getRange(2, 1, skills.length,3).setValues(skills);
  if (skillsSheet.getMaxRows() > skills.length+1) {
    skillsSheet.deleteRows(skills.length+2,skillsSheet.getMaxRows()-skills.length-1);
  }
  
  ui.alert("Skill definitions updated to " + gitRef);
}