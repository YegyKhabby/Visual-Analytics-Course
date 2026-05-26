# Code Change Q&A Rule

For every code task:

1. Make the smallest code change possible.
2. Before changing code, write a generic coding question.
3. Answer the question with the exact new code that will be used.
4. Show the original code block and the new code block.
5. Include only code that is different from the original template.
6. Do not include project-specific details in the question.
7. Do not document unchanged code.

## Current Changes

### Q1: How do I add a small preprocessing function for nested data?

Answer:
Use `map()` to create a simpler object with only the fields needed by the visualization.

Original:

```js
// No equivalent function in the original template.
```

New:

```js
export function preprocess_boardgames(games) {
  return games.map((game) => {
    return {
      title: game.title,
      maxplaytime: game.maxplaytime,
      rating: game.rating.rating,
    }
  })
}
```

### Q2: How do I change imports when switching from CSV parsing to JSON file reading?

Answer:
Keep the existing file-system import, remove the CSV parser import, and import the preprocessing helper.

Original:

```js
//import * as csv from "csv-parser"
import { parse } from "csv-parse";
import * as fs from "fs"
import { print_clientConnected, print_clientDisconnected } from "./static/utils.js"
// const preprocessing = require("./preprocessing.js")
import { is_below_max_weight, parse_numbers, calc_bmi } from "./preprocessing.js"
import { getExampleLDA } from "./druidExample.js";
```

New:

```js
import * as fs from "fs"
import { print_clientConnected, print_clientDisconnected } from "./static/utils.js"
import { preprocess_boardgames } from "./preprocessing.js"
```

### Q3: How do I point a server-side loader to a JSON file instead of another data file?

Answer:
Change the file name constant to the JSON file name.

Original:

```js
const file_path = "data/"
const file_name = "example_data.csv"
```

New:

```js
const file_path = "data/"
const file_name = "boardgames_100.json"
```

### Q4: How do I read and parse a local JSON file with an existing `fs` import?

Answer:
Use `fs.readFile`, parse the file content with `JSON.parse`, preprocess the parsed data, and emit the processed array.

Original:

```js
socket.on("getData", (obj) => {
  console.log(`Data request with properties ${JSON.stringify(obj)}...`)

  getExampleLDA(); //Example how to use druidjs. Just prints to the console for now


  let parameters = obj.parameters

  let jsonArray = []

  // This is reading the .csv file line by line
  // So we can filter it line by line
  // This saves a lot of RAM and processing time
  fs.createReadStream(file_path + file_name)
    .pipe(parse({ delimiter: ',', columns: true }))
    .on('data', function (row) {
      row = parse_numbers(row)
      row = calc_bmi(row)
      // Filtering the data according the given parameter
      // If it fits the parameter, add it to the result-array
      let row_meets_criteria = is_below_max_weight(parameters, row)
      if (row_meets_criteria) {
        jsonArray.push(row)
      }
    })
    .on("end", () => { //when all data is ready and processed, send it to the frontend of the socket
      socket.emit("freshData", {
        timestamp: new Date().getTime(),
        data: jsonArray,
        parameters: parameters,
      })
    })
  console.log(`freshData emitted`)
})
```

New:

```js
socket.on("getData", (obj) => {
  console.log(`Data request with properties ${JSON.stringify(obj)}...`)

  let parameters = obj.parameters

  fs.readFile(file_path + file_name, "utf8", (error, fileContent) => {
    if (error) {
      console.error(error)
      return
    }

    const rawGames = JSON.parse(fileContent)
    const games = preprocess_boardgames(rawGames)

    socket.emit("freshData", {
      timestamp: new Date().getTime(),
      data: games,
      parameters: parameters,
    })
    console.log(`freshData emitted`)
  })
})
```

### Q5: How do I remove an unused chart import after simplifying a frontend data handler?

Answer:
Remove the unused chart import and keep only the drawing function still called by the file.

Original:

```js
import {draw_barchart} from "./barchart.js"
import {draw_scatterplot} from "./scatterplot.js"
```

New:

```js
import {draw_scatterplot} from "./scatterplot.js"
```

### Q6: How do I simplify a frontend data object when only one chart is being drawn?

Answer:
Keep only the stored data property that is still used.

Original:

```js
let data = {
  barchart: undefined,
  scatterplot: undefined,
}
```

New:

```js
let data = {
  scatterplot: undefined,
}
```

### Q7: How do I pass received data directly to a single D3 drawing function?

Answer:
Store the received array and call the drawing function with it.

Original:

```js
let handleData = (payload) => {
  console.log(`Fresh data from Webserver:`)
  console.log(payload)
  // Parse the data into the needed format for the d3 visualizations (if necessary)
  // Here, the barchart shows two bars
  // So the data is preprocessed accordingly

  let count_too_much_weight = 0
  let count_good_weight = 0

  for (let person of payload.data) {
    if (person.bmi >= 25) {
      count_too_much_weight++
    } else {
      count_good_weight++
    }
  }

  data.barchart = [count_too_much_weight, count_good_weight]
  data.scatterplot = payload.data
  draw_barchart(data.barchart)
  draw_scatterplot(data.scatterplot)
}
```

New:

```js
let handleData = (payload) => {
  console.log(`Fresh data from Webserver:`)
  console.log(payload)
  data.scatterplot = payload.data
  draw_scatterplot(data.scatterplot)
}
```

### Q8: How do I update a console message after changing what a chart draws?

Answer:
Change only the message string and keep the data log.

Original:

```js
console.log("draw scatterplot")
console.log(data)
```

New:

```js
console.log("draw board-game scatterplot")
console.log(data)
```

### Q9: How do I change the x-axis field in a D3 scatterplot?

Answer:
Change the field used in the x-scale domain.

Original:

```js
const xScale = d3
  .scaleLinear()
  .domain([0, d3.max(data.map((d) => d.weight))])
  .range([0, width - margin.left - margin.right])
```

New:

```js
const xScale = d3
  .scaleLinear()
  .domain([0, d3.max(data.map((d) => d.maxplaytime))])
  .range([0, width - margin.left - margin.right])
```

### Q10: How do I change the y-axis field when the values are in a narrow numeric range?

Answer:
Use `d3.extent()` so the axis covers the actual minimum and maximum values.

Original:

```js
const yScale = d3
  .scaleLinear()
  .domain([0, d3.max(data.map((d) => d.height))])
  .range([height - margin.top - margin.bottom, 0])
```

New:

```js
const yScale = d3
  .scaleLinear()
  .domain(d3.extent(data.map((d) => d.rating)))
  .range([height - margin.top - margin.bottom, 0])
```

### Q11: How do I update circle positions in a D3 scatterplot after changing x and y fields?

Answer:
Keep the same circle style and only change the fields used for `cx` and `cy`.

Original:

```js
.attr("fill", "orange")
.attr("r", 5)
.attr("cx", (d) => margin.left + xScale(d.weight))
.attr("cy", (d) => yScale(d.height) + margin.top)
```

New:

```js
.attr("fill", "orange")
.attr("r", 5)
.attr("cx", (d) => margin.left + xScale(d.maxplaytime))
.attr("cy", (d) => yScale(d.rating) + margin.top)
```

### Q12: How do I update axis label text after changing data fields?

Answer:
Change only the text values bound to the label elements.

Original:

```js
let x_label = g_scatterplot.selectAll(".x_label").data(["Weight (kg)"])
```

New:

```js
let x_label = g_scatterplot.selectAll(".x_label").data(["Maximum playtime (minutes)"])
```

Original:

```js
let y_label = g_scatterplot.selectAll(".y_label").data(["Height (cm)"])
```

New:

```js
let y_label = g_scatterplot.selectAll(".y_label").data(["Rating"])
```

### Q13: How do I update static page text after adapting a template?

Answer:
Change only the visible text strings and keep the page structure the same.

Original:

```html
<title>BAREBONE</title>
```

New:

```html
<title>Visualization Dashboard</title>
```

Original:

```html
<div class="banner">Dashboard Template VISVA</div>
```

New:

```html
<div class="banner">Visualization Dashboard</div>
```

### Q14: How do I simplify a button click when no input parameter is needed?

Answer:
Call the request function with an empty object and remove the unused input-reading code.

Original:

```js
document.getElementById("load_data_button").onclick = () => {
  let max_weight = document.getElementById("max_weight").value
  if (!isNaN(max_weight)) {
    max_weight = parseFloat(max_weight)
  } else {
    max_weight = Infinity
  }
  requestData({ max_weight })
}
```

New:

```js
document.getElementById("load_data_button").onclick = () => {
  requestData({})
}
```

### Q15: How do I remove an unused input control from a template page?

Answer:
Remove the label and input elements, keeping the existing button for loading data.

Original:

```html
<label for="max_weight">Filter for weight below ___ kg</label>
<input
  type="text"
  id="max_weight"
  value="120"
  name="max_weight"
  placeholder="Max. weight..."
/>
<button id="load_data_button" class="button">Load data</button>
```

New:

```html
<button id="load_data_button" class="button">Load data</button>
```

### Q16: How do I remove an unused SVG chart container from a template page?

Answer:
Remove the unused chart container and keep the SVG container that is still drawn by the code.

Original:

```html
<div class="barchart">
  <svg class="svg_root" id="barchart_svg">
    <g id="g_x_axis_barchart"></g>
    <g id="g_y_axis_barchart"></g>
    <g id="g_barchart"></g>
  </svg>
</div>
<div class="scatterplot">
  <svg class="svg_root" id="scatterplot_svg">
    <g id="g_x_axis_scatterplot"></g>
    <g id="g_y_axis_scatterplot"></g>
    <g id="g_scatterplot"></g>
  </svg>
</div>
```

New:

```html
<div class="scatterplot">
  <svg class="svg_root" id="scatterplot_svg">
    <g id="g_x_axis_scatterplot"></g>
    <g id="g_y_axis_scatterplot"></g>
    <g id="g_scatterplot"></g>
  </svg>
</div>
```

### Q17: How do I change a CSS grid from two chart areas to one chart area?

Answer:
Change the grid to a single column and keep only the grid area that is still used.

Original:

```css
.visualizations {
  grid-area: visualizations;

  display: grid;
  grid-template-columns: 50% auto;
  grid-template-rows: auto;
  grid-template-areas: "barchart scatterplot";
}

.barchart {
  grid-area: barchart;
}

.scatterplot {
  grid-area: scatterplot;
}
```

### Q18: How do I make an SVG chart area readable when the surrounding container has no visible background?

Answer:
Add a light background color to the chart container.

Original:

```css
.visualizations {
  grid-area: visualizations;

  display: grid;
  grid-template-columns: auto;
  grid-template-rows: auto;
  grid-template-areas: "scatterplot";
}
```

New:

```css
.visualizations {
  grid-area: visualizations;
  background: white;

  display: grid;
  grid-template-columns: auto;
  grid-template-rows: auto;
  grid-template-areas: "scatterplot";
}
```

### Q19: How do I import an already-installed analysis library in a server-side JavaScript file?

Answer:
Add the library import next to the existing imports.

Original:

```js
import * as fs from "fs"
import { print_clientConnected, print_clientDisconnected } from "./static/utils.js"
import { preprocess_boardgames } from "./preprocessing.js"
```

New:

```js
import * as fs from "fs"
import * as druid from "@saehrimnir/druidjs"
import { print_clientConnected, print_clientDisconnected } from "./static/utils.js"
import { preprocess_boardgames } from "./preprocessing.js"
```

### Q20: How do I create grouped projection data from numeric records?

Answer:
Create class labels from thresholds, normalize the numeric input fields, run the projection, and return the projection coordinates.

Original:

```js
// No equivalent function in the original template.
```

New:

```js
function calculateLdaProjection(rawGames, parameters) {
  const rankLow = parseFloat(parameters.rankLow)
  const rankHigh = parseFloat(parameters.rankHigh)

  const games = rawGames.map((game) => {
    return {
      title: game.title,
      rank: game.rank,
      year: game.year,
      rating: game.rating.rating,
      reviews: game.rating.num_of_reviews,
      minage: game.minage,
      minplayers: game.minplayers,
      maxplayers: game.maxplayers,
      minplaytime: game.minplaytime,
      maxplaytime: game.maxplaytime,
      group:
        game.rank <= rankLow
          ? "top"
          : game.rank <= rankHigh
            ? "middle"
            : "lower",
    }
  })

  const featureNames = ["rating", "reviews", "year", "minage", "minplayers", "maxplayers", "minplaytime", "maxplaytime"]
  const ranges = {}

  for (const feature of featureNames) {
    const values = games.map((game) => game[feature])
    ranges[feature] = {
      min: Math.min(...values),
      max: Math.max(...values),
    }
  }

  const numberData = games.map((game) => {
    return featureNames.map((feature) => {
      const range = ranges[feature]
      return (game[feature] - range.min) / (range.max - range.min || 1)
    })
  })

  const classes = games.map((game) => game.group)
  const X = druid.Matrix.from(numberData)
  const result = new druid.LDA(X, { labels: classes, d: 2 }).transform()
  const coordinates = result.to2dArray

  return games.map((game, index) => {
    return {
      title: game.title,
      group: game.group,
      lda1: coordinates[index][0],
      lda2: coordinates[index][1],
    }
  })
}
```

### Q21: How do I reuse an existing data request event for two processing modes?

Answer:
After parsing the file, choose the processed data based on a request parameter, then emit the same response event as before.

Original:

```js
const rawGames = JSON.parse(fileContent)
const games = preprocess_boardgames(rawGames)
```

New:

```js
const rawGames = JSON.parse(fileContent)
const games =
  parameters.mode === "lda"
    ? calculateLdaProjection(rawGames, parameters)
    : preprocess_boardgames(rawGames)
```

### Q22: How do I add a small set of numeric controls to an existing side panel?

Answer:
Add two text inputs and one button with stable IDs.

Original:

```html
<button id="load_data_button" class="button">Load data</button>
```

New:

```html
<button id="load_data_button" class="button">Load data</button>
<label for="rank_low">Top rank cutoff</label>
<input
  type="text"
  id="rank_low"
  value="25"
  name="rank_low"
/>
<label for="rank_high">Middle rank cutoff</label>
<input
  type="text"
  id="rank_high"
  value="75"
  name="rank_high"
/>
<button id="load_lda_button" class="button">Run LDA</button>
```

### Q23: How do I send input values as parameters through an existing request function?

Answer:
Read the input values and pass them in the parameter object.

Original:

```js
document.getElementById("load_data_button").onclick = () => {
  requestData({})
}
```

New:

```js
document.getElementById("load_data_button").onclick = () => {
  requestData({})
}

document.getElementById("load_lda_button").onclick = () => {
  let rankLow = document.getElementById("rank_low").value
  let rankHigh = document.getElementById("rank_high").value
  requestData({ mode: "lda", rankLow, rankHigh })
}
```

### Q24: How do I let one scatterplot draw either original coordinates or projected coordinates?

Answer:
Check whether projection fields exist, then choose the corresponding fields for scales, positions, colors, and labels.

Original:

```js
let width = parseInt(svg.style("width"))
let height = parseInt(svg.style("height"))
```

New:

```js
let width = parseInt(svg.style("width"))
let height = parseInt(svg.style("height"))
const isLdaData = data.length > 0 && data[0].lda1 !== undefined
const groupColor = {
  top: "#2f80ed",
  middle: "#f2a93b",
  lower: "#c0392b",
}
```

Original:

```js
const xScale = d3
  .scaleLinear()
  .domain([0, d3.max(data.map((d) => d.maxplaytime))])
  .range([0, width - margin.left - margin.right])
```

New:

```js
const xScale = d3
  .scaleLinear()
  .domain(isLdaData
    ? d3.extent(data.map((d) => d.lda1))
    : [0, d3.max(data.map((d) => d.maxplaytime))])
  .range([0, width - margin.left - margin.right])
```

Original:

```js
const yScale = d3
  .scaleLinear()
  .domain(d3.extent(data.map((d) => d.rating)))
  .range([height - margin.top - margin.bottom, 0])
```

New:

```js
const yScale = d3
  .scaleLinear()
  .domain(d3.extent(data.map((d) => isLdaData ? d.lda2 : d.rating)))
  .range([height - margin.top - margin.bottom, 0])
```

Original:

```js
.attr("fill", "orange")
.attr("r", 5)
.attr("cx", (d) => margin.left + xScale(d.maxplaytime))
.attr("cy", (d) => yScale(d.rating) + margin.top)
```

New:

```js
.attr("fill", (d) => isLdaData ? groupColor[d.group] : "orange")
.attr("r", 5)
.attr("cx", (d) => margin.left + xScale(isLdaData ? d.lda1 : d.maxplaytime))
.attr("cy", (d) => yScale(isLdaData ? d.lda2 : d.rating) + margin.top)
```

Original:

```js
let x_label = g_scatterplot.selectAll(".x_label").data(["Maximum playtime (minutes)"])
```

New:

```js
let x_label = g_scatterplot.selectAll(".x_label").data([isLdaData ? "LDA 1" : "Maximum playtime (minutes)"])
```

Original:

```js
let y_label = g_scatterplot.selectAll(".y_label").data(["Rating"])
```

New:

```js
let y_label = g_scatterplot.selectAll(".y_label").data([isLdaData ? "LDA 2" : "Rating"])
```

### Q999: How do I add a simple legend to explain the colors geenrated for a projection?

Answer: Use a D3 enter/update/exit pattern to dynamically draw color legend entries when projection data properties exist.

Original:

```js
// No equivalent code in the original template.
```

New:

```js
  /**
   * Drawing the legend for LDA Data
   */
  // We only want to show the legend when displaying LDA data
  const legendData = isLdaData ? Object.keys(groupColor) : []

  let legend = g_scatterplot.selectAll(".legend-group").data(legendData)

  let legendEnter = legend
    .enter()
    .append("g")
    .attr("class", "legend-group")

  // Append color rectangles
  legendEnter
    .append("rect")
    .attr("class", "legend-rect")
    .attr("width", 15)
    .attr("height", 15)

  // Append text labels
  legendEnter
    .append("text")
    .attr("class", "legend-text")
    .attr("x", 25)
    .attr("y", 12)
    .style("font-size", "12px")
    .style("text-transform", "capitalize") // Capitalizes 'top', 'middle', 'lower'

  // Update the group positioning (placed in the top right corner)
  let legendMerge = legendEnter.merge(legend)
    .attr("transform", (d, i) => "translate(" + (width - margin.right - 60) + "," + (margin.top + i * 20) + ")")

  // Update colored rectangles
  legendMerge.select(".legend-rect")
    .attr("fill", (d) => groupColor[d])

  // Update text labels
  legendMerge.select(".legend-text")
    .text((d) => d)

  // Remove legend if no longer needed
  legend.exit().remove()
  ```

### Q998: How can I change the title dynamically by pulling the 2 variable used in the plooted data so that it would be a vs b if the variables were a and b?

Answer: Extract the variable keys from the initial data point received via the payload and use them to construct an updated title string before drawing the chart.

Original:

```js
document.getElementById("load_data_button").onclick = () => {
  requestData({})
}
```

New:

```js
document.getElementById("load_data_button").onclick = () => {
  document.getElementById("title").textContent = "Loading...";
  requestData({})
}
```

### Q997: How can I handle different visualization modes with a socket without creating a new one?

Answer: Keep the existing single socket structure. Assign a specific mode instruction to the request payload parameter block and handle title or UI modifications dynamically inside the central data handler function by checking that mode.

Original:

```js
let handleData = (payload) => {
  console.log(`Fresh data from Webserver:`)
  console.log(payload)
  data.scatterplot = payload.data
  draw_scatterplot(data.scatterplot)
}
```

New:

```js
let handleData = (payload) => {
  console.log(`Fresh data from Webserver:`)
  console.log(payload)
  data.scatterplot = payload.data

  // Check if we requested LDA mode
  if (payload.parameters && payload.parameters.mode === "lda") {
    // Handle the title for LDA Button
    document.getElementById("title").textContent = "LDA1 vs LDA2";
  } else {
    // Handle the title for the regular Data Button dynamically
    let samplePoint = data.scatterplot[0];
    
    // Extract keys and filter out 'title' (and maybe 'group' if it exists)
    let variables = Object.keys(samplePoint).filter(key => key !== 'title' && key !== 'group');
    if (variables.length >= 2) {
      document.getElementById("title").textContent = `${variables[0]} vs ${variables[1]}`;
    }
  }

  draw_scatterplot(data.scatterplot)
}
```

### Q996: How can I add collapsible checkbox lists with search function to the webserver to dynamically filter the JSON data?

Answer: Extract the unique values for the properties on the server and emit them upon initialization so the client can build collapsible checkbox lists with text search. Include the selected checkboxes in the standard data request, and filter the resulting dataset on the server before applying subsequent data transformations.

Original:

```js
// No equivalent code in the original template.
```

New:

```js
socket.on("getInitData", () => {
    fs.readFile(file_path + file_name, "utf8", (error, fileContent) => {
      if (error) {
        console.error(error)
        return
      }
      const rawGames = JSON.parse(fileContent)
      
      const categories = [...new Set(rawGames.flatMap(g => g.types.categories || []).map(c => c.name))].filter(Boolean).sort()
      const mechanics = [...new Set(rawGames.flatMap(g => g.types.mechanics || []).map(m => m.name))].filter(Boolean).sort()

      socket.emit("initData", { categories, mechanics })
    })
  })
```

Original:

```js
socket.on("getData", (obj) => {
    console.log(`Data request with properties ${JSON.stringify(obj)}...`)

    let parameters = obj.parameters

    fs.readFile(file_path + file_name, "utf8", (error, fileContent) => {
      if (error) {
        console.error(error)
        return
      }

      const rawGames = JSON.parse(fileContent)
      const games =
        parameters.mode === "lda"
          ? calculateLdaProjection(rawGames, parameters)
          : preprocess_boardgames(rawGames)

      socket.emit("freshData", {
        timestamp: new Date().getTime(),
        data: games,
        parameters: parameters,
      })
      console.log(`freshData emitted`)
    })
  })
```

New:

```js
socket.on("getData", (obj) => {
    console.log(`Data request with properties ${JSON.stringify(obj)}...`)

    let parameters = obj.parameters

    fs.readFile(file_path + file_name, "utf8", (error, fileContent) => {
      if (error) {
        console.error(error)
        return
      }

      let rawGames = JSON.parse(fileContent)

      // Filtering logic
      if (parameters.selectedCategories && parameters.selectedCategories.length > 0) {
        rawGames = rawGames.filter(game => {
          const gameCats = (game.types.categories || []).map(c => c.name);
          return parameters.selectedCategories.some(cat => gameCats.includes(cat));
        });
      }
      
      if (parameters.selectedMechanics && parameters.selectedMechanics.length > 0) {
        rawGames = rawGames.filter(game => {
          const gameMechs = (game.types.mechanics || []).map(m => m.name);
          return parameters.selectedMechanics.some(mech => gameMechs.includes(mech));
        });
      }

      let games = [];
      if (rawGames.length > 0) {
        games = parameters.mode === "lda"
            ? calculateLdaProjection(rawGames, parameters)
            : preprocess_boardgames(rawGames)
      }

      socket.emit("freshData", {
        timestamp: new Date().getTime(),
        data: games,
        parameters: parameters,
      })
      console.log(`freshData emitted`)
    })
  })
```

Original:

```js
// No equivalent code in the original template.
```

New:

```js
<details id="categories_details">
          <summary>Categories</summary>
          <input type="text" id="categories_search" placeholder="Search categories..." />
          <div id="categories_list"></div>
        </details>
        
        <details id="mechanics_details">
          <summary>Mechanics</summary>
          <input type="text" id="mechanics_search" placeholder="Search mechanics..." />
          <div id="mechanics_list"></div>
        </details>
```

Original:

```js
// No equivalent code in the original template.
```

New:

```js
#categories_list, #mechanics_list {
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid #ccc;
  background: white;
  padding: 5px;
  margin-top: 5px;
}

.checkbox-wrapper {
  margin: 2px 0;
  display: flex;
  align-items: center;
}

.checkbox-wrapper input {
  margin-right: 8px;
}

details {
  margin-top: 15px;
  cursor: pointer;
}
summary {
  font-weight: bold;
}
```

Original:

```js
socket.on("connect", () => {
  console.log("Connected to " + socketUrl + ".")
})
```

New:

```js
socket.on("connect", () => {
  console.log("Connected to " + socketUrl + ".")
  socket.emit("getInitData")
})
```

Original:

```js
// No equivalent code in the original template.
```

New:

```js
socket.on("initData", (payload) => {
  console.log("Received initial data:", payload);
  
  const setupCheckboxes = (items, listElementId) => {
    const listEl = document.getElementById(listElementId);
    listEl.innerHTML = '';
    items.forEach(item => {
      const wrapper = document.createElement('div');
      wrapper.className = 'checkbox-wrapper';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `${listElementId}_${item}`;
      checkbox.value = item;
      checkbox.className = `${listElementId}_checkbox`;
      
      const label = document.createElement('label');
      label.htmlFor = checkbox.id;
      label.textContent = item;
      
      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);
      listEl.appendChild(wrapper);
    });
  };

  setupCheckboxes(payload.categories, "categories_list");
  setupCheckboxes(payload.mechanics, "mechanics_list");
});

const setupSearch = (searchInputId, listElementId) => {
  document.getElementById(searchInputId).addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const listEl = document.getElementById(listElementId);
    const wrappers = listEl.getElementsByClassName("checkbox-wrapper");
    Array.from(wrappers).forEach(wrapper => {
      const labelText = wrapper.textContent.toLowerCase();
      if (labelText.includes(searchTerm)) {
        wrapper.style.display = "";
      } else {
        wrapper.style.display = "none";
      }
    });
  });
};

setupSearch("categories_search", "categories_list");
setupSearch("mechanics_search", "mechanics_list");
```

Original:

```js
let requestData = (parameters) => {
  console.log(`requesting data from webserver (every 2sec)`)

  socket.emit("getData", {
    parameters,
  })
}
```

New:

```js
let requestData = (parameters) => {
  console.log(`requesting data from webserver (every 2sec)`)

  const selectedCategories = Array.from(document.querySelectorAll('.categories_list_checkbox:checked')).map(cb => cb.value);
  const selectedMechanics = Array.from(document.querySelectorAll('.mechanics_list_checkbox:checked')).map(cb => cb.value);

  socket.emit("getData", {
    parameters: {
      ...parameters,
      selectedCategories,
      selectedMechanics
    }
  })
}
```
