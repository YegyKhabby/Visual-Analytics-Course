import * as d3 from "d3"

let zoomState = {
  dataRef: null,
  xDomain: null,
  yDomain: null,
}

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
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

  if (data.length === 0) {
    g_scatterplot.selectAll(".scatterplot_circle").remove()
    g_scatterplot.selectAll(".x_label").remove()
    g_scatterplot.selectAll(".y_label").remove()
    g_scatterplot.selectAll(".legend_item").remove()
    g_scatterplot.selectAll(".zoom_layer").remove()
    zoomState = {
      dataRef: null,
      xDomain: null,
      yDomain: null,
    }
    svg.on(".scatterplotZoom", null)
    d3.select(window).on(".scatterplotZoom", null)
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
  const fullXDomain = isLdaData
    ? d3.extent(data.map((d) => d.lda1))
    : [0, d3.max(data.map((d) => d.maxplaytime))]

  const xScale = d3
    .scaleLinear()
    .domain(fullXDomain)
    .range([0, plotWidth])

  /**
   * Scale function for the y-axis
   */
  let fullYDomain = isLdaData
    ? d3.extent(data.map((d) => d.lda2))
    : [1, 10]
  if (isLdaData && fullYDomain[0] === fullYDomain[1]) { fullYDomain[0] -= 0.5; fullYDomain[1] += 0.5 }
  const yScale = d3
    .scaleLinear()
    .domain(fullYDomain)
    .range([plotHeight, 0])

  if (zoomState.dataRef !== data) {
    zoomState = {
      dataRef: data,
      xDomain: null,
      yDomain: null,
    }
  }

  if (zoomState.xDomain && zoomState.yDomain) {
    xScale.domain(zoomState.xDomain)
    yScale.domain(zoomState.yDomain)
  }

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
    .attr("r", (d) => {
      const uniform = document.getElementById("uniform_size_toggle")?.checked
      return uniform ? 4 : (isLdaData ? 5 : rScale(d.num_of_reviews))
    })
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

  const uniformSize = document.getElementById("uniform_size_toggle")?.checked
  if (!isLdaData && !uniformSize) {
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

  const zoomRect = g_scatterplot.selectAll(".zoom_layer")
    .data([null])
    .join("rect")
    .attr("class", "zoom_layer")
    .attr("fill", "#284b63")
    .attr("fill-opacity", 0.12)
    .attr("stroke", "#284b63")
    .attr("stroke-dasharray", "4 3")
    .style("display", "none")
    .style("pointer-events", "none")

  let dragStart = null

  svg
    .on("mousedown.scatterplotZoom", (event) => {
      if (event.button !== 0) return

      const [mouseX, mouseY] = d3.pointer(event, svg.node())
      const plotX = mouseX - margin.left
      const plotY = mouseY - margin.top

      if (plotX < 0 || plotX > plotWidth || plotY < 0 || plotY > plotHeight) return

      dragStart = {
        x: clamp(plotX, 0, plotWidth),
        y: clamp(plotY, 0, plotHeight),
      }

      tooltip.style("display", "none")
      zoomRect
        .attr("x", margin.left + dragStart.x)
        .attr("y", margin.top + dragStart.y)
        .attr("width", 0)
        .attr("height", 0)
        .style("display", null)

      d3.select(window)
        .on("mousemove.scatterplotZoom", (moveEvent) => {
          if (!dragStart) return

          const [moveX, moveY] = d3.pointer(moveEvent, svg.node())
          const currentX = clamp(moveX - margin.left, 0, plotWidth)
          const currentY = clamp(moveY - margin.top, 0, plotHeight)

          zoomRect
            .attr("x", margin.left + Math.min(dragStart.x, currentX))
            .attr("y", margin.top + Math.min(dragStart.y, currentY))
            .attr("width", Math.abs(currentX - dragStart.x))
            .attr("height", Math.abs(currentY - dragStart.y))
        })
        .on("mouseup.scatterplotZoom", (upEvent) => {
          if (!dragStart) return

          const [upX, upY] = d3.pointer(upEvent, svg.node())
          const endX = clamp(upX - margin.left, 0, plotWidth)
          const endY = clamp(upY - margin.top, 0, plotHeight)
          const x0 = Math.min(dragStart.x, endX)
          const x1 = Math.max(dragStart.x, endX)
          const y0 = Math.min(dragStart.y, endY)
          const y1 = Math.max(dragStart.y, endY)

          dragStart = null
          zoomRect.style("display", "none")
          d3.select(window).on("mousemove.scatterplotZoom", null).on("mouseup.scatterplotZoom", null)

          if (Math.abs(x1 - x0) < 5 || Math.abs(y1 - y0) < 5) return

          zoomState = {
            dataRef: data,
            xDomain: [xScale.invert(x0), xScale.invert(x1)],
            yDomain: [yScale.invert(y1), yScale.invert(y0)],
          }
          draw_scatterplot(data)
        })
    })

  svg.on("dblclick.scatterplotZoom", () => {
    if (!zoomState.xDomain && !zoomState.yDomain) return

    zoomState = {
      dataRef: data,
      xDomain: null,
      yDomain: null,
    }
    tooltip.style("display", "none")
    draw_scatterplot(data)
  })
}
