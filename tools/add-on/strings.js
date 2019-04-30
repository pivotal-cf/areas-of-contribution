
function form_additionalContextTitle_(pageTitle) {
  return "Additional context: " + pageTitle; 
}

function form_additionalContextTitle_basic_(area) {
  return form_additionalContextTitle_(form_areaTitle_(area)); // form title, not sheet title
}

function form_additionalContextTitle_advanced_(area) {
  return form_additionalContextTitle_("Advanced " + form_areaTitle_(area)); // form title, not sheet title
}

function sheet_formatSkill_(skillDescription) {
  return " [" + skillDescription + "]";
}

function sheet_areaTitle_(a) {
  return a.sheet ? a.sheet.title : a.title;
}

function form_areaTitle_(a) {
  return a.form ? a.form.title : a.title;
}

function sheet_formatLevel_(level) {
  return level.toUpperCase();
}

function hasWhiteSpace(s) {
  return s.indexOf(' ') >= 0;
}