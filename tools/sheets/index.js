const fetch = require('node-fetch');
const yaml = require('js-yaml');
const csvSyncStringify = require('csv-stringify/lib/sync');
const flatten = require('array-flatten');

const fetchYAML = (url) => fetch(url).then(r => r.text()).then(text => yaml.safeLoad(text))

const areaTitleForSheet = (a) => a.sheet ? a.sheet.title : a.title;
const formatSkillForSheet = (skillDescription) => " [" + skillDescription + "]";
const formatLevelForSheet = (level) => level.toUpperCase();

const sheetRows = (areas, skills) => {
  return flatten.depth(areas.areas.map(a => skills.skills.filter(s => s.area === a.id).map(s => [
    areaTitleForSheet(a),
    formatSkillForSheet(s.description),
    formatLevelForSheet(s.level),
  ])), 1);
};

const contentUrl = (gitRef, filename) => "https://raw.githubusercontent.com/pivotal-cf/areas-of-contribution/" + gitRef + "/" + filename;

exports.skillsAsCSV = (req, res) => {
  const gitRef = req.query.gitRef || "master";
  const areasUrl = contentUrl(gitRef, "yaml/areas.yaml");
  const skillsUrl = contentUrl(gitRef, "yaml/skills.yaml");
  Promise.all([ fetchYAML(areasUrl), fetchYAML(skillsUrl) ]).then(([areas,skills]) => {
    const records = sheetRows(areas, skills);
    const csvData = csvSyncStringify(records, { quoted: true });
    res.set('Content-Type', 'text/csv');
    res.send(csvData);
  });
};

