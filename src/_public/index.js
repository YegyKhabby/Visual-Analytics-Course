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

/**
 * Received once on connect: populates the Categories and Mechanics checkbox lists.
 */
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

/**
 * Filters the visible checkboxes in a list based on a search input.
 */
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

/**
 * Callback, when the button is pressed to request the data from the server.
 * @param {*} parameters
 */
let requestData = (parameters) => {
  console.log(`requesting data from webserver`)

  const selectedCategories = Array.from(document.querySelectorAll(".categories_list_checkbox:checked")).map(cb => cb.value)
  const selectedMechanics = Array.from(document.querySelectorAll(".mechanics_list_checkbox:checked")).map(cb => cb.value)

  socket.emit("getData", {
    parameters: {
      ...parameters,
      selectedCategories,
      selectedMechanics,
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
