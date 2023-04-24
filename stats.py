import numpy as np
import pandas as pd
import scikit_posthocs as sp
import sys
from scipy import stats


def calculate_shapiro(scripts):
    print('{:<10} {:<30} {:<10}'.format('Skripta', 'Shapiro-Wilk p vrijednost', 'Normalna distribucija'))
    print('{:<10} {:<30} {:<10}'.format('-------', '-------------------------', '---------------------'))
    for script, values in scripts.items():
        statistic, pvalue = stats.shapiro(values)
        isNormal = 'Da' if pvalue > 0.05 else 'Ne'
        print('{:<10} {:<30} {:<10}'.format(script, pvalue, isNormal))


def calculate_friedman(scripts):
    script_values = list(scripts.values())
    statistic, pvalue = stats.friedmanchisquare(*script_values)
    print('{:<30} {:<10}'.format('Friedman p vrijednost', 'Postoji razlika u barem jednoj grupi'))
    print('{:<30} {:<10}'.format('---------------------', '------------------------------------'))
    print('{:<30} {:<10}'.format(pvalue, 'Da' if pvalue < 0.05 else 'Ne'))
    print()

    # Conducts the Nemenyi post-hoc test
    print('Friedman post hoc')
    for index, key in enumerate(scripts.keys()):
        print('{} - {}'.format(index, key), end='; ')
    print()
    print(sp.posthoc_nemenyi_friedman(np.array(script_values).T))


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python3 stats.py csv_file_path')
        sys.exit()

    df = pd.read_csv(sys.argv[1])

    script_times = {
        'FP_JS': df[df['script'] == 'FP_JS.js']['time_taken'].tolist(),
        'FP_TS': df[df['script'] == 'FP_TS.js']['time_taken'].tolist(),
        'OOP_JS': df[df['script'] == 'OOP_JS.js']['time_taken'].tolist(),
        'OOP_TS': df[df['script'] == 'OOP_TS.js']['time_taken'].tolist()
    }

    script_memory_usages = {
        'FP_JS': df[df['script'] == 'FP_JS.js']['memory_usage'].tolist(),
        'FP_TS': df[df['script'] == 'FP_TS.js']['memory_usage'].tolist(),
        'OOP_JS': df[df['script'] == 'OOP_JS.js']['memory_usage'].tolist(),
        'OOP_TS': df[df['script'] == 'OOP_TS.js']['memory_usage'].tolist()
    }

    print('-- INICIJALNO --')
    print()

    print('Vremenska slozenost', '---', sep='\n')
    calculate_shapiro(script_times)
    print()
    calculate_friedman(script_times)

    print('', '--- --- --- --- --- --- ---', '', sep='\n')

    print('Prostorna slozenost', '---', sep='\n')
    calculate_shapiro(script_memory_usages)
    print()
    calculate_friedman(script_memory_usages)

    script_optimized_times = {
        'FP_JS': df[df['script'] == 'FP_JS.js']['time_taken'].tolist(),
        'OOP_JS': df[df['script'] == 'OOP_JS.js']['time_taken'].tolist(),
        'OOP_STRING_JS': df[df['script'] == 'OOP_STRING_JS.js']['time_taken'].tolist(),
    }

    script_optimized_memory_usages = {
        'FP_JS': df[df['script'] == 'FP_JS.js']['memory_usage'].tolist(),
        'OOP_JS': df[df['script'] == 'OOP_JS.js']['memory_usage'].tolist(),
        'OOP_STRING_JS': df[df['script'] == 'OOP_STRING_JS.js']['memory_usage'].tolist(),
    }

    print()
    print('-- OPTIMIZIRANO --')
    print()

    print('Vremenska slozenost', '---', sep='\n')
    calculate_shapiro(script_optimized_times)
    print()
    calculate_friedman(script_optimized_times)

    print('', '--- --- --- --- --- --- ---', '', sep='\n')

    print('Prostorna slozenost', '---', sep='\n')
    calculate_shapiro(script_optimized_memory_usages)
    print()
    calculate_friedman(script_optimized_memory_usages)
