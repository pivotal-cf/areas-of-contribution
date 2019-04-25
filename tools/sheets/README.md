# skills CSV for heatmap spreadsheet

Serves the list of skills, formated as CSV, for use in the Feedback Heatmap sheet.

```
$ curl https://us-central1-cf-rd-managers-feedback-eval.cloudfunctions.net/skillsAsCSV?gitRef=master
"Technical Execution"," [Asks relevant questions on stories]","P1"
"Technical Execution"," [Provides basic input into pair's progress]","P1"
"Technical Execution"," [Provides coherent and informative updates at standup]","P1"
"Technical Execution"," [Actively participates in pointing well-defined stories]","P1"
...
```

## deploying to prod
```
gcloud auth login
gcloud config set project cf-rd-managers-feedback-eval
gcloud functions deploy skillsAsCSV --runtime nodejs10 --trigger-http
```
