import * as d3 from "d3"

export function draw_scatterplot(data) {
  console.log("draw board-game scatterplot")
  console.log(data)

  /**
   * Margins of the visualization.
   */
  const margin = {
    top: 50,
    bottom: 70,
    left: 50,
    right: 160,
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
  const tooltip = d3.select("#tooltip")
  const isLdaData = data.length > 0 && data[0].lda1 !== undefined

  if (data.length === 0) {
    g_scatterplot.selectAll(".scatterplot_circle").remove()
    g_scatterplot.selectAll(".x_label").remove()
    g_scatterplot.selectAll(".y_label").remove()
    g_scatterplot.selectAll(".legend_item").remove()
    return
  }
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
  const yExtent = d3.extent(data.map((d) => isLdaData ? d.lda2 : d.rating))
  if (yExtent[0] === yExtent[1]) { yExtent[0] -= 0.5; yExtent[1] += 0.5 }
  const yScale = d3
    .scaleLinear()
    .domain(yExtent)
    .range([height - margin.top - margin.bottom, 0])

  const rScale = d3.scaleSqrt()
    .domain(d3.extent(data.map((d) => d.num_of_reviews || 0)))
    .range([5, 18])

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
    .attr("fill-opacity", isLdaData ? 0.85 : 0.7)
    .attr("stroke", "black")
    .attr("stroke-width", 1.5)
    .attr("r", (d) => isLdaData ? 5 : rScale(d.num_of_reviews))
    .attr("cx", (d) => margin.left + xScale(isLdaData ? d.lda1 : d.maxplaytime))
    .attr("cy", (d) => yScale(isLdaData ? d.lda2 : d.rating) + margin.top)
    .on("mouseover", (event, d) => {
      const lines = isLdaData
        ? [
            `<strong>${d.title}</strong>`,
            `LDA 1: ${d.lda1.toFixed(3)}`,
            `LDA 2: ${d.lda2.toFixed(3)}`,
            `Rating: ${d.rating.toFixed(2)}`,
            `Max playtime: ${d.maxplaytime} min`,
            `Reviews: ${d.num_of_reviews.toLocaleString()}`,
          ]
        : [
            `<strong>${d.title}</strong>`,
            `Rating: ${d.rating.toFixed(2)}`,
            `Max playtime: ${d.maxplaytime} min`,
            `Reviews: ${d.num_of_reviews.toLocaleString()}`,
          ]
      tooltip.style("display", "block").html(lines.join("<br/>"))
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY - 28) + "px")
    })
    .on("mouseout", () => {
      tooltip.style("display", "none")
    })

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
    .attr("y", height - 15)
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

  // sort so small circles render on top of large ones
  if (!isLdaData) {
    g_scatterplot.selectAll(".scatterplot_circle")
      .sort((a, b) => (b.num_of_reviews || 0) - (a.num_of_reviews || 0))
  }

  // legend
  g_scatterplot.selectAll(".legend_item").remove()

  if (!isLdaData) {
    const reviewExtent = d3.extent(data.map((d) => d.num_of_reviews || 0))
    const midReviews = Math.round((reviewExtent[0] + reviewExtent[1]) / 2)
    const sizeLegendData = [
      { label: `${reviewExtent[0]} reviews`, r: rScale(reviewExtent[0]) },
      { label: `${midReviews} reviews`, r: rScale(midReviews) },
      { label: `${reviewExtent[1]} reviews`, r: rScale(reviewExtent[1]) },
    ]

    const legendX = width - margin.right + 16
    let rowY = margin.top + 10

    g_scatterplot.append("text")
      .attr("class", "legend_item")
      .attr("x", legendX)
      .attr("y", rowY)
      .style("font-size", "11px")
      .style("font-weight", "bold")
      .text("# reviews")

    rowY += 18
    sizeLegendData.forEach((entry) => {
      const g = g_scatterplot.append("g")
        .attr("class", "legend_item")
        .attr("transform", `translate(${legendX + entry.r}, ${rowY + entry.r})`)

      g.append("circle")
        .attr("r", entry.r)
        .attr("fill", "orange")
        .attr("opacity", 0.6)

      g.append("text")
        .attr("x", entry.r + 6)
        .attr("y", 4)
        .style("font-size", "10px")
        .text(entry.label)

      rowY += entry.r * 2 + 8
    })
  }

  if (isLdaData) {
    const legendData = [
      { label: "Top", color: groupColor.top },
      { label: "Middle", color: groupColor.middle },
      { label: "Lower", color: groupColor.lower },
    ]

    const legendX = width - margin.right + 16
    const legendY = margin.top + 10

    legendData.forEach((entry, i) => {
      const g = g_scatterplot.append("g")
        .attr("class", "legend_item")
        .attr("transform", `translate(${legendX}, ${legendY + i * 22})`)

      g.append("circle")
        .attr("r", 6)
        .attr("fill", entry.color)

      g.append("text")
        .attr("x", 16)
        .attr("y", 5)
        .text(entry.label)
        .style("font-size", "12px")
    })
  }
}
