"""Plot actual benchmark summaries; no simulation data is fabricated here."""
import hashlib
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

root = Path(__file__).resolve().parents[1]
source = root / "docs/results/benchmark.json"
benchmark = json.loads(source.read_text())
policies = ["gossip", "frontier", "random"]
labels = ["Neighbor gossip", "Independent frontier", "Random walk"]
colours = ["#3c6656", "#596f80", "#b9c0bc"]
scenarios = [("warehouse", "Warehouse aisles"), ("concave", "Concave courtyard"), ("rooms", "Connected rooms")]
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10, "axes.spines.top": False, "axes.spines.right": False, "axes.spines.left": False, "axes.spines.bottom": False})
figure, axes = plt.subplots(1, 3, figsize=(12, 4.8), sharey=True)
for axis, (scenario, title) in zip(axes, scenarios):
    rows = [next(row for row in benchmark["summary"] if row["scenario"] == scenario and row["policy"] == policy) for policy in policies]
    means = [row["visitedMean"] * 100 for row in rows]
    errors = [row["visitedSampleSd"] * 100 for row in rows]
    axis.set_axisbelow(True)
    axis.grid(axis="y", color="#e3e7e4", linewidth=0.7)
    axis.bar(range(3), means, yerr=errors, color=colours, width=0.58, capsize=4, error_kw={"linewidth": 1, "color": "#293436"})
    axis.axhline(95, color="#8b9690", linewidth=0.8, linestyle=(0, (3, 3)))
    for i, (value, error, row) in enumerate(zip(means, errors, rows)):
        axis.text(i, min(value + error + 3, 108), f"{value:.1f}%", ha="center", va="bottom", fontsize=10)
        axis.text(i, 3, f'{row["targetReached"]}/10\ntargets', ha="center", va="bottom", fontsize=8, color="white" if i < 2 else "#202c2f")
    axis.set_xticks(range(3), ["Gossip", "Frontier", "Random"])
    axis.tick_params(axis="both", length=0, pad=8)
    axis.set_title(title, loc="left", pad=18, fontsize=11)
    axis.set_ylim(0, 113)
    axis.set_yticks([0, 25, 50, 75, 100])
axes[0].set_ylabel("Terminal visited coverage (%)", labelpad=12)
figure.suptitle("Local map sharing in a bounded exploration simulation", x=0.07, ha="left", fontsize=15, y=0.98)
figure.text(0.07, 0.02, "10 seeds per policy and map · 6 robots · maximum 400 ticks · stops at 95% visited target\nError bars: sample standard deviation. Dashed line: target. Counts show runs that reached it.", fontsize=9, color="#52605b", linespacing=1.5)
figure.subplots_adjust(left=0.075, right=0.98, top=0.77, bottom=0.22, wspace=0.22)
figure.savefig(root / "docs/results/coverage.png", dpi=160, facecolor="white")
plt.close(figure)
metadata = {"benchmarkSha256": hashlib.sha256(source.read_bytes()).hexdigest(), "matplotlibVersion": matplotlib.__version__, "source": "benchmark.json", "figure": "coverage.png", "description": "Actual terminal coverage means and sample standard deviations; no generated imagery."}
(root / "docs/results/figures-metadata.json").write_text(json.dumps(metadata, indent=2) + "\n")
print("Generated coverage.png from 90 actual runs; recorded benchmark SHA-256.")
