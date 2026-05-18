# Task 2.1 Explanation

## Analysis Task

```text
(Explore, identify, correlation, maximum playtime and rating, Overall)
```

In sentence form:

```text
Explore and identify whether there is an overall correlation between maximum playtime and rating among the games in the dataset.
```

## Why This Is Interesting

Maximum playtime describes how long or large a game experience can become. Rating reflects user evaluation. Looking at both together helps explore whether longer games tend to be rated higher, lower, or whether there is no clear relationship.

This can also reveal outliers, such as games with very high maximum playtime but only moderate rating, or shorter games with high rating.

## Preprocessing

The original JSON data is nested. For the visualization, only the required fields were extracted:

```js
{
  title: game.title,
  maxplaytime: game.maxplaytime,
  rating: game.rating.rating,
}
```

This keeps the data simple for D3:

```text
maxplaytime -> x-axis
rating -> y-axis
title -> identifier for the game
```

## Visualization Choice

A scatterplot was chosen because the task is to explore correlation between two quantitative attributes.

```text
x-position = maximum playtime
y-position = rating
one circle = one game
```

Position is an effective visual channel for comparing numeric values, so the scatterplot supports the task directly.

## Basic Visual Elements

The visualization includes:

```text
x-axis
y-axis
axis labels
orange point marks
```

The x-axis label explains that playtime is measured in minutes. The y-axis label identifies the rating attribute. A neutral point color is used because no additional grouping is encoded in Task 2.1.

## Observed Pattern

The visualization shows that most games are clustered below roughly 200 minutes of maximum playtime, while one game has a much larger maximum playtime around 1000 minutes. This outlier stretches the x-axis and is important to keep because it is part of the real data.

There does not appear to be a strong linear relationship between maximum playtime and rating. Shorter games and longer games can both have high or lower ratings.

## VA Process Connection

This is a preceding visualization because it is used before applying LDA. It helps understand the raw data distribution and possible outliers before moving to a model-based visualization.
