# cloud functions to support versioned skill definitions

Collection of Google Cloud functions that translate the yaml files in this repo to other formats.  Backends used by other tools.

## `skillsAsCSV`
Serves the list of skills, formated as CSV, for use in the Feedback Heatmap sheet.

```
$ curl https://us-central1-cf-rd-managers-feedback-eval.cloudfunctions.net/skillsAsCSV?gitRef=master
"Technical Execution"," [Asks relevant questions on stories]","P1"
"Technical Execution"," [Provides basic input into pair's progress]","P1"
"Technical Execution"," [Provides coherent and informative updates at standup]","P1"
"Technical Execution"," [Actively participates in pointing well-defined stories]","P1"
...
```

## `migrationPlan`
Serves area and skill data as JSON for `from` and `to`  git refs.

```
$ curl 'https://us-central1-cf-rd-managers-feedback-eval.cloudfunctions.net/migrationPlan?fromGitRef=0.1.1&toGitRef=master' | jq .
...
```

## deploying to prod
```
gcloud auth login
gcloud config set project cf-rd-managers-feedback-eval
gcloud functions deploy skillsAsCSV --runtime nodejs10 --trigger-http
gcloud functions deploy migrationPlan --runtime nodejs10 --trigger-http
```
