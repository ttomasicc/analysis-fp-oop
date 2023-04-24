#!/bin/bash

runs="$1"

if [ -z "$runs" ] || [ "$runs" -lt 1 ]; then
  echo "The number of test runs must be a positive number..."
  exit 1
fi

echo "Preparing the testing environment..."
# Creates the necessary directories
mkdir -p .build/ test-results/

# Cleans the previous JS test scripts
rm -f .build/*

# Creates the results file ( with headers )
outfile="test-results/$(date +'%Y-%m-%d-%H:%M:%S').csv"
echo "script,time_taken,memory_usage" >$outfile

# Loops over JS and TS scripts in the tests/ directory
# and copies ( or compiles ) them into the .build/ directory
echo "Compiling tests..."
for script in ./tests/*.ts ./tests/*.js; do
  if [[ -f $script ]]; then
    if [[ $script == *.ts ]]; then
      tsc $script --target es2022 --outDir .build/
    else
      cp $script .build/
    fi
  fi
done

# Runs the JS test scripts and writes the results to the output file
echo -ne "Running tests... [0/$runs]\r" # Moves the cursor back to the beginning of the line
for ((i = 1; i <= $runs; i++)); do
  for script in .build/*.js; do
    if [[ -f $script ]]; then
      # Reads the first two lines of the script output
      read -r time_taken memory_usage <<<"$(node $script | head -2 | tr '\n' ' ')"
      # read -r time_taken memory_usage <<<"$(node --max-old-space-size=1000 --max-semi-space-size=512 --noconcurrent_sweeping $script | head -2 | tr '\n' ' ')"

      # Writes the results to the output file
      echo "$(basename $script),$time_taken,$memory_usage" >>$outfile
    fi
  done

  echo -ne "Running tests... [$i/$runs]\r"
done
echo ""

# Outputs the most recent results
echo "---"
echo "The results are the following..."
echo "---"
cat $(ls test-results/*.csv | sort | tail -n 1)