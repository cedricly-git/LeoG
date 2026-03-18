from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns


ROOT = Path("/Users/cedric/Documents/LeoG")
CSV_PATH = ROOT / "Data" / "yahoo_finance_price_evolution_5y.csv"
OUTPUT_PATH = ROOT / "Data" / "price_histograms.png"


def main() -> None:
    df = pd.read_csv(CSV_PATH, usecols=["company", "close"])
    df = df.dropna(subset=["close"]).copy()

    sns.set_theme(style="whitegrid")
    g = sns.FacetGrid(
        df,
        col="company",
        col_wrap=5,
        sharex=False,
        sharey=False,
        height=2.4,
        aspect=1.2,
    )
    g.map_dataframe(
        sns.histplot,
        x="close",
        bins=24,
        color="#1f5aa6",
        edgecolor="white",
        linewidth=0.4,
    )
    g.set_axis_labels("Close Price", "Count")
    g.set_titles("{col_name}")
    g.figure.suptitle("5-Year Daily Close Price Histograms", fontsize=18, y=1.02)
    g.figure.set_size_inches(18, 14)
    g.tight_layout()
    g.savefig(OUTPUT_PATH, dpi=200, bbox_inches="tight")
    plt.close(g.figure)


if __name__ == "__main__":
    main()
