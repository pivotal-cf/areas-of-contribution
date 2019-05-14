package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"text/template"

	yaml "gopkg.in/yaml.v2"
)

func main() {
	if err := mainWithErr(); err != nil {
		fmt.Fprintf(os.Stderr, "error: %s\n", err)
		os.Exit(1)
	}
}

func readYamlFile(path string, outData interface{}) error {
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()

	decoder := yaml.NewDecoder(file)
	decoder.SetStrict(true)
	return decoder.Decode(outData)
}

type Area struct {
	Id          string
	Title       string
	Description string

	// extra fields that might be present, but we ignore when generating Markdown
	Form  interface{}
	Sheet interface{}
}

type Skill struct {
	ID          string
	Description string
	Area        string
	Level       string
}

type DocsSkillLevel struct {
	Level  string
	Skills []Skill
}

type DocsData struct {
	AreaID      string
	Title       string
	Description string
	SkillLevels []DocsSkillLevel
}

func buildDocsSkillLevels(areaID string, skills []Skill) []DocsSkillLevel {
	groupedByLevel := map[string][]Skill{}
	for _, skill := range skills {
		if skill.Area != areaID {
			continue
		}
		groupedByLevel[skill.Level] = append(groupedByLevel[skill.Level], skill)
	}
	levels := []string{}
	for level := range groupedByLevel {
		levels = append(levels, level)
	}
	sort.Strings(levels)
	out := []DocsSkillLevel{}
	for _, level := range levels {
		out = append(out, DocsSkillLevel{
			Level:  strings.ToUpper(level),
			Skills: groupedByLevel[level],
		})
	}
	return out
}

func convertForDocs(areas []Area, skills []Skill) []DocsData {
	out := []DocsData{}
	for _, a := range areas {
		out = append(out, DocsData{
			AreaID:      a.Id,
			Title:       a.Title,
			Description: a.Description,
			SkillLevels: buildDocsSkillLevels(a.Id, skills),
		})
	}
	return out
}

func mainWithErr() error {
	var inDir string
	var outDir string
	flag.StringVar(&inDir, "in", "", "source directory containing YAML files")
	flag.StringVar(&outDir, "out", "", "output directory to save generated Markdown docs")
	flag.Parse()
	if inDir == "" || outDir == "" {
		return fmt.Errorf("missing required flags, try running with -h")
	}

	var areasFile struct {
		Areas []Area
	}
	if err := readYamlFile(filepath.Join(inDir, "areas.yaml"), &areasFile); err != nil {
		return fmt.Errorf("reading areas: %s", err)
	}

	var skillsFile struct {
		Skills []Skill
	}
	if err := readYamlFile(filepath.Join(inDir, "skills.yaml"), &skillsFile); err != nil {
		return fmt.Errorf("reading skills: %s", err)
	}

	markdownData := convertForDocs(areasFile.Areas, skillsFile.Skills)

	var tmpl = template.Must(template.New("skill-area").Parse(skillAreaTemplate))
	for _, mdData := range markdownData {
		if err := writeMarkdownFile(filepath.Join(outDir, mdData.AreaID+".md"), tmpl, mdData); err != nil {
			return fmt.Errorf("writing markdown: %s", err)
		}
	}
	return nil
}

func writeMarkdownFile(path string, tmpl *template.Template, mdData DocsData) error {
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()

	if err := tmpl.Execute(file, mdData); err != nil {
		return fmt.Errorf("rendering skill area template: %s", err)
	}
	return nil
}

const skillAreaTemplate = `<!--- This file was GENERATED.  Do not edit it directly.  Instead, edit the corresponding YAML file --->
## {{.Title}}

{{.Description}}

---

<table>
<tbody>

<thead>
<td>Level</td><td>Skills</td>
</thead>

{{ range .SkillLevels }}<tr>
<td><strong>{{.Level}}</strong></td>
<td valign="top"><ul>{{ range .Skills }}
  <li>{{.Description}}</li>
{{ end }}</ul></td>
</tr>

{{ end }}

</tbody></table>
`
