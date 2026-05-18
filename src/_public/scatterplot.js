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
}
