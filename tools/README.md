# tools

Programs for maintaining the Areas of Contribution and the Feedback Forms.

They read the skill definition files in the [`yaml` directory](../yaml).

- [`md-generator`](md-generator): CLI tool to build Markdown file for a Skill Area from a YAML definition

- [`regenerate.sh`](regenerate.sh): Script to regenerate all Markdown files.  It calls `md-generator` once per yaml file.
