package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"

	yaml "gopkg.in/yaml.v2"
)

type Area struct {
	ID          string
	Title       string
	Description string

	// extra fields that might be present, but we ignore when generating Markdown
	Form struct {
		Title string
	}
	Sheet struct {
		Title string
	}
}

type Skill struct {
	ID          string
	Description string
	Area        string
	Level       string
}

func main() {
	if err := mainWithErr(); err != nil {
		log.Fatalf("%s", err)
	}

	fmt.Println("success")
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

func mainWithErr() error {
	var inDir string
	flag.StringVar(&inDir, "in", "", "source directory containing YAML files")
	flag.Parse()
	if inDir == "" {
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

	all := &AreasAndSkills{
		Areas:  areasFile.Areas,
		Skills: skillsFile.Skills,
	}
	if err := all.buildDictionaries(); err != nil {
		return fmt.Errorf("building dictionaries: %s", err)
	}

	skillChecks := []SkillCheck{
		all.skillHasArea,
		skillIdFormat,
		skillLevels,
	}
	for _, check := range skillChecks {
		if err := all.assertForEachSkill(check); err != nil {
			return fmt.Errorf("checking skill: %s", err)
		}
	}

	return nil
}

type AreasAndSkills struct {
	Areas  []Area
	Skills []Skill

	AreasDict  map[string]Area
	SkillsDict map[string]Skill
}

func (all *AreasAndSkills) buildDictionaries() error {
	areasDict := map[string]Area{}
	skillsDict := map[string]Skill{}
	for _, a := range all.Areas {
		_, found := areasDict[a.ID]
		if found {
			return fmt.Errorf("two areas have the same id %s", a.ID)
		}
		areasDict[a.ID] = a
	}

	for _, s := range all.Skills {
		_, found := skillsDict[s.ID]
		if found {
			return fmt.Errorf("two skills have the same id %s", s.ID)
		}
		skillsDict[s.ID] = s
	}

	all.AreasDict = areasDict
	all.SkillsDict = skillsDict
	return nil
}

type SkillCheck func(Skill) error

func (all *AreasAndSkills) assertForEachSkill(f SkillCheck) error {
	for _, s := range all.Skills {
		if err := f(s); err != nil {
			return err
		}
	}
	return nil
}

func (all *AreasAndSkills) skillHasArea(s Skill) error {
	_, found := all.AreasDict[s.Area]
	if !found {
		return fmt.Errorf("skill %s points to unknown area %s", s.ID, s.Area)
	}
	return nil
}

func skillIdFormat(s Skill) error {
	if s.ID[0] != 's' {
		return fmt.Errorf("skill %s has invalid ID, expecting to start with s", s.ID)
	}
	return nil
}

func skillLevels(s Skill) error {
	for _, l := range []string{"p1", "p2", "p3", "p4", "p5"} {
		if s.Level == l {
			return nil
		}
	}
	return fmt.Errorf("skill %s has invalid level", s.ID)
}
