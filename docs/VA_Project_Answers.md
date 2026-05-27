# VA Project 1 — Answers to Project Questions

> Use this during presentation prep. All 15 example questions from the project PDF are answered here.

---

## Task 2.1 — Analysis Task

**5-tuple**: (Explore, Identify, Correlate, Several, Overall)

**One sentence**: "As a board-game developer, I want to explore the complete dataset to identify whether there is a correlation between maximum playtime, average rating, and number of reviews across all board games."

**Why interesting for a board-game developer**:
A developer deciding on a game's playtime needs to know whether longer games tend to receive better ratings, and whether the most-reviewed games cluster at a particular playtime range. If longer games consistently score higher, that justifies investing in complex, long designs. If there is no correlation, shorter accessible games may be equally viable. The number of reviews is also a proxy for commercial reach — a developer wants to see if highly-rated games are also commercially popular.

---

## Task 2.2 — Analysis Task

**5-tuple**: (Explore, Compare, Group, Several, Overall)

**One sentence**: "As a board-game developer, I want to explore the complete dataset to compare whether the top-ranked, middle-ranked, and lower-ranked groups of games form distinct clusters based on their design characteristics."

**Why interesting for a board-game developer**:
If top-ranked games cluster separately from lower-ranked ones, it means there are systematic design differences between successful and unsuccessful games. A developer could use this to understand what design profile is associated with highly-ranked games — do they target older players? Are they longer? Do they allow more players?

**Why LDA specifically**:
LDA is supervised — it finds the projection that maximally separates the labeled groups. This directly serves a Compare + Group task. An unsupervised method like PCA would not guarantee group separation. If groups overlap in the LDA space, even LDA cannot find a separating projection, which is itself an informative result.

---

## Task 2.1 — Visualization Argumentation

**Visualization**: Scatterplot — x: maxplaytime, y: rating, circle size: num_of_reviews

- Scatterplot is the best chart type for showing correlation between two quantitative variables — position is the most accurate visual channel.
- Circle size adds a third attribute (num_of_reviews) without a second chart — supports "Several" in the 5-tuple.
- All 100 games shown at once — supports "Overall" cardinality.
- A visible trend or spread in the point cloud directly answers the "Correlate" characteristic.

**Why scaleSqrt**:
We perceive circles by area, not radius. Area = π·r², so a linear radius scale means a 4× data value appears 16× visually. scaleSqrt makes area grow linearly with data — honest size encoding.

**Included**: axis labels, d3.extent for y-axis (ratings are in a narrow range ~6–9, so starting from 0 wastes most of the chart height).

**Excluded**: color (no categories in raw view — would add noise), grid lines (task is pattern detection not precise reading), bar chart from template (not needed).

---

## Task 2.2 — Visualization Argumentation

**Visualization**: LDA scatterplot — x: LDA1, y: LDA2, color: group (top/middle/lower), tooltip on hover

- LDA axes are computed to maximally separate the three groups — so spatial position directly encodes group separability, which is exactly what Compare + Group requires.
- Color distinguishes the three groups pre-attentively — viewer sees group structure instantly.
- Tooltip shows game title on hover so individual games can be identified.
- Color legend explains what each color means.
- All 100 games shown — Overall cardinality.

**Included**: color legend (needed — without it the groups are unidentifiable), tooltip (needed — without it no individual game can be named).

**Excluded**: circle size in LDA view (no meaningful numeric attribute to encode — would add visual noise), raw axis names (LDA axes are abstract combinations of all features, not a single named attribute).

---

## Task 2.3 — Interaction Argumentation

**Interaction**: Two rank threshold inputs (default 25 / 75) + "Run LDA" button

**What it does**: User changes the boundary between top / middle / lower groups and reruns LDA with the new class definitions.

**Why this parameter**: LDA is supervised — the group labels are the most important parameter. Changing them changes what the algorithm tries to separate. For example, setting rankLow to 10 asks "what makes the absolute elite games different?" while setting it to 50 asks "what makes the top half different from the bottom half?"

**Low interaction cost**: 2 text edits (or keep defaults) + 1 click. Result appears instantly in the same visualization. No page reload.

---

## Reflection on Potential Improvements

- **Feature importance**: the LDA axes are currently abstract (LDA 1, LDA 2) — showing which original features contribute most to each axis would help interpretation
- **Filtering**: a slider to filter by year or playtime would let the developer focus on a subset of games
- **Brushing/linking**: selecting games in the raw scatterplot could highlight the same games in the LDA view
- **More data**: the dataset has 100 games; with the full BGG dataset patterns would be more robust
- **Game name labels**: tooltip shows title on hover but it could also label the most extreme outliers permanently

---

## All 15 Example Questions from the Project PDF

### Q1: When setting up the environment, was there anything that confused you at first?

The template was built around streaming a CSV file line by line using `createReadStream`. Switching to reading a JSON file all at once with `fs.readFile` and `JSON.parse` required understanding how the asynchronous callback structure works in Node.js. Also, the boardgame data has nested JSON objects (for example `game.rating.rating` and `game.rating.num_of_reviews`) which required careful dot-notation access when flattening the data.

---

### Q2: What did you initially notice in the data when exploring it?

- Ratings are in a very narrow range (roughly 7–9), not 0–10 as one might expect — this is why we use `d3.extent` for the y-axis instead of starting from zero.
- The number of reviews varies enormously between games — some have tens of thousands, others only a few hundred. This motivated encoding num_of_reviews as circle size.
- All games are already top-100 ranked on BGG, so the dataset only covers well-regarded games. This is a limitation — there is no "bad" game baseline.
- Some games have extremely long playtimes (several hundred minutes) — these appear as outliers on the far right of the x-axis.

---

### Q3: Why did you preprocess the data in this way?

Two kinds of preprocessing were done:

**For the raw scatterplot**: We flattened the nested JSON into a simple object with only the fields needed (title, maxplaytime, rating, num_of_reviews). This is what D3 expects — a flat array of objects.

**For LDA**: We excluded `rating` and `reviews` from the feature set, even though they are in the data. The reason is that the groups are defined by BGG rank, and rank is derived from rating and reviews. Including them would be circular reasoning — LDA would simply learn "top-ranked games have higher ratings" which is true by definition, not by design characteristics. We only used mechanical/design features: year, minage, minplayers, maxplayers, minplaytime, maxplaytime. We also normalized all features to [0,1] so LDA is not biased by differences in scale (year ~2020 vs. minplayers ~2).

---

### Q4: How have you managed this particularity in the data?

Two particularities required attention:

1. **Narrow rating range**: used `d3.extent` for the y-axis domain so the axis stretches from the actual minimum to maximum rating, making differences visible. Starting from zero would compress all points into the top 20% of the chart.

2. **Circular features in LDA**: explicitly removed rating and reviews from the LDA feature list to avoid circular reasoning (see Q3 above).

---

### Q5: Can you explain why you have chosen this analysis task to explore?

**Task 2.1**: A board-game developer's core decision is how to design a game — including how long it should be. The question "do longer games tend to be rated higher and more widely played?" has a direct business implication. If yes, investing in a complex long game is justified. If no, a shorter accessible game is equally viable. This is a genuine question a developer would want to answer before starting a project.

**Task 2.2**: A developer wants to know whether successful games (top-ranked) have systematically different design characteristics from less successful ones. If they form a distinct cluster in LDA space, there is a learnable design profile for success. This goes beyond what the raw scatterplot can show — LDA finds the optimal projection for group separation.

---

### Q6: How is the analysis task supported?

**Task 2.1**: The scatterplot encodes all three attributes of the task simultaneously — playtime on x, rating on y, and review count as circle size. A visible trend or cluster in the point cloud directly answers the correlation question. No additional interaction is needed.

**Task 2.2**: The LDA scatterplot colors each game by its rank group. If the color clusters are spatially separated, the design features (year, players, playtime, age) genuinely distinguish the groups. The interaction (Task 2.3) lets the user change the group boundaries and rerun LDA to test whether the separation holds under different definitions of "top".

---

### Q7: Why have you chosen this type of visualization for this analysis task?

**Task 2.1**: Scatterplot is the optimal chart for identifying correlation between two quantitative variables — position is the most accurate visual channel. Adding circle size encodes a third variable without requiring a second chart type. No other single chart could show three quantitative attributes as clearly.

**Task 2.2**: LDA produces 2D coordinates per data point, so a scatterplot is the natural and direct representation of LDA output. Color encoding pre-attentively distinguishes groups, allowing the viewer to assess cluster separation without searching or counting.

---

### Q8: Why is this basic element (not) included?

**Legend — included in LDA view**: Without a legend, the three group colors are uninterpretable. A viewer cannot know that blue = top, orange = middle, red = lower.

**Legend — not in raw view**: There are no groups in the raw view, so a legend would show nothing meaningful.

**Tooltip — included in both views**: The scatterplot shows 100 overlapping circles with no labels. Without a tooltip, no individual game can be identified. The tooltip shows the game title on hover.

**Color — not used in raw view**: There are no categories in the raw data to distinguish. Using color without a meaningful grouping would add visual noise.

**Grid lines — excluded**: The task is pattern detection (is there a trend?) not precise value reading. Grid lines would add visual clutter without helping the analysis task.

**Bar chart from template — removed**: The bar chart visualized BMI data which is irrelevant to our dataset. Removing it gives the scatterplot the full display area.

---

### Q9: Did you find any interesting insights using your visualization?

**From the raw scatterplot**: Games with longer playtimes (300+ minutes, like Twilight Imperium) tend to cluster at the high-rating end. However, the most-reviewed games are not necessarily the highest-rated — some mid-range playtime games have very large circles (many reviews) while having similar ratings to shorter games.

**From the LDA view**: The top-ranked group shows some spatial separation from the lower-ranked group, particularly along LDA dimension 1. However, there is notable overlap between middle and lower groups, suggesting that the six design features alone do not fully explain rank differences. This makes sense — game quality likely depends heavily on factors not in our feature set (mechanics, theme, complexity).

---

### Q10: What changes did you make to the original visual design?

- Changed x-axis from `weight` to `maxplaytime`
- Changed y-axis from `height` to `rating`, using `d3.extent` instead of `[0, max]`
- Added circle size encoding using `d3.scaleSqrt` mapped to `num_of_reviews`
- Added LDA mode: the same scatterplot function handles both raw and LDA data, switching axes, colors, labels, and legend automatically
- Added rank threshold inputs and "Run LDA" button
- Added color legend for LDA group view
- Added tooltip showing game title on hover
- Updated color scheme (dark blue header, light gray sidepanel, orange hover accent)
- Removed the bar chart and its container
- Changed data loading from CSV streaming to JSON file reading

---

### Q11: What was the most difficult part to design?

The most difficult part was avoiding circular reasoning in the LDA feature selection. It is not obvious at first that using rating and reviews as LDA features would be invalid — they are in the data and seem relevant. Understanding that rank is derived from rating and reviews, and therefore using them to predict rank groups is circular, required careful thinking about what LDA is actually doing. Making one scatterplot function handle both raw and LDA data modes without duplicating code was also a challenge.

---

### Q12: Given more time, what would you add?

- **Feature loading visualization**: show which original features contribute most to LDA dimension 1 and 2, so the axes become interpretable
- **Brushing / linked selection**: selecting a set of games in the raw scatterplot would highlight the same games in the LDA view, connecting the two analyses
- **Year filter**: a slider to restrict the dataset to games published in a certain range
- **More features**: including game mechanics (one-hot encoded) as LDA features, similar to what a previous group did, to see if mechanics better explain rank groups than design parameters alone

---

### Q13: If you did the exercise again, what would you have done differently?

We would have explored the data more carefully before designing the visualizations — specifically looking at the distribution of each field (min, max, outliers) before choosing encodings. We discovered during development that ratings are in a narrow range (7–9) and had to switch the y-axis domain mid-way. Starting with a data exploration step would have avoided that. We would also have considered using game mechanics as LDA features from the start, since they have a more direct relationship to game quality than design parameters.

---

### Q14: What would you have liked to incorporate into your design from the other presentations seen so far?

A tooltip that shows not just the game title but also the key attributes (like mechanics or category) would have made the LDA view much more useful for identifying why specific games are where they are in the projection. We saw this approach in a previous year's presentation and it significantly improved the interpretability of the scatterplot.

---

### Q15: Are there questions that cannot be asked with your visualizations, but can be answered with the data itself?

Yes — several:

- **Which game mechanics are associated with higher ratings?** The `types.mechanics` field contains this information but we did not use it.
- **Are games of certain categories (strategy, family, etc.) rated differently?** The `types.categories` field exists but is unused.
- **Which games are most similar in terms of recommendations?** The `recommendations` field lists games that are often liked together — this could support a network visualization, but it was excluded per the project instructions.
- **How have game ratings changed over time?** The `year` field is in the data and in the LDA features, but neither visualization shows time as a primary axis.
