import * as fs from "fs"
import * as druid from "@saehrimnir/druidjs"
import { print_clientConnected, print_clientDisconnected } from "./static/utils.js"
import { preprocess_boardgames } from "./preprocessing.js"

const file_path = "data/"
const file_name = "boardgames_100.json"

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

  const featureNames = ["year", "minage", "minplayers", "maxplayers", "minplaytime", "maxplaytime"]
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

/**
 * Does some console.logs when a client connected.
 * Also sets up the listener, if the client disconnects.
 * @param {*} socket 
 */
export function setupConnection(socket) {
  print_clientConnected(socket.id)

  /**
   * Listener that is called, if client disconnects.
   */
  socket.on("disconnect", () => {
    print_clientDisconnected(socket.id)
  })

  /**
   * # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
   * 
   * !!!!! Here an below, you can/should edit the code  !!!!!
   * - you can modify the getData listener
   * - you can add other listeners for other functionalities
   * 
   * # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
   */


  /**
   * Listener that is called, if a message was sent with the topic "getData"
   * 
   * In this case, the following is done:
   * - Read in the data (.csv in this case) a a stream
   *      (Stream -> data is read in line by line)
   * - Do data preprocessing while reading in:
   *      - Convert values, that can be represented as numbers to numbers
   *      - Calculate the BMI for every data row (person)
   *      - Filtering: if the row has a value, that contradicts the filtering parameters, data row will be excluded
   *          (in this case: weight should not be larger than the max_weight filter-parameter)
   */
  socket.on("getInitData", () => {
    fs.readFile(file_path + file_name, "utf8", (error, fileContent) => {
      if (error) {
        console.error(error)
        return
      }
      const rawGames = JSON.parse(fileContent)
      const categories = [...new Set(rawGames.flatMap(g => g.types.categories || []).map(c => c.name))].filter(Boolean).sort()
      const mechanics = [...new Set(rawGames.flatMap(g => g.types.mechanics || []).map(m => m.name))].filter(Boolean).sort()
      const yearMin = Math.min(...rawGames.map(g => g.year))
      const yearMax = Math.max(...rawGames.map(g => g.year))
      socket.emit("initData", { categories, mechanics, yearMin, yearMax })
    })
  })

  socket.on("getData", (obj) => {
    console.log(`Data request with properties ${JSON.stringify(obj)}...`)

    let parameters = obj.parameters

    fs.readFile(file_path + file_name, "utf8", (error, fileContent) => {
      if (error) {
        console.error(error)
        return
      }

      let rawGames = JSON.parse(fileContent)

      if (parameters.selectedCategories && parameters.selectedCategories.length > 0) {
        rawGames = rawGames.filter(game => {
          const gameCats = (game.types.categories || []).map(c => c.name)
          return parameters.selectedCategories.some(cat => gameCats.includes(cat))
        })
      }

      if (parameters.selectedMechanics && parameters.selectedMechanics.length > 0) {
        rawGames = rawGames.filter(game => {
          const gameMechs = (game.types.mechanics || []).map(m => m.name)
          return parameters.selectedMechanics.some(mech => gameMechs.includes(mech))
        })
      }

      if (parameters.yearMin !== undefined && parameters.yearMax !== undefined) {
        const yearMin = parseInt(parameters.yearMin)
        const yearMax = parseInt(parameters.yearMax)
        rawGames = rawGames.filter(game => game.year >= yearMin && game.year <= yearMax)
      }

      let games = []
      if (rawGames.length > 0) {
        if (parameters.mode === "lda") {
          try {
            games = calculateLdaProjection(rawGames, parameters)
          } catch (e) {
            console.error("LDA failed:", e.message)
            games = []
          }
        } else {
          games = preprocess_boardgames(rawGames)
        }
      }

      socket.emit("freshData", {
        timestamp: new Date().getTime(),
        data: games,
        parameters: parameters,
      })
      console.log(`freshData emitted`)
    })
  })

}
