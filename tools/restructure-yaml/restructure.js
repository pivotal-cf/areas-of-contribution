#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const jsyaml = require('js-yaml');

const yamlDumpOptions = {
  noArrayIndent: true,
  lineWidth: 100,
  noRefs: true,
}

const skillAreas = [
	"technical-execution",
	"engineering-process",
	"cf-domain-expertise",
	"collaboration",
	"project-leadership",
	"alignment",
	"support",
	"technical-decision-making",
	"flow",
]

const oldSkillAreas = skillAreas.map(sa => {
  var oldSkillArea = jsyaml.safeLoad(fs.readFileSync(sa + ".yaml"));
  oldSkillArea["id"] = sa;
  return oldSkillArea
});


const areas = oldSkillAreas.map(a => {
  return { id: a.id, title: a.title, description: a.description };
});
fs.writeFileSync("areas.yaml", jsyaml.safeDump({ areas: areas }, yamlDumpOptions))

function generateId(s) {
  const hash = crypto.createHash('sha256');
  hash.update(s);
  return "s" + hash.digest('hex').substring(0, 8);
}

const skills = oldSkillAreas.map(a => {
  return a.skill_levels.map(l => {
    return l.skills.map(s => {
      return {
        id: generateId(s),
        description: s,
        area: a.id,
        level: l.level.toLowerCase()
      };
    });
  });
}).flat(3);

fs.writeFileSync("skills.yaml", jsyaml.safeDump({ skills: skills }, yamlDumpOptions))
