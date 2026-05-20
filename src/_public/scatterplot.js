import * as d3 from "d3"

export function draw_scatterplot(data) {
  console.log("draw board-game scatterplot")
  console.log(data)

  /**
   * Margins of the visualization.
   */
  const margin = {
    top: 50,
    bottom: 50,
    left: 50,
    right: 50,
  }

  /**
   * Selection of svg and groups to be drawn on.
   */
  let svg = d3.select("#scatterplot_svg")
  let g_scatterplot = d3.select("#g_scatterplot")
  let g_x_axis_scatterplot = d3.select("#g_x_axis_scatterplot")
  let g_y_axis_scatterplot = d3.select("#g_y_axis_scatterplot")

  /**
   * Getting the current width/height of the whole drawing pane.
   */
  let width = parseInt(svg.style("width"))
  let height = parseInt(svg.style("height"))
  const isLdaData = data.length > 0 && data[0].lda1 !== undefined
  const groupColor = {
    top: "#2f80ed",
    middle: "#f2a93b",
    lower: "#c0392b",
  }

  /**
   * Scale function for the x-axis
   */
  const xScale = d3
    .scaleLinear()
    .domain(isLdaData
      ? d3.extent(data.map((d) => d.lda1))
      : [0, d3.max(data.map((d) => d.maxplaytime))])
    .range([0, width - margin.left - margin.right])

  /**
   * Scale unction for the y-axis
   */
  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(data.map((d) => isLdaData ? d.lda2 : d.rating)))
    .range([height - margin.top - margin.bottom, 0])

  /**
   * Drawing the data itself as circles
   */
  let scatterplot_circle = g_scatterplot
    .selectAll(".scatterplot_circle")
    .data(data)

  scatterplot_circle
    .enter()
    .append("circle")
    .attr("class", "scatterplot_circle")
    .merge(scatterplot_circle)
    .attr("fill", (d) => isLdaData ? groupColor[d.group] : "orange")
    .attr("r", 5)
    .attr("cx", (d) => margin.left + xScale(isLdaData ? d.lda1 : d.maxplaytime))
    .attr("cy", (d) => yScale(isLdaData ? d.lda2 : d.rating) + margin.top)

  scatterplot_circle.exit().remove()

  /**
   * Drawing the x-axis for the visualized data
   */
  let x_axis = d3.axisBottom(xScale)

  g_x_axis_scatterplot
    .attr(
      "transform",
      "translate(" + margin.left + "," + (height - margin.bottom) + ")"
    )
    .call(x_axis)

  /**
   * Drawing the y-axis for the visualized data
   */
  let y_axis = d3.axisLeft(yScale)

  g_y_axis_scatterplot
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(y_axis)

  /**
   * Drawing the x-axis label
   */
  let x_label = g_scatterplot.selectAll(".x_label").data([isLdaData ? "LDA 1" : "Maximum playtime (minutes)"])

  x_label
    .enter()
    .append("text")
    .attr("class", "x_label")
    .merge(x_label)
    .attr("x", width / 2)
    .attr("y", height - margin.bottom / 4)
    .attr("text-anchor", "middle")
    .text((d) => d)

  x_label.exit().remove()

  /**
   * Drawing the y-axis label
   */
  let y_label = g_scatterplot.selectAll(".y_label").data([isLdaData ? "LDA 2" : "Rating"])

  y_label
    .enter()
    .append("text")
    .attr("class", "y_label")
    .merge(y_label)
    .attr("x", -height / 2)
    .attr("y", margin.left / 4)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text((d) => d)

  y_label.exit().remove()

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


}
