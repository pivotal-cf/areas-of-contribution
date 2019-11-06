# Contributing

**This repo is a work in progress.**

This effort is still early and we've got a lot of problems to solve.  We welcome questions and suggestions for improvement.

Feel free to open GitHub issues with questions or concerns. You can also reach out to your local Engineering Director to learn more, and/or join the conversation on Pivotal Slack at `#feedback-collection`.

## Roadmap
We're actively working to lower the cost of change to this repo.  Our goal is to
enable a pull-request workflow.

To get there, we plan to:

1. Document underlying intent behind existing skills: so that Pivots can consider and incorporate that intent when proposing changes to this repo

2. Establish a change-review process: so that contributors understand how
  their proposed changes will be reviewed and merged.

3. Establish a deployment process: so that changes here are reflected in the
  forms we use when gathering feedback.  [Related issue here](https://github.com/pivotal-cf/areas-of-contribution/issues/11).

We're hoping that will enable others to help us improve things here!

Want to suggest a change now?  We ask that you keep the following context in-mind when suggesting
improvements...

## Goals and anti-goals

We're not trying to document our existing P-leveing system here.  We're only
trying to identify and organize types of engineering contributions.

We're attempting to organize contributions based on what we've historically observed to be impactful at various P-levels.

See also: [Motivation](README.md#motivation).

## Style guide

### Terminology

##### *Contribution* / *Skill*
- What: A specific, observable statement describing how an engineer may positively impact their team.  A single engineer doesn't have to master _all_ of these skills/contributions to be successful at Pivotal.

- Example: *"Understands and explains the importance of improving feedback loops"*

- Materializes as: A "bullet-point" in a markdown file in this repo, and a "row" in our feedback forms.

##### *Skill Level*
- What: Contributions at a Skill Level are what we typically observe of Pivots at that P-Level

- Example: "P3"

- Materializes as: A column in the markdown files here.  Also, Contributions/Skills in the feedback form are ordered roughly according to this number.


##### *Skill Area*
- What: A course-grained area of impact. Contains a set of possible contributions, organized by Skill Level.  A single engineer doesn't have to master _all_ of these areas to be successful at Pivotal.

- Example: *"Technical Execution"*

- Materializes as: A markdown file in this repo, or a pair pages in our feedback forms.


##### *Impact Heatmap*

- What: A visual summary of feedback gathered for a single Pivot, organized by Skill Area (rows) and level-of-impact (columns).  It is used by managers to guide the growth of their reports and is **one of** the inputs used when determining a Pivot's P-level.

- Materializes as: A google sheet owned by a manager.



### Writing style
- Phrase skills in a "Does X" style, whenever possible.
- Frequency is currently handled via the feedback form, so it doesn't need to be part of the skill definitions.
- Focus on the **impact** of contributions, rather than simply the mechanics of doing them. We want these skills to be useful incentives as well as measures of success.
  - 👍 "Can fit healthy engineering chores into the normal flow of feature development." Pivots can be incentivized to maintain team health and balance with execution.
  - 👎 "Refactors code regularly" Pivots might be incentivized to refactor code, simply to check this box.

### Themes across levels

These themes span skills and skill areas, and are ordered from left-to-right
roughly in terms of scope or depth of impact.  They can be useful in determining what
P-level a particular skill belongs at.

<table>
<tbody>

<thead>
<td><strong>Theme</strong></td>
<td><strong>Progression</strong></td>
</thead>

<tr>
<td>Taking initiative</td>
<td>Following → Ability → Initiative → Follow-through</td>
</tr>

<tr>
<td>Operating in the unknown</td>
<td>Doing well-defined tasks → Doing less-defined tasks → Leading others through areas of uncertainty</td>
</tr>

<tr>
<td>Mechanics</td>
<td>Assisting others in doing X → Doing X → Doing X exceptionally → Coaching others on doing X</td>
</tr>

<tr>
<td>Consistency</td>
<td> When asked  → Reacting to own observations → Proactively → Continually </td>
</tr>

<tr>
<td>Scope of impact</td>
<td> Themselves → Their pair → Their team → Surrounding / similar teams → The organization </td>
</tr>

<tr>
<td>Presence</td>
<td> Respectful → Inclusive → Empathetic </td>
</tr>

</tbody></table>

## How to make a change to the skill definitions

Open a PR with a commit that: 

- Changes some text in the [`skills.yaml` file](https://github.com/pivotal-cf/areas-of-contribution/blob/master/yaml/skills.yaml) or [`areas.yaml` file](https://github.com/pivotal-cf/areas-of-contribution/blob/master/yaml/areas.yaml)
- Contains regenerated, up-to-date markdown files

If you change the meaning of a skill, please change the `id` also.  The decision of whether or not to migrate response data is conveyed by whether or not the `id` field of a skill definition remains intact. See the help sections below for guidance.

### How to regenerate markdown

After editing one of the yaml files, regenerate the markdown by running the following:
```
./tools/regenerate.sh
```

### Contributor decision tree - Should I create a new id?
- Should prior responses be migrated to the new skill definition?
   - yes?
     -  then keep the `id` field intact
     - it is ok to mutate `description` and any other fields
   - no?
     - then [change the `id` field](#how-to-make-a-new-id) (in other words, "delete and re-recreate").
     - ok to change any fields
     - This will result in old data being archived, so the change will be called out as **breaking** in release notes.

### Examples

1. Typo fix.  Preserve existing responses.
   ```diff
    - id: sf53e8688
      description: >-
        Can navigate their way through legacy systems and improve throughput of the team (eg: notices
   -    complex code paths are slowing down feature delviery, facilitates conversations with the team on
   +    complex code paths are slowing down feature delivery, facilitates conversations with the team on
        how to simplify them, gets buy-in from PM+leadership to prioritize this work, drives it to
        completion with the team.)
      area: technical-execution
   ```

0. Change the P-level associated with a skill definition.  Preserve existing responses.
   ```diff
    - id: s2be43833
      description: Discusses the balance of short term execution with long term health
   area: technical-execution
   -  level: p2
   +  level: p3
   ```

0. Change the meaning of a skill definition and its P-level.  Do not migrate old responses to the new skill.
   ```diff
   -- id: s2be43833
   -  description: Discusses the balance of short term execution with long term health
   +- id: s8131ec9e
   +  description: Calibrates pace of execution to balance short term delivery with long-term health
      area: technical-execution
   -  level: p2
   +  level: p3
   ```

### How to make a new `id`
Each skill and area must have a unique `id`.  By convention, the skill `id`s begin with `s` and the areas begin with `a` and the rest is random hex.

Given a new skill description, a convenient way to generate a new `id` in a terminal is:

```bash
printf "s%.8s" "$(echo "Asks relevant questions on stories" | shasum)"
```
which generates
```
sa7d19946
```


Uniqueness of `id`s can be validated by [running tests](https://github.com/pivotal-cf/areas-of-contribution/tree/master/tools/tests)

```bash
go run ./tools/tests/sanity_check.go -in ./yaml
```
These are also run in CI.

## Maintainers
This repo has maintainers.  They are listed in the [MAINTAINERS](MAINTAINERS) file.

The role of a maintainer is to:

- Establish a change-approval process so that our practices, artifacts and tools may be improved by Pivots.

- Review issues and pull-requests against this repo and provide feedback.

- Contribute to this repo so that our existing practices, artifacts and tools are well-documented and easily discoverable

#### Interested in becoming a maintainer?
We'd love to share the responsibilities.  Please reach out to us.

