import io from "socket.io-client"
import "./app.css"
import {configs} from "../_server/static/configs.js"
import {draw_scatterplot} from "./scatterplot.js"
import * as d3 from "d3"

let hostname = window.location.hostname
let protocol = window.location.protocol
const socketUrl = protocol + "//" + hostname + ":" + configs.port

export const socket = io(socketUrl)
socket.on("connect", () => {
  console.log("Connected to " + socketUrl + ".")
  socket.emit("getInitData")
})
socket.on("disconnect", () => {
  console.log("Disconnected from " + socketUrl + ".")
})

// fill categories and mechanics checkboxes on first connect
socket.on("initData", (payload) => {
  const setupCheckboxes = (items, listElementId) => {
    const listEl = document.getElementById(listElementId)
    while (listEl.firstChild) listEl.removeChild(listEl.firstChild)

    items.forEach(item => {
      const wrapper = document.createElement("div")
      wrapper.className = "checkbox-wrapper"

      const checkbox = document.createElement("input")
      checkbox.type = "checkbox"
      checkbox.id = `${listElementId}_${item}`
      checkbox.value = item
      checkbox.className = `${listElementId}_checkbox`

      const label = document.createElement("label")
      label.htmlFor = checkbox.id
      label.textContent = item

      wrapper.appendChild(checkbox)
      wrapper.appendChild(label)
      listEl.appendChild(wrapper)
    })
  }

  setupCheckboxes(payload.categories, "categories_list")
  setupCheckboxes(payload.mechanics, "mechanics_list")
})

// hide checkboxes that don't match the search input
const setupSearch = (searchInputId, listElementId) => {
  document.getElementById(searchInputId).addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase()
    const listEl = document.getElementById(listElementId)
    Array.from(listEl.getElementsByClassName("checkbox-wrapper")).forEach(wrapper => {
      wrapper.style.display = wrapper.textContent.toLowerCase().includes(searchTerm) ? "" : "none"
    })
  })
}

setupSearch("categories_search", "categories_list")
setupSearch("mechanics_search", "mechanics_list")

// year range slider
const YEAR_MIN = 1876, YEAR_MAX = 2021
const yearMinRange = document.getElementById("year_min_range")
const yearMaxRange = document.getElementById("year_max_range")
const yearMinInput = document.getElementById("year_min_input")
const yearMaxInput = document.getElementById("year_max_input")
const yearTrack = document.getElementById("year_track")

function updateYearTrack() {
  const lo = parseInt(yearMinRange.value)
  const hi = parseInt(yearMaxRange.value)
  const total = YEAR_MAX - YEAR_MIN
  const loPercent = ((lo - YEAR_MIN) / total) * 100
  const hiPercent = ((hi - YEAR_MIN) / total) * 100
  yearTrack.style.background = `linear-gradient(to right, #c6d3dd 0%, #c6d3dd ${loPercent}%, #284b63 ${loPercent}%, #284b63 ${hiPercent}%, #c6d3dd ${hiPercent}%, #c6d3dd 100%)`
  yearMinInput.value = lo
  yearMaxInput.value = hi
}

yearMinRange.addEventListener("input", () => {
  if (parseInt(yearMinRange.value) >= parseInt(yearMaxRange.value)) {
    yearMinRange.value = parseInt(yearMaxRange.value) - 1
  }
  updateYearTrack()
})

yearMaxRange.addEventListener("input", () => {
  if (parseInt(yearMaxRange.value) <= parseInt(yearMinRange.value)) {
    yearMaxRange.value = parseInt(yearMinRange.value) + 1
  }
  updateYearTrack()
})

yearMinInput.addEventListener("input", () => {
  const v = parseInt(yearMinInput.value)
  if (!isNaN(v) && v >= YEAR_MIN && v < parseInt(yearMaxInput.value)) {
    yearMinRange.value = v
    updateYearTrack()
  }
})

yearMaxInput.addEventListener("input", () => {
  const v = parseInt(yearMaxInput.value)
  if (!isNaN(v) && v <= YEAR_MAX && v > parseInt(yearMinInput.value)) {
    yearMaxRange.value = v
    updateYearTrack()
  }
})

updateYearTrack()

// rank range slider
const RANK_MIN = 1, RANK_MAX = 99
const rankLowRange = document.getElementById("rank_low_range")
const rankHighRange = document.getElementById("rank_high_range")
const rankLowInput = document.getElementById("rank_low")
const rankHighInput = document.getElementById("rank_high")
const rankTrack = document.getElementById("rank_track")
const rankHighLabel = document.getElementById("rank_high_label")
const rankLowerHint = document.getElementById("rank_lower_hint")

function updateRankSlider() {
  const lo = parseInt(rankLowRange.value)
  const hi = parseInt(rankHighRange.value)
  const total = RANK_MAX - RANK_MIN
  const loPercent = ((lo - RANK_MIN) / total) * 100
  const hiPercent = ((hi - RANK_MIN) / total) * 100
  rankTrack.style.background = `linear-gradient(to right, #2f80ed 0%, #2f80ed ${loPercent}%, #f2a93b ${loPercent}%, #f2a93b ${hiPercent}%, #c0392b ${hiPercent}%, #c0392b 100%)`
  rankLowInput.value = lo
  rankHighInput.value = hi
  rankHighLabel.textContent = `Mid: ${lo} to ${hi}`
  rankLowerHint.textContent = `Lower: ranked beyond ${hi}`
  // raise z-index of low handle when it's near the max so it stays clickable
  rankLowRange.style.zIndex = lo > RANK_MAX - 10 ? 3 : 2
  rankHighRange.style.zIndex = lo > RANK_MAX - 10 ? 2 : 3
}

rankLowRange.addEventListener("input", () => {
  if (parseInt(rankLowRange.value) >= parseInt(rankHighRange.value)) {
    rankLowRange.value = parseInt(rankHighRange.value) - 1
  }
  updateRankSlider()
})

rankHighRange.addEventListener("input", () => {
  if (parseInt(rankHighRange.value) <= parseInt(rankLowRange.value)) {
    rankHighRange.value = parseInt(rankLowRange.value) + 1
  }
  updateRankSlider()
})

rankLowInput.addEventListener("input", () => {
  let v = parseInt(rankLowInput.value)
  if (!isNaN(v)) {
    v = Math.max(RANK_MIN, Math.min(v, parseInt(rankHighInput.value) - 1))
    rankLowRange.value = v
    updateRankSlider()
  }
})

rankHighInput.addEventListener("input", () => {
  let v = parseInt(rankHighInput.value)
  if (!isNaN(v)) {
    v = Math.min(RANK_MAX, Math.max(v, parseInt(rankLowInput.value) + 1))
    rankHighRange.value = v
    updateRankSlider()
  }
})

updateRankSlider()

/**
 * Callback, when the button is pressed to request the data from the server.
 * @param {*} parameters
 */
let requestData = (parameters) => {
  console.log(`requesting data from webserver`)

  const selectedCategories = Array.from(document.querySelectorAll(".categories_list_checkbox:checked")).map(cb => cb.value)
  const selectedMechanics = Array.from(document.querySelectorAll(".mechanics_list_checkbox:checked")).map(cb => cb.value)
  const yearMin = document.getElementById("year_min_input").value
  const yearMax = document.getElementById("year_max_input").value

  socket.emit("getData", {
    parameters: {
      ...parameters,
      selectedCategories,
      selectedMechanics,
      yearMin,
      yearMax,
    }
  })
}

/**
 * Assigning the callback to request the data on click.
 */
document.getElementById("load_data_button").onclick = () => {
  requestData({})
}

document.getElementById("load_lda_button").onclick = () => {
  let rankLow = document.getElementById("rank_low").value
  let rankHigh = document.getElementById("rank_high").value
  requestData({ mode: "lda", rankLow, rankHigh })
}

/**
 * Object, that will store the loaded data.
 */
let data = {
  scatterplot: undefined,
}

/**
 * Callback that is called, when the requested data was sent from the server and is received in the frontend (here).
 * @param {*} payload
 */
let handleData = (payload) => {
  console.log(`Fresh data from Webserver:`)
  console.log(payload)
  data.scatterplot = payload.data

  if (payload.parameters && payload.parameters.mode === "lda") {
    document.getElementById("title").textContent = "LDA 1 vs LDA 2"
  } else {
    document.getElementById("title").textContent = "Maximum Playtime vs Rating"
  }

  draw_scatterplot(data.scatterplot)
}

socket.on("freshData", handleData)

let width = 0
let height = 0

/**
 * This is an example for visualizations, that are not automatically scalled with the viewBox attribute.
 *
 * IMPORTANT:
 * The called function to draw the data must not do any data preprocessing!
 * To much computational load will result in stuttering and reduced responsiveness!
 */
let checkSize = setInterval(() => {
  let container = d3.select(".visualizations")
  let newWidth = parseInt(container.style("width"))
  let newHeight = parseInt(container.style("height"))
  if (newWidth !== width || newHeight !== height) {
    width = newWidth
    height = newHeight
    if (data.scatterplot) draw_scatterplot(data.scatterplot)
  }
}, 100)
