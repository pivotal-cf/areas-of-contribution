var configOption_SkillsRepoRelease = "Skills repo release";
var configOption_LastMigration = "Last migration";
var configOption_rawResponsesSheetName = "Raw Responses Sheet Name";

function configLoad_(spreadsheet) {
  const configSheet = spreadsheet.getSheetByName("Config");
  if (!configSheet) {
    throw "missing expected tab 'Config'.   Please upgrade to Feedback Response spreadsheet v2 before using this tool"
  }
  const range = configSheet.getRange("A2:B");
  return {
    range: range,
    rawValues: range.getValues(),
    get: function(key) {
      var i;
      for(i = 0; i<this.rawValues.length; i++) {
        if (this.rawValues[i][0] == key) {
          return this.rawValues[i][1];
        }
      }
      throw "config key not found " + key;
    },
    updateExisting: function(key, value) {
      var i;
      for(i = 0; i<this.rawValues.length; i++) {
        if (this.rawValues[i][0] == key) {
          this.rawValues[i][1] = value;
          break;
        }
      }
      if (i == this.rawValues.length) {
        throw "config key not found " + key; 
      }
      this.range.setValues(this.rawValues);
    }
  };
}

function assertConfigOk_(spreadsheet) {
  const configSheet = spreadsheet.getSheetByName("Config");
  if (!configSheet) {
    throw "missing expected tab 'Config'.   Please upgrade to Feedback Response spreadsheet v2 before using this tool"
  }
  
  const magicCellRef = "C4";  // TODO: make this not brittle
  const status = configSheet.getRange(magicCellRef).getValue().toString();
  if (!status) {
    throw "Config sheet: missing expected checksum.  Please ask for help from a maintainer!"
  }
  if (status !== "Ok") {
    throw "Config sheet: " + status;
  }
}