const fs = require('fs')
const meteoDataFilePath = './data/rnbaza_meteo.csv'

/**
 * Loads meteorological data from the specified file path.
 * @param {string} filePath - The file path.
 * @returns {string} The contents of the meteorological data file as a string in UTF-8 encoding.
 */
function loadMeteoData(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf-8')
    } catch (err) {
        console.error(err)
        process.exit(1)
    }
}

/**
 * Formats CSV data as a 2D array.
 * @param {string} data - The CSV data as a string.
 * @returns {Array<Array<string>>} The formatted CSV data as a 2D array.
 */
const formatCSV = (data) =>
    data
        .split('\n')
        .filter(Boolean)
        .map(line => line.split(';'))

/**
 * Groups an array of data using a key getter function.
 * @param {Array} data - The array of data to be grouped.
 * @param {Function} attrGetterFn - The function used to get the grouping key for each item in the array.
 * @returns {Object} - An object containing the grouped data.
 */
function groupBy(data, attrGetterFn) {
    const groups = new Map()

    data.forEach((meteoData) => {
        let id = attrGetterFn(meteoData)
        groups.has(id) ? groups.get(id).push(meteoData) : groups.set(id, [meteoData])
    })

    return Object.fromEntries(groups)
}

/**
 * Groups meteorological data by sensor location and day.
 * @param {string} meteoData - The meteorological data as a CSV-formatted string.
 * @returns {object} The grouped meteorological data as an object of key-value pairs.
 */
function groupMeteoData(meteoData) {
    const groupedBySensorLocation = groupBy(
        formatCSV(meteoData).slice(1),
        (row) => row[0]
    )

    const groupedBySensorLocationAndDay = {}
    Object.keys(groupedBySensorLocation).forEach((sensorLocation) => {
        groupedBySensorLocationAndDay[sensorLocation] = groupBy(
            groupedBySensorLocation[sensorLocation],
            (row) => row[1].split(' ')[0]
        )
    })

    return groupedBySensorLocationAndDay
}

/**
 Processes the meteo data and calculates statistics for each day.
 @param {Object} meteoData - The meteo data grouped by sensor location and day.
 @returns {Object} An object containing the processed meteo data with statistics for each day.
 */
function processMeteoData(meteoData) {
    const processedMeteoData = {}

    Object.keys(meteoData).forEach((sensorLocation) => {
        processedMeteoData[sensorLocation] = meteoData[sensorLocation]
        Object.keys(meteoData[sensorLocation]).forEach((day) =>
            processedMeteoData[sensorLocation][day] = getDayStatistics(meteoData[sensorLocation][day]))
    })

    return processedMeteoData
}

/**
 * Computes the minimum, maximum, and average temperature, humidity, and pressure readings for a given day of meteo
 * data.
 * @param {Array<Array<string>>} day - The meteo data for a single day.
 * @returns {object} An object containing the computed statistics.
 */
function getDayStatistics(day) {
    const statistics = {
        minTemp: Infinity,
        maxTemp: -Infinity,
        avgTemp: NaN,

        minHumidity: Infinity,
        maxHumidity: -Infinity,
        avgHumidity: NaN,

        minPressure: Infinity,
        maxPressure: -Infinity,
        avgPressure: NaN
    }

    let tempTotal = 0, tempTotalCount = 0
    let humidityTotal = 0, humidityTotalCount = 0
    let pressureTotal = 0, pressureTotalCount = 0

    day.forEach((reading) => {
        const temp = parseFloat(reading[2])
        tempTotal += temp
        tempTotalCount++
        statistics.minTemp = Math.min(statistics.minTemp, temp)
        statistics.maxTemp = Math.max(statistics.maxTemp, temp)

        if (reading[3] !== '-999') {
            const humidity = parseFloat(reading[3])
            humidityTotal += humidity
            humidityTotalCount++
            statistics.minHumidity = Math.min(statistics.minHumidity, humidity)
            statistics.maxHumidity = Math.max(statistics.maxHumidity, humidity)
        }

        if (reading[4] !== '-999') {
            const pressure = parseFloat(reading[4])
            pressureTotal += pressure
            pressureTotalCount++
            statistics.minPressure = Math.min(statistics.minPressure, pressure)
            statistics.maxPressure = Math.max(statistics.maxPressure, pressure)
        }
    })

    if (tempTotalCount !== 0)
        statistics.avgTemp = tempTotal / tempTotalCount
    if (humidityTotalCount !== 0)
        statistics.avgHumidity = humidityTotal / humidityTotalCount
    if (pressureTotalCount !== 0)
        statistics.avgPressure = pressureTotal / pressureTotalCount

    return JSON.parse(JSON.stringify(statistics))
}

/**
 * The main function that runs the meteo data processing program.
 */
function main() {
    const meteoData = loadMeteoData(meteoDataFilePath)

    const startTime = new Date()
    const startMemory = process.memoryUsage.rss()

    const groupedMeteoData = groupMeteoData(meteoData)
    const processedMeteoData = processMeteoData(groupedMeteoData)

    const endTime = new Date()
    const endMemory = process.memoryUsage.rss()

    console.info(endTime - startTime)
    console.info(endMemory - startMemory)

    console.info(JSON.stringify(processedMeteoData))
}

main()