package main

import (
	"log"
	"os"
	"text/template"

	yaml "gopkg.in/yaml.v2"
)

type SkillArea struct {
	Title       string
	Description string
	SkillLevels []struct {
		Level  string
		Skills []string
	} `yaml:"skill_levels"`
}

func main() {
	if len(os.Args) != 2 {
		log.Fatalf("expecting a skill area YAML file as argument")
	}
	file, err := os.Open(os.Args[1])
	if err != nil {
		log.Fatalf("reading skill area file: %s", err)
	}

	var skillArea SkillArea
	decoder := yaml.NewDecoder(file)
	decoder.SetStrict(true)
	err = decoder.Decode(&skillArea)
	if err != nil {
		log.Fatalf("unmarshaling yaml: %s", err)
	}

	var tmpl = template.Must(template.New("skill-area").Parse(skillAreaTemplate))
	err = tmpl.Execute(os.Stdout, skillArea)
	if err != nil {
		log.Fatalf("rendering skill area template: %s", err)
	}
}

const skillAreaTemplate = `<!--- This file was GENERATED.  Do not edit it directly.  Instead, edit the corresponding YAML file --->
## {{.Title}}

{{.Description}}

---
### Proposed Levels and Skills

<table>
<tbody>

<thead>
{{ range .SkillLevels }}<td><strong>{{.Level}}</strong></td>
{{ end }}
</thead>

<tr>{{ range .SkillLevels }}

<!-- {{.Level}} -->
<td valign="top"><ul>{{ range .Skills }}
  <li>{{.}}</li>
{{ end }}</ul></td>{{ end }}

</tr>
</tbody></table>
`
