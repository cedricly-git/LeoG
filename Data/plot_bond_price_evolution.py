from pathlib import Path

import matplotlib.dates as mdates
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns


ROOT = Path("/Users/cedric/Documents/LeoG")
CSV_PATH = ROOT / "Data" / "yahoo_finance_bonds_and_stocks_5y.csv"
OUTPUT_PATH = ROOT / "Data" / "bond_price_evolution_5y.png"


def main() -> None:
    df = pd.read_csv(CSV_PATH, usecols=["date", "request_label", "asset_class", "close"])
    df = df[df["asset_class"].str.startswith("bond")].dropna(subset=["close"]).copy()
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values(["request_label", "date"])

    sns.set_theme(style="whitegrid")
    g = sns.FacetGrid(
        df,
        col="request_label",
        col_wrap=3,
        sharex=False,
        sharey=False,
        height=3.0,
        aspect=1.4,
    )
    g.map_dataframe(
        sns.lineplot,
        x="date",
        y="close",
        color="#1f5aa6",
        linewidth=1.2,
    )
    g.map_dataframe(
        sns.scatterplot,
        x="date",
        y="close",
        color="#1f5aa6",
        s=10,
        linewidth=0,
    )
    g.set_axis_labels("Date", "Close")
    g.set_titles("{col_name}")
    for ax in g.axes.flat:
        ax.xaxis.set_major_locator(mdates.YearLocator())
        ax.xaxis.set_major_formatter(mdates.DateFormatter("%Y"))
        ax.tick_params(axis="x", rotation=45)
    g.figure.suptitle("5-Year Bond Price Evolution", fontsize=18, y=1.02)
    g.figure.set_size_inches(15, 10)
    g.tight_layout()
    g.savefig(OUTPUT_PATH, dpi=200, bbox_inches="tight")
    plt.close(g.figure)


if __name__ == "__main__":
    main()
