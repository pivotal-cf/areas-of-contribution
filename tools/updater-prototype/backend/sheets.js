function findLinkedSheet_(form) {
  const spreadsheet = SpreadsheetApp.openById(form.getDestinationId());
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
    throw "too many sheets are linked to this form";
  }
  if (linkedSheets.length < 1) {
    throw "expecting to find one sheet linked to " + formEditUrl + " but instead found " + sheets.map(function(s) { return s.getFormUrl(); }).toString();
  }
  return linkedSheets[0];
}

// form item changes can take a while to propogate to the sheet
// this function tests if the change to the Additional Context headers have updated
function sheetHasCorrectAdditionalContextHeaders_(sheet, areas) {
  const colHeaderIndex = makeColumnHeaderIndex_(getColumnHeaders_(sheet));
  return areas.every(function(area) {
   const basic = additionalContextTitle_basic_(area);
   const advanced = additionalContextTitle_advanced_(area);
   return colHeaderIndex[basic] && colHeaderIndex[advanced];
  });
}

function getColumnHeaders_(sheet) {
  return trimFinalBlanks_(sheet.getRange("A1:1").getValues()[0]);
}

function trimFinalBlanks_(input) {
 var ar = input.slice();
 while (ar.length) {
   if (ar[ar.length-1] !== "") { 
     break;
   }
   ar.pop();
 }
 return ar;
}

var configOption_SkillsRepoRelease = "Skills repo release";
var configOption_LastMigration = "Last migration";
var configOption_rawResponsesSheetName = "Raw Responses Sheet Name";

function assertSkillsMatch_(spreadsheet) {
  const configSheet = spreadsheet.getSheetByName("Config");
  if (!configSheet) {
    throw "missing expected tab 'Config'.   Please upgrade to Feedback Response spreadsheet v2 before using this tool"
  }
  const status = configSheet.getRange("C4").getValue().toString();
  if (status !== "Ok") {
    throw "Spreadsheet is not correctly set up.  Resolve error in Config sheet: " + status;
  }
}

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

function migrateRawResponses_(migrationPlan, origLinkedRespSheet, newLinkedRespSheet) {
  const plan = planRawResponseMigrations_(
    migrationPlan,
    getColumnHeaders_(origLinkedRespSheet),
    getColumnHeaders_(newLinkedRespSheet));
  
  if (!(plan.length > 3)) {
    throw "planned raw response migrations is too short"; 
  }
  
  const numRows = origLinkedRespSheet.getLastRow()-1;
  if (numRows < 1) {
    return "no data in original raw responses sheet to migrate.";
  }
  
  plan.forEach(function(mig) {
    if (typeof mig.srcColIndex !== "number") {
      throw "expected srcColIndex to be number, instead was " + mig.srcColIndex;
    }
    const srcRange = origLinkedRespSheet.getRange(2, mig.srcColIndex, numRows);
    const dstColumn = newLinkedRespSheet.getRange(2, mig.dstColIndex);
    srcRange.copyTo(dstColumn);
  });
  
  return "migrated " + numRows + " responses across " + plan.length + " columns";
}


// returns mapping from old column to new column
function planRawResponseMigrations_(migrationPlan, startRawResponseColHeaders, endRawResponseColHeaders) {
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
  
function additionalContextTitle_basic_(area) {
  return formatAdditionalContextTitle_(areaTitleForForm_(area)); // form title, not sheet title
}

function additionalContextTitle_advanced_(area) {
  return formatAdditionalContextTitle_("Advanced " + areaTitleForForm_(area)); // form title, not sheet title
}


function planMigrationAdditionalContext_(migrationPlan) {
  return planMigrationColHeaders_(
    migrationPlan.migrateFrom.areas,
    migrationPlan.migrateTo.areas,
    additionalContextTitle_basic_
  ).concat(planMigrationColHeaders_(
    migrationPlan.migrateFrom.areas,
    migrationPlan.migrateTo.areas,
    additionalContextTitle_advanced_
  ));
}

function planMigrationSkills_(migrationPlan) {
  return planMigrationColHeaders_(
    migrationPlan.migrateFrom.skills,
    migrationPlan.migrateTo.skills,
    function(skill) { return formatSkillForSheet_(skill.description); }
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

// ensures formulas on row 1 are copied all the way down to the last row
// then trims the rows
function refillBreakdownPage_(sheet) {
   const firstRow = sheet.getRange("D2:2");
   const toFill = sheet.getRange("D2:24");
  
  firstRow.autoFill(toFill, SpreadsheetApp.AutoFillSeries.DEFAULT_SERIES);
  const lastSkillRow = sheet.getRange("A1:A").getLastRow();
  if (lastSkillRow < sheet.getMaxRows()) {
    sheet.deleteRows(lastSkillRow+1,sheet.getMaxRows()-lastSkillRow);
  } 
}

function refillAllBreakdownPages_(spreadsheet, areas) {
  areas.forEach(function(area) {
    const sheetName = areaTitleForSheet_(area);
    const sheet = spreadsheet.getSheetByName(sheetName);
    refillBreakdownPage_(sheet);
  });
}

function buildNewSkillsTable_(migrateTo) {
  const areasDict = arrayToDict_(migrateTo.areas, function(area) { return [area.id, area] });
  
  return migrateTo.skills.map(function(skill) {
    const area = areaTitleForSheet_(areasDict[skill.area]);
    const desc = formatSkillForSheet_(skill.description);
    const level = skill.level.toUpperCase();
    return [area, desc, level];
  });
}


function regenerateSkillsTab_(spreadsheet, migrateTo) {
  const skillsSheet = spreadsheet.getSheetByName("Skills");
  const newSkillsTable = buildNewSkillsTable_(migrateTo);
  const rowsToAdd = newSkillsTable.length + 1 - skillsSheet.getMaxRows();
  if (rowsToAdd > 0) {
    skillsSheet.insertRowsAfter(skillsSheet.getMaxRows(), rowsToAdd);
  } else if (rowsToAdd < 0) {
   skillsSheet.deleteRows(newSkillsTable.length + 1, -rowsToAdd);
  }
  
  skillsSheet.getRange("A2:C").setValues(newSkillsTable);
}
            
function areaTitleForSheet_(a) {
  return a.sheet ? a.sheet.title : a.title;
}

function areaTitleForForm_(a) {
  return a.form ? a.form.title : a.title;
}

function formatSkillForSheet_(skillDescription) {
  return " [" + skillDescription + "]";
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
