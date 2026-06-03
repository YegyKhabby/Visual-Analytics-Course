import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler

df = pd.read_json("./va_1/data/refined.json")
# r_df = pd.json_normalize(df["rating"])
# df.drop(columns=["recommendations", "id", "rating", "types", "credit"], inplace=True)
# df[["rating", "num_of_reviews"]] = r_df[["rating", "num_of_reviews"]]
# print(df)
# df.to_json("refined.json", orient="records", indent=2)
# df_normalized = (r_df["num_of_reviews"] - r_df["num_of_reviews"].min()) / (r_df["num_of_reviews"].max() - r_df["num_of_reviews"].min()) * 10

def lregr(X, y): 
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    model = LinearRegression()
    model.fit(X_scaled, y)

    # Print analysis
    print("=" * 50)
    print("RANKING CALCULATION ANALYSIS")
    print("=" * 50)
    print(f"\nFeature weights (standardized coefficients):")
    print(f"  Rating coefficient:        {model.coef_[0]:.4f}")
    print(f"  # of Reviews coefficient:  {model.coef_[1]:.4f}")
    print(f"\nIntercept: {model.intercept_:.4f}")
    print(f"R² score: {model.score(X_scaled, y):.4f}")

    # Calculate relative importance
    abs_coefs = np.abs(model.coef_)
    importance = abs_coefs / abs_coefs.sum() * 100
    print(f"\nRelative importance:")
    print(f"  Rating:        {importance[0]:.1f}%")
    print(f"  # of Reviews:  {importance[1]:.1f}%")
    print("=" * 50)


def main():
    X = np.array([df["rating"], df["num_of_reviews"]]).T
    y = np.array(range(100))
    # lregr(X, y)
    print(df.columns)
    for i in df.columns:
        if i == "rank":
            continue
        plt.scatter(
            df["rank"], df[i],
            marker="o",
            facecolors="orange"
            )
        plt.xlabel("rank")
        plt.ylabel(i)
        plt.savefig(f"rank_{i}.png")
        plt.close()

if __name__ == "__main__":
    #main()
    pass

plt.scatter(
    np.log((df["maxplaytime"] + df["minplaytime"]) / 2), np.log(df["rating"]),
    s=df["num_of_reviews"] /500,
    marker="o",
    facecolors="orange",
    edgecolors="black"
    )
plt.xlabel("logged maxplaytime")
plt.ylabel("rating")
plt.savefig(f"logged_maxplaytime_rating.png")
plt.close()