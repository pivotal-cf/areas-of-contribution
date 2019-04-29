function setIfNotEmpty_(obj, fieldName, fieldValue) {
  if (fieldValue.length > 0) {
    obj[fieldName] = fieldValue
  }
}

function updateLandingPageText(form) {
  const msg = 'Please take a moment to review "How to interpret Frequency and Impact" at this URL: https://github.com/pivotal-cf/areas-of-contribution#how-to-interpret-frequency--impact'
  form.setDescription(msg);
}

function updateContextItemTitles_(form) {
  var currentPageTitle;
  form.getItems().forEach(function(item) {
    if (item.getType() === FormApp.ItemType.PAGE_BREAK) {
      currentPageTitle = item.getTitle();
      return
    }
    if (item.getType() !== FormApp.ItemType.PARAGRAPH_TEXT) {
      return;
    }
    item.asParagraphTextItem().setTitle(formatAdditionalContextTitle_(currentPageTitle));
  });
}

function formatAdditionalContextTitle_(pageTitle) {
  return "Additional context: " + pageTitle; 
}

function getForm_(form) {
  return {
    id: form.getId(),
    destinationId: form.getDestinationId(),  // spreadsheet id
    items: form.getItems().map(function(item) {
      var itemSpec = {
        index: item.getIndex(),
        id: item.getId(),
        type: item.getType().toString(),
      }
      setIfNotEmpty_(itemSpec, "helpText", item.getHelpText());
      setIfNotEmpty_(itemSpec, "title", item.getTitle());
      switch (item.getType()) {
        case FormApp.ItemType.CHECKBOX_GRID:
          var grid = item.asCheckboxGridItem();
          itemSpec['isRequired'] = grid.isRequired();
          itemSpec['columns'] = grid.getColumns();
          itemSpec['rows'] = grid.getRows();
          break;
        case FormApp.ItemType.LIST:
          var list = item.asListItem();
          itemSpec['isRequired'] = list.isRequired();
          itemSpec['choices'] = list.getChoices().map(function(c) {
            var choiceSpec = {
              pageNavigationType: c.getPageNavigationType().toString(),
              value: c.getValue(),
            };
            if (c.getPageNavigationType() == FormApp.PageNavigationType.GO_TO_PAGE) {
              var gotoPage = c.getGotoPage()
              choiceSpec['gotoPage'] = {
                id: gotoPage.getId(),
                title: gotoPage.getTitle(),
              }
            }
            return choiceSpec;
          });
          break;
        case FormApp.ItemType.PAGE_BREAK:
          var pageBreak = item.asPageBreakItem();
          itemSpec['pageNavigationType'] = pageBreak.getPageNavigationType().toString();
          if (pageBreak.getPageNavigationType() == FormApp.PageNavigationType.GO_TO_PAGE) {
            var gotoPage = pageBreak.getGoToPage()
            itemSpec['gotoPage'] = {
              id: gotoPage.getId(),
              title: gotoPage.getTitle(),
            }
          }
          break;
        case FormApp.ItemType.PARAGRAPH_TEXT:
          var paragraphText = item.asParagraphTextItem();
          itemSpec['isRequired'] = paragraphText.isRequired();
          break;
        case FormApp.ItemType.SECTION_HEADER:
          break;
        default:
          throw "unexpected item type " + itemSpec.type;
      }
      return itemSpec;
    })
  };
}
