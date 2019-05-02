// v1 Forms had every Additional Context field with the same title
// when mapped to columns in the raw responses sheet, they were indistinguishable
// we rename additional-context item titles so each one is unique
// we do this before unlinking so that the column headers on the original data sheet become unique
// then we can migrate them by their unique title
//
// these changes take some time to propagate to the sheet.
// see: waitUntilTitlesHavePropagatedToOriginalSheet_
function updateContextItemTitles_(form) {
  var currentPageTitle;
  var countTitleUpdates = 0;
  form.getItems().forEach(function(item) {
    if (item.getType() === FormApp.ItemType.PAGE_BREAK) {
      currentPageTitle = item.getTitle();
      return
    }
    if (item.getType() !== FormApp.ItemType.PARAGRAPH_TEXT) {
      return;
    }
    item.asParagraphTextItem().setTitle(form_additionalContextTitle_(currentPageTitle));
    countTitleUpdates++;
  });
  return countTitleUpdates;
}


// this blurb wasn't on the v1 Forms.  put it there
function updateLandingPageText_(form) {
  const msg = 'Please take a moment to review "How to interpret Frequency and Impact" at: https://github.com/pivotal-cf/areas-of-contribution#how-to-interpret-frequency--impact'
  form.setDescription(msg);
}

function isBasic_(s) { return s.level == "p1" || s.level == "p2"; }
function isAdvanced_(s) { return !isBasic_(s); }

function matchesArea_(area) { 
  return function(skill) { return skill.area === area.id; };
}

function getSkillDescription_(skill) {
  return skill.description;
}

function asFormPages_(migrateState) {
  var pages = [];
  migrateState.areas.forEach(function(area) {
    pages.push({ 
      title: form_areaTitle_(area),
      gridRows: migrateState.skills.filter(matchesArea_(area)).filter(isBasic_).map(getSkillDescription_),
    });
    pages.push({ 
      title: "Advanced " + form_areaTitle_(area),
      gridRows: migrateState.skills.filter(matchesArea_(area)).filter(isAdvanced_).map(getSkillDescription_),
    });
  });
  return pages;
}

function getActualFormPages_(form) {
  var pages = [];
  var currentPageTitle;
  form.getItems().forEach(function(item) {
    if (item.getType() === FormApp.ItemType.PAGE_BREAK) {
      currentPageTitle = item.getTitle();
      return
    }
    if (item.getType() !== FormApp.ItemType.CHECKBOX_GRID) {
      return;
    }
    pages.push({
      title: currentPageTitle,
      checkboxGridItem: item.asCheckboxGridItem(),
    });
  });
  return pages;
}

function validateFormRewrites_(form, migrationPlan) {
  const expectedCurrentPages = asFormPages_(migrationPlan.migrateFrom);
  const newPages = asFormPages_(migrationPlan.migrateTo);
  if (expectedCurrentPages.length != newPages.length) {
    throw "this migration changes the number of form pages.  we don't support this yet!";
  }
  expectedCurrentPages.forEach(function(expectedCurrentPage, i) {
    const newPage = newPages[i];
    if (newPage.title !== expectedCurrentPage.title) {
      throw "this migration changes the page title for " + expectedCurrentPage.title + " but we don't yet support that!";
    }
  });
    
  const actualCurrentPages = getActualFormPages_(form);
  if (expectedCurrentPages.length != actualCurrentPages.length) {
    throw "form has " + actualCurrentPages.length + " pages but the migration expects to start with " + expectedCurrentPages.length + " pages";
  }
}

function rewriteFormQuestions_(form, migrationPlan) {
  const expectedCurrentPages = asFormPages_(migrationPlan.migrateFrom);
  const newPages = asFormPages_(migrationPlan.migrateTo);    
  const actualCurrentPages = getActualFormPages_(form);
  
  // done with basic validations.  on to the updates....  
  actualCurrentPages.forEach(function(actualPage, i) {
    const expectedCurrentPage = expectedCurrentPages[i];
    const newPage = newPages[i];
    
    if (actualPage.title !== expectedCurrentPage.title) {
      throw "expected form page " + i + " to be " + expectedCurrentPage.title + " but instead was " + actualPage.title;
    }
    
    actualPage.checkboxGridItem.setRows(newPage.gridRows);
  });
}