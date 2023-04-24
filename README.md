# Analysis of the practical effectiveness of functional and object-oriented programming in the context of data processing

The research paper analyzes the effectiveness of functional and object-oriented programming in the context of processing collected meteorological data in the scripting languages JavaScript and TypeScript. Through a systematic review of the concepts of functional and object-oriented programming and a practical experiment of repeated measurement, the functional implementation proved to be more efficient in terms of space and time. Still, the object-oriented variant was optimized and approached the complexity of the functional one. The research shows that both programming paradigms have their advantages and disadvantages and that the implementation of a particular paradigm should be adapted to the specific needs and requirements of the data processing context, in order to achieve an optimal result. The paper also highlights the limitations of this research and points to the growing popularity of functional programming due to advances in data science and machine learning.

# Running the tests

#### Minimum requirements

The minimum (tested) requirements include:
* bash (`v5.1.16`)
* NodeJs (`v18.12.1`)
* Typescript Compiler (`v4.9.4`)

## Steps

##### 1. Install the required dependencies
```bash
npm i
```

##### 2. Run the tests using the prepared script
```bash
./runner.sh <number_of_test_runs>
```
or run 10 iterations with
```bash
npm start
```

##### 3. The results (in CSV format) are available in the `test-results` directory
```bash
ls test-results -l
```

# Processed meteo data (output example)
```bash
node tests/FP_JS | tail +3 > example.json
```

# Visualize results (python3)

##### 1. Install dependencies
```bash
pip3 install -r requirements.txt
```

##### 2.1 Run visualizer.py
```bash
python3 visualizer.py test-results/<csv_file_name>.csv
```

##### 2.2 Run stats.py
```bash
python3 stats.py test-results/<csv_file_name>.csv
```

&copy; 2023. Tin Tomašić and Daniel Škrlac