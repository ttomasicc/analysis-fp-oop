const fs = require('fs')
const meteoDataFilePath = './data/rnbaza_meteo.csv'

/**
 * Class representing a Meteorological Data Processor.
 */
class MeteoProcessor {
    #meteoData

    /**
     * Creates an instance of the MeteoProcessor class.
     * @param {string} rawMeteoData - The raw meteorological data in CSV format.
     * @param {boolean} hasHeaders - Indicates whether the data has headers.
     */
    constructor(rawMeteoData, hasHeaders) {
        this.#meteoData = this.#parseCSV(rawMeteoData, hasHeaders)
    }

    /**
     * Returns processed meteorological data statistics grouped by sensor location and day.
     * @returns {Object} - An object containing processed meteorological data statistics.
     */
    getStatistics() {
        const meteoBySensorLocation = this.#getGroupedBySensorLocationAndDay()

        const processedMeteoData = {}
        for (let sensorLocation in meteoBySensorLocation) {
            processedMeteoData[sensorLocation] = meteoBySensorLocation[sensorLocation]
            for (let day in meteoBySensorLocation[sensorLocation])
                processedMeteoData[sensorLocation][day] = this.#getDailyStatistics(meteoBySensorLocation[sensorLocation][day])
        }

        return processedMeteoData
    }

    /**
     * Calculates the daily statistics for meteorological data.
     * @private
     * @param {Array} day - An array of meteorological data for a day.
     * @returns {Object} - An object containing daily statistics for the meteorological data.
     */
    #getDailyStatistics(day) {
        const statistics = new MeteoStatistics()

        let tempTotal = 0, tempTotalCount = 0
        let humidityTotal = 0, humidityTotalCount = 0
        let pressureTotal = 0, pressureTotalCount = 0

        for (let reading of day) {
            tempTotal += reading.temperature
            tempTotalCount++
            statistics.minTemp = Math.min(statistics.minTemp, reading.temperature)
            statistics.maxTemp = Math.max(statistics.maxTemp, reading.temperature)

            if (!Number.isNaN(reading.humidity)) {
                humidityTotal += reading.humidity
                humidityTotalCount++
                statistics.minHumidity = Math.min(statistics.minHumidity, reading.humidity)
                statistics.maxHumidity = Math.max(statistics.maxHumidity, reading.humidity)
            }

            if (!Number.isNaN(reading.pressure)) {
                pressureTotal += reading.pressure
                pressureTotalCount++
                statistics.minPressure = Math.min(statistics.minPressure, reading.pressure)
                statistics.maxPressure = Math.max(statistics.maxPressure, reading.pressure)
            }
        }

        if (tempTotalCount !== 0)
            statistics.avgTemp = tempTotal / tempTotalCount
        if (humidityTotalCount !== 0)
            statistics.avgHumidity = humidityTotal / humidityTotalCount
        if (pressureTotalCount !== 0)
            statistics.avgPressure = pressureTotal / pressureTotalCount

        return JSON.parse(JSON.stringify(statistics))
    }

    /**
     * Groups meteorological data by sensor location and day.
     * @private
     * @returns {Object} - An object containing meteorological data grouped by sensor location and day.
     */
    #getGroupedBySensorLocationAndDay() {
        const meteoBySensorLocation = this.#groupBy(this.#meteoData, (meteoData) => meteoData.id)

        const meteoBySensorLocationAndDay = {}
        for (let sensorLocation in meteoBySensorLocation) {
            meteoBySensorLocationAndDay[sensorLocation] = this.#groupBy(
                meteoBySensorLocation[sensorLocation],
                (meteoData) => {
                    const day = meteoData.date.getDate().toString()
                    const month = (meteoData.date.getMonth() + 1).toString()
                    const year = meteoData.date.getFullYear()
                    return `${day}.${month}.${year}.`
                }
            )
        }

        return meteoBySensorLocationAndDay
    }

    /**
     * Groups an array of data using a key getter function.
     * @private
     * @param {Array} data - The array of data to be grouped.
     * @param {Function} attrGetterFn - The function used to get the grouping key for each item in the array.
     * @returns {Object} - An object containing the grouped data.
     */
    #groupBy(data, attrGetterFn) {
        const groups = new Map()

        for (const meteoData of data) {
            let id = attrGetterFn(meteoData)
            groups.has(id) ? groups.get(id).push(meteoData) : groups.set(id, [meteoData])
        }

        return Object.fromEntries(groups)
    }

    /**
     * Parses a CSV string of meteorological data.
     * @private
     * @param {string} data - The CSV string of meteorological data.
     * @param {boolean} hasHeaders - Indicates whether the CSV string has headers.
     * @returns {Array} - An array of Meteorological Data objects.
     */
    #parseCSV(data, hasHeaders) {
        let isHeader = hasHeaders

        const processedData = []
        for (let line of data.split('\n')) {
            if (isHeader) {
                isHeader = false
                continue
            }
            if (line) processedData.push(new MeteoData(line))
        }

        return processedData
    }
}

/**
 * Class representing Meteorological Data.
 */
class MeteoData {
    id
    date
    temperature
    humidity
    pressure

    /**
     * Creates an instance of the MeteoData class.
     * @param {string} row - The meteorological data in CSV format.
     */
    constructor(row) {
        [this.id, this.date, this.temperature, this.humidity, this.pressure] = row.split(';')
        this.#convertTypes()
    }

    /**
     * Converts the temperature, humidity, pressure, and date properties to their respective types.
     * @private
     */
    #convertTypes() {
        this.date = this.#convertDate()
        this.temperature = parseFloat(this.temperature)
        this.humidity = this.humidity !== '-999' ? parseFloat(this.humidity) : NaN
        this.pressure = this.pressure !== '-999' ? parseFloat(this.pressure) : NaN
    }

    /**
     * Converts the date string to a Date object.
     * @private
     * @returns {Date} - The date as a Date object.
     */
    #convertDate() {
        const [datePart, timePart] = this.date.split(' ')
        const [date, month, year] = datePart.split('.')
        const [hours, minutes, seconds] = timePart.split(':')
        return new Date(
            parseInt(year), parseInt(month) - 1, parseInt(date),
            parseInt(hours), parseInt(minutes), parseInt(seconds)
        )
    }
}

/**
 * Class representing Meteorological Data Statistics.
 */
class MeteoStatistics {
    /**
     * The minimum temperature value.
     * @type {number}
     */
    minTemp = Infinity
    /**
     * The maximum temperature value.
     * @type {number}
     */
    maxTemp = -Infinity
    /**
     * The average temperature value.
     * @type {number}
     */
    avgTemp = NaN

    /**
     * The minimum humidity value.
     * @type {number}
     */
    minHumidity = Infinity
    /**
     * The maximum humidity value.
     * @type {number}
     */
    maxHumidity = -Infinity
    /**
     * The average humidity value.
     * @type {number}
     */
    avgHumidity = NaN

    /**
     * The minimum pressure value.
     * @type {number}
     */
    minPressure = Infinity
    /**
     * The maximum pressure value.
     * @type {number}
     */
    maxPressure = -Infinity
    /**
     * The average pressure value.
     * @type {number}
     */
    avgPressure = NaN

    /**
     * Creates an instance of the MeteoStatistics class.
     */
    constructor() {
    }
}

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
 * The main function that runs the meteo data processing program.
 */
function main() {
    const meteoData = loadMeteoData(meteoDataFilePath)

    const startTime = new Date()
    const startMemory = process.memoryUsage.rss()

    const meteoProcessor = new MeteoProcessor(meteoData, true)
    const processedMeteoData = meteoProcessor.getStatistics()

    const endTime = new Date()
    const endMemory = process.memoryUsage.rss()

    console.info(endTime - startTime)
    console.info(endMemory - startMemory)

    console.info(JSON.stringify(processedMeteoData))
}

main()