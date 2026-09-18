#!/bin/bash
cd $HOME/bm
node_modules/.bin/vite-node --config vite.headless.config.ts scripts/lever-sweep.ts --jobsfile=sweep/jobs.txt --donefile=sweep/done.txt --out=sweep/results.jsonl --budget=${BUDGET:-120000} 2>&1 | tail -${TAIL:-4}
echo "done: $(wc -l < sweep/done.txt)/$(wc -l < sweep/jobs.txt) rows: $(wc -l < sweep/results.jsonl)"
