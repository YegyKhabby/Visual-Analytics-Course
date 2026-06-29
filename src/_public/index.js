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

  if (payload.yearMin !== undefined) {
    YEAR_MIN = payload.yearMin
    YEAR_MAX = payload.yearMax
    // re-apply the active preset now that we know the real data range
    const activeBtn = document.querySelector(".year-preset-btn.active")
    if (activeBtn) {
      activatePreset(activeBtn)
      updateFilterSummaryFromDom()
    }
  }
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

const clearCheckboxGroup = (listElementId, checkboxClass, searchInputId) => {
  document.querySelectorAll(`.${checkboxClass}:checked`).forEach(cb => {
    cb.checked = false
  })

  if (searchInputId) {
    const searchInput = document.getElementById(searchInputId)
    if (searchInput) {
      searchInput.value = ""
    }
  }

  const listEl = document.getElementById(listElementId)
  if (listEl) {
    Array.from(listEl.getElementsByClassName("checkbox-wrapper")).forEach(wrapper => {
      wrapper.style.display = ""
    })
  }
}

document.getElementById("categories_clear_all").addEventListener("click", () => {
  clearCheckboxGroup("categories_list", "categories_list_checkbox", "categories_search")
  updateFilterSummaryFromDom()
})

document.getElementById("mechanics_clear_all").addEventListener("click", () => {
  clearCheckboxGroup("mechanics_list", "mechanics_list_checkbox", "mechanics_search")
  updateFilterSummaryFromDom()
})

// year range filter — preset buttons
let YEAR_MIN = 1876, YEAR_MAX = 2021
const yearMinInput = document.getElementById("year_min_input")
const yearMaxInput = document.getElementById("year_max_input")
const yearCustomRow = document.getElementById("year_custom_row")
const yearPresetBtns = document.querySelectorAll(".year-preset-btn")

const selectedCategoriesCountEl = document.getElementById("selected_categories_count")
const selectedMechanicsCountEl = document.getElementById("selected_mechanics_count")
const activeYearRangeEl = document.getElementById("active_year_range")
const filteredGamesCountEl = document.getElementById("filtered_games_count")

const getFilterState = () => {
  const selectedCategories = Array.from(document.querySelectorAll(".categories_list_checkbox:checked")).map(cb => cb.value)
  const selectedMechanics = Array.from(document.querySelectorAll(".mechanics_list_checkbox:checked")).map(cb => cb.value)
  return {
    selectedCategories,
    selectedMechanics,
    yearMin: yearMinInput.value,
    yearMax: yearMaxInput.value,
  }
}

const updateFilterSummary = ({ selectedCategories, selectedMechanics, yearMin, yearMax, filteredCount } = {}) => {
  if (selectedCategories !== undefined && selectedCategoriesCountEl) {
    selectedCategoriesCountEl.textContent = selectedCategories.length === 0 ? "All categories" : `${selectedCategories.length} categories`
  }
  if (selectedMechanics !== undefined && selectedMechanicsCountEl) {
    selectedMechanicsCountEl.textContent = selectedMechanics.length === 0 ? "All mechanics" : `${selectedMechanics.length} mechanics`
  }
  if (yearMin !== undefined && yearMax !== undefined && activeYearRangeEl) {
    activeYearRangeEl.textContent = `${yearMin}–${yearMax}`
  }
  if (filteredCount !== undefined && filteredGamesCountEl) {
    filteredGamesCountEl.textContent = filteredCount
  }
}

const updateFilterSummaryFromDom = () => updateFilterSummary(getFilterState())

function activatePreset(btn) {
  yearPresetBtns.forEach(b => b.classList.remove("active"))
  btn.classList.add("active")

  if (btn.dataset.min === "custom") {
    yearCustomRow.style.display = "flex"
  } else {
    yearCustomRow.style.display = "none"
    yearMinInput.value = btn.dataset.min === "all" ? YEAR_MIN : parseInt(btn.dataset.min)
    yearMaxInput.value = YEAR_MAX
  }
}

yearPresetBtns.forEach(btn => btn.addEventListener("click", () => {
  activatePreset(btn)
  updateFilterSummaryFromDom()
}))

// default: All
activatePreset(yearPresetBtns[0])
updateFilterSummaryFromDom()

// rank range slider
const RANK_MIN = 1, RANK_MAX = 99
const rankLowRange = document.getElementById("rank_low_range")
const rankHighRange = document.getElementById("rank_high_range")
const rankLowInput = document.getElementById("rank_low")
const rankHighInput = document.getElementById("rank_high")
const rankTrack = document.getElementById("rank_track")
const rankTopLabel = document.getElementById("rank_top_label")
const rankHighLabel = document.getElementById("rank_high_label")
const rankLowHint = document.getElementById("rank_low_hint")
let ldaActive = false

function requestLdaData() {
  let rankLow = document.getElementById("rank_low").value
  let rankHigh = document.getElementById("rank_high").value
  requestData({ mode: "lda", rankLow, rankHigh })
}

function refreshLdaIfActive() {
  if (ldaActive) requestLdaData()
}

// updates track gradient, labels, z-index — does NOT touch the text inputs
function updateRankTrackOnly(lo, hi) {
  const total = RANK_MAX - RANK_MIN
  const loPercent = ((lo - RANK_MIN) / total) * 100
  const hiPercent = ((hi - RANK_MIN) / total) * 100
  rankTrack.style.background = `linear-gradient(to right, #2f80ed 0%, #2f80ed ${loPercent}%, #f2a93b ${loPercent}%, #f2a93b ${hiPercent}%, #c0392b ${hiPercent}%, #c0392b 100%)`
  rankTopLabel.textContent = `Top: 1–${lo}`
  rankHighLabel.textContent = `Mid: ${lo + 1}–${hi}`
  rankLowHint.textContent = `Low: ${hi + 1}–100`
  rankLowRange.style.zIndex = lo > RANK_MAX - 10 ? 3 : 2
  rankHighRange.style.zIndex = lo > RANK_MAX - 10 ? 2 : 3
}

// called from slider drag — also syncs text inputs
function updateRankSlider() {
  const lo = parseInt(rankLowRange.value)
  const hi = parseInt(rankHighRange.value)
  rankLowInput.value = lo
  rankHighInput.value = hi
  updateRankTrackOnly(lo, hi)
}

rankLowRange.addEventListener("input", () => {
  if (parseInt(rankLowRange.value) >= parseInt(rankHighRange.value)) {
    rankLowRange.value = parseInt(rankHighRange.value) - 1
  }
  updateRankSlider()
  refreshLdaIfActive()
})

rankHighRange.addEventListener("input", () => {
  if (parseInt(rankHighRange.value) <= parseInt(rankLowRange.value)) {
    rankHighRange.value = parseInt(rankLowRange.value) + 1
  }
  updateRankSlider()
  refreshLdaIfActive()
})

// when user types — only move the slider, never overwrite the field being typed in
rankLowInput.addEventListener("input", () => {
  let v = parseInt(rankLowInput.value)
  if (!isNaN(v)) {
    v = Math.max(RANK_MIN, Math.min(v, parseInt(rankHighInput.value) - 1))
    rankLowRange.value = v
    updateRankTrackOnly(v, parseInt(rankHighRange.value))
    refreshLdaIfActive()
  }
})

rankHighInput.addEventListener("input", () => {
  let v = parseInt(rankHighInput.value)
  if (!isNaN(v)) {
    v = Math.min(RANK_MAX, Math.max(v, parseInt(rankLowInput.value) + 1))
    rankHighRange.value = v
    updateRankTrackOnly(parseInt(rankLowRange.value), v)
    refreshLdaIfActive()
  }
})

updateRankSlider()

const categoriesListEl = document.getElementById("categories_list")
const mechanicsListEl = document.getElementById("mechanics_list")
if (categoriesListEl) {
  categoriesListEl.addEventListener("change", updateFilterSummaryFromDom)
}
if (mechanicsListEl) {
  mechanicsListEl.addEventListener("change", updateFilterSummaryFromDom)
}
yearMinInput.addEventListener("input", updateFilterSummaryFromDom)
yearMaxInput.addEventListener("input", updateFilterSummaryFromDom)

/**
 * Callback, when the button is pressed to request the data from the server.
 * @param {*} parameters
 */
let requestData = (parameters) => {
  console.log(`requesting data from webserver`)

    const { selectedCategories, selectedMechanics, yearMin, yearMax } = getFilterState()
  updateFilterSummary({ selectedCategories, selectedMechanics, yearMin, yearMax })

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
  ldaActive = false
  requestData({})
}

document.getElementById("uniform_size_toggle").addEventListener("change", () => {
  if (data.scatterplot) draw_scatterplot(data.scatterplot)
})

document.getElementById("reset_filters_button").onclick = () => {
  document.querySelectorAll(".categories_list_checkbox, .mechanics_list_checkbox").forEach(cb => cb.checked = false)
  const categoriesSearch = document.getElementById("categories_search")
  const mechanicsSearch = document.getElementById("mechanics_search")
  categoriesSearch.value = ""
  mechanicsSearch.value = ""
  categoriesSearch.dispatchEvent(new Event("input"))
  mechanicsSearch.dispatchEvent(new Event("input"))
  activatePreset(yearPresetBtns[0])
}

document.getElementById("load_lda_button").onclick = () => {
  ldaActive = true
  requestLdaData()
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
    document.getElementById("title").textContent = "Playtime vs Rating (sized by # of reviews)"
  }

  draw_scatterplot(data.scatterplot)
  updateFilterSummary({ filteredCount: data.scatterplot.length })
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
