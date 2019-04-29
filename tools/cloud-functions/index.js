const fetch = require('node-fetch');
const yaml = require('js-yaml');
const csvSyncStringify = require('csv-stringify/lib/sync');
const flatten = require('array-flatten');

function handleFetchErrors(response) {
    if (!response.ok) {
      const err = {
        message: response.statusText,
        status: response.status,
      };
      console.log(err);
      throw err;
    }
    return response;
}
const fetchYAML = (url) => fetch(url).then(handleFetchErrors).then(r => r.text()).then(text => yaml.safeLoad(text));

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
  }).catch(err => {
    res.status(err.status || 500).send({
      message: "fetching content from github failed",
      details: err,
    });
  });
};

exports.migrationPlan = (req, res) => {
  const fromGitRef = req.query.fromGitRef;
  const toGitRef = req.query.toGitRef;
  if (!fromGitRef) {
    res.status(400).send({ message: "missing required query param fromGitRef" });
  }
  if (!toGitRef) {
    res.status(400).send({ message: "missing required query param toGitRef" });
  }
  const allPromises = [
   contentUrl(fromGitRef, "yaml/areas.yaml"),
   contentUrl(fromGitRef, "yaml/skills.yaml"),
   contentUrl(toGitRef, "yaml/areas.yaml"),
   contentUrl(toGitRef, "yaml/skills.yaml"),
  ].map(fetchYAML);
  Promise.all(allPromises).then(([fromAreas, fromSkills, toAreas, toSkills]) => {
    const migrationPlan = {
      migrateFrom: {
        gitRef: fromGitRef,
        areas: fromAreas.areas,
        skills: fromSkills.skills,
      },
      migrateTo: {
        gitRef: toGitRef,
        areas: toAreas.areas,
        skills: toSkills.skills,
      },
    };
    res.send(migrationPlan);
  }).catch(err => {
    res.status(err.status || 500).send({
      message: "fetching content from github failed",
      details: err,
    });
  });
};

