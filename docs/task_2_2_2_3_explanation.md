# Task 2.2 and 2.3 Explanation

## LDA Question

Can a linear projection separate board games into rank-based groups using numeric game attributes?

The groups are defined from the game rank:

```text
rank <= 25      top-ranked games
rank 26-75      middle-ranked games
rank > 75       lower-ranked games
```

The LDA input features are numeric attributes such as rating, number of reviews, year, player counts, playtime values, and minimum age. Rank is used only to create the groups, so it is not used as an input feature for the LDA projection.

## Why This Choice

This is more suitable than categories or mechanics because one game can have many categories and many mechanics. That makes it harder to assign each game to one clear class. Rank is a single numeric value for each game, so each game can be placed into exactly one group.

The default thresholds are 25 and 75 because the dataset has 100 games. This creates reasonably balanced groups:

```text
top: 25 games
middle: 50 games
lower: 25 games
```

## How To Read The Visualization

The LDA plot uses:

```text
x-axis: LDA 1
y-axis: LDA 2
one dot: one game
color: rank group
```

The goal is not to prove that the groups are perfectly separated. The goal is to see whether the numeric attributes contain enough information for LDA to partly separate the rank groups.

In the current result, the groups overlap, but there is still a visible pattern. Top-ranked games tend to appear more in one area, lower-ranked games tend to appear more in another area, and middle-ranked games are mixed between them.

So the result can be described as:

```text
LDA partly separates the rank-based groups, but the separation is not perfect.
```

This is a reasonable visual analytics result because real data often has overlap. The useful finding is that rank groups show some structure in the numeric attributes, but they are not completely distinct.

## Interaction

The interaction lets the user change the two rank cutoffs before running LDA.

For example:

```text
Top rank cutoff = 25
Middle rank cutoff = 75
```

Changing these values changes which games belong to each class. After clicking Run LDA, the server recalculates the LDA projection using the new class labels, and the scatterplot updates.

This means the user can test whether different definitions of top, middle, and lower groups make the LDA separation stronger or weaker.

## Five-Tuple

```text
(Explore, compare, group separation, rank-based game groups using numeric attributes, Group)
```

Meaning:

```text
Goal: Explore
Action: Compare
Characteristic: Group separation
Target: Rank-based game groups using numeric attributes
Cardinality: Group
```
