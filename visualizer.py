import sys
import pandas as pd
import matplotlib.pyplot as plt


def create_box_plots(attr, title, ylabel, excluded=[]):
    """
    Creates a customized box plot diagrams for a given script type and attribute
    """
    # Groups the DataFrame by the 'script' column and extract the given attribute column from each group
    data = [group[attr] for name, group in df.groupby('script') if name not in excluded]

    # Creates a boxplot using matplotlib
    fig, ax = plt.subplots(figsize=(8, 6))
    ax.boxplot(data)
    ax.grid(True)

    # Set the labels and title of the boxplot
    ax.set_xticklabels([name[:-3] for name, group in df.groupby('script').groups.items() if name not in excluded])
    ax.set_xlabel('Naziv skripte')
    ax.set_ylabel(ylabel)
    ax.set_title(title)


# Main driver
if __name__ == '__main__':
    # Loads the dataset into a Pandas DataFrame
    if len(sys.argv) < 2:
        print('Usage: python3 visualizer.py csv_file_path')
        sys.exit()

    df = pd.read_csv(sys.argv[1])
    # Converts B to MB
    df['memory_usage'] = df['memory_usage'] / (1024 * 1024)

    # Initial - time taken and memory usage boxplot diagrams
    create_box_plots(
        attr='time_taken',
        title='Vremena izvođenja testnih skripta',
        ylabel='Vrijeme izvođenja (ms)',
        excluded=['OOP_STRING_JS.js', 'FP_TS.js', 'FP_JS.js'])
    create_box_plots(
        attr='memory_usage',
        title='Zauzeća radne memorije testnih skripta',
        ylabel='Zauzeće radne memorije (MB)',
        excluded=['OOP_STRING_JS.js', 'FP_TS.js', 'FP_JS.js'])

    # Optimized - time taken and memory usage boxplot diagrams
    create_box_plots(
        attr='time_taken',
        title='Vremena izvođenja FP, OOP i OOP (bez Date) JS testnih skripta',
        ylabel='Vrijeme izvođenja (ms)',
        excluded=['FP_TS.js', 'OOP_TS.js'])
    create_box_plots(
        attr='memory_usage',
        title='Zauzeća radne memorije FP, OOP i OOP (bez Date) JS testnih skripta',
        ylabel='Zauzeće radne memorije (MB)',
        excluded=['FP_TS.js', 'OOP_TS.js'])

    # Displays the boxplot diagrams
    plt.show()