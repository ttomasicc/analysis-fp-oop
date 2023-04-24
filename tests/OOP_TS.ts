const fs = require('fs')
const {exit} = require('process')
const meteoDataFilePath = './data/rnbaza_meteo.csv'

interface SensorStatisticsData {
    temperature: number
    humidity: number
    pressure: number
}

/**
 * Class representing a Meteorological Data Processor.
 */
class MeteoProcessor {
    private readonly meteoData: Array<MeteoData>

    /**
     * Creates an instance of the MeteoProcessor class.
     * @param {string} rawMeteoData - The raw meteorological data in CSV format.
     * @param {boolean} hasHeaders - Indicates whether the data has headers.
     */
    constructor(rawMeteoData: string, hasHeaders: boolean) {
        this.meteoData = this.parseCSV(rawMeteoData, hasHeaders)
    }

    /**
     * Returns processed meteorological data statistics grouped by sensor location and day.
     * @returns {MeteoMapper} - An object containing processed meteorological data statistics.
     */
    getStatistics(): MeteoMapper {
        const meteoBySensorLocation = this.getGroupedBySensorLocationAndDay()
        const meteoMapper = new MeteoMapper()
        const processedMeteoData = meteoMapper.mapperMeteoDataStatistics

        for (let sensorLocation of meteoBySensorLocation.mapperMeteoDataStatistics.keys()) {
            processedMeteoData.set(sensorLocation, meteoBySensorLocation.mapperMeteoDataStatistics.get(sensorLocation)!)
            for (let day of meteoBySensorLocation.innerKeys) {
                if (meteoBySensorLocation.mapperMeteoDataStatistics.has(sensorLocation)
                    && meteoBySensorLocation.mapperMeteoDataStatistics.get(sensorLocation)!.has(day)) {

                    let location = meteoBySensorLocation.mapperMeteoDataStatistics.get(sensorLocation)!.get(day) as MeteoData[]
                    processedMeteoData
                        .get(sensorLocation)
                        ?.set(day, this.getDailyStatistics(location.map((meteoData: MeteoData) => {
                            return {
                                temperature: meteoData.temperature,
                                humidity: meteoData.humidity,
                                pressure: meteoData.pressure
                            }
                        })))
                }
            }
        }
        return meteoMapper
    }

    /**
     * Calculates the daily statistics for meteorological data.
     * @private
     * @param {Array} day - An array of meteorological data for a day.
     * @returns {MeteoStatistics} - An object containing daily statistics for the meteorological data.
     */
    private getDailyStatistics(day: Array<SensorStatisticsData>): MeteoStatistics {
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

        return statistics
    }

    /**
     * Groups meteorological data by sensor location and day.
     * @private
     * @returns {MeteoMapper} - An object containing meteorological data grouped by sensor location and day.
     */
    private getGroupedBySensorLocationAndDay(): MeteoMapper {
        const meteoBySensorLocation = this.groupBy(this.meteoData, (meteoData: MeteoData) => meteoData.id)
        const groupedData = new MeteoMapper()

        for (const sensorLocation of meteoBySensorLocation.mapperMeteoData.keys()) {
            groupedData.mapperMeteoDataStatistics.set(sensorLocation, this.groupBy(
                meteoBySensorLocation.mapperMeteoData.get(sensorLocation) || [],
                (meteoData: MeteoData) => {
                    const day = meteoData.date.getDate().toString()
                    const month = (meteoData.date.getMonth() + 1).toString()
                    const year = meteoData.date.getFullYear()
                    const innerKey = `${day}.${month}.${year}.`

                    groupedData.innerKeys.add(innerKey)

                    return innerKey
                }
            ).mapperMeteoData)
        }

        return groupedData
    }

    /**
     * Groups an array of data using a key getter function.
     * @private
     * @param {Array<MeteoData>} data - The array of data to be grouped.
     * @param {Function} attrGetterFn - The function used to get the grouping key for each item in the array.
     * @returns {MeteoMapper} - An object containing the grouped data.
     */
    private groupBy(data: Array<MeteoData>, attrGetterFn: (arg0: MeteoData) => any): MeteoMapper {
        const groups = new MeteoMapper()

        for (const meteoData of data) {
            const key = attrGetterFn(meteoData)
            groups.addMeteoData(key, meteoData)
        }

        return groups
    }

    /**
     * Parses a CSV string of meteorological data.
     * @private
     * @param {string} data - The CSV string of meteorological data.
     * @param {boolean} hasHeaders - Indicates whether the CSV string has headers.
     * @returns {Array<MeteoData> } - An array of Meteorological Data objects.
     */
    private parseCSV(data: string, hasHeaders: boolean): Array<MeteoData> {
        let isHeader = hasHeaders

        const processedData: Array<MeteoData> = []
        for (let line of data.split('\n')) {
            if (isHeader) {
                isHeader = false
                continue
            }
            if (line) {
                let [id, date, temperature, humidity, pressure] = line.split(';')

                processedData.push(new MeteoData(
                    id,
                    date,
                    temperature !== '-999' ? parseFloat(temperature) : NaN,
                    humidity !== '-999' ? parseFloat(humidity) : NaN,
                    pressure !== '-999' ? parseFloat(pressure) : NaN
                ))
            }
        }

        return processedData
    }
}

/**
 * Class representing a MeteoMapper.
 */
class MeteoMapper {
    /**
     * A map containing the mapped meteo data statistics, where each key is a string representing a statistic
     * The statistics can be either an object of type MeteoStatistics or an array of MeteoData objects.
     */
    mapperMeteoDataStatistics = new Map<string, Map<string, MeteoStatistics | MeteoData[]>>()

    /**
     * A map containing the mapped meteo data, where each key is a string representing a statistic
     */
    mapperMeteoData = new Map<string, MeteoData[]>()

    /**
     * A set containing the keys for the inner maps of the `mapperMeteoDataStatistics` map.
     */
    innerKeys = new Set<string>()

    /**
     * Adds meteo data to the `mapperMeteoData` map.
     *
     * @param {string} key - The key to add the data to (e.g. "temperature").
     * @param {MeteoData} data - The MeteoData object to add to the map.
     */
    public addMeteoData(key: string, data: MeteoData) {
        const dataMap = this.mapperMeteoData.get(key)
        if (dataMap)
            dataMap.push(data)
        else
            this.mapperMeteoData.set(key, [data])
    }

    /**
     * Creates a JavaScript object string representation from a MeteoMapper object.
     *
     * @returns {Object} - The created JavaScript object in a string representation.
     */
    public getJSONString() {
        return JSON.stringify(Object.fromEntries(this.mapperMeteoDataStatistics),
            (_, value: Iterable<readonly any[]>) => value instanceof Map ? Object.fromEntries(value) : value
        )
    }
}

/**
 * Class representing Meteorological Data.
 */
class MeteoData {
    id: string
    date: Date
    temperature: number
    humidity: number
    pressure: number

    /**
     * Creates an instance of the MeteoData class. */
    constructor(id: string, date: string, temperature: number, humidity: number, pressure: number) {
        this.date = this.convertDate(date)
        this.id = id
        this.temperature = temperature
        this.humidity = humidity
        this.pressure = pressure
    }

    /**
     * Converts the date string to a Date object.
     * @private
     * @returns {Date} - The date as a Date object.
     */
    private convertDate(dateStr: string): Date {
        const [datePart, timePart] = dateStr.split(' ')
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
    minTemp: number = Infinity
    /**
     * The maximum temperature value.
     * @type {number}
     */
    maxTemp: number = -Infinity
    /**
     * The average temperature value.
     * @type {number}
     */
    avgTemp: number = NaN

    /**
     * The minimum humidity value.
     * @type {number}
     */
    minHumidity: number = Infinity
    /**
     * The maximum humidity value.
     * @type {number}
     */
    maxHumidity: number = -Infinity
    /**
     * The average humidity value.
     * @type {number}
     */
    avgHumidity: number = NaN

    /**
     * The minimum pressure value.
     * @type {number}
     */
    minPressure: number = Infinity
    /**
     * The maximum pressure value.
     * @type {number}
     */
    maxPressure: number = -Infinity
    /**
     * The average pressure value.
     * @type {number}
     */
    avgPressure: number = NaN

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
function loadMeteoData(filePath: string): string | undefined {
    try {
        return fs.readFileSync(filePath, 'utf-8')
    } catch (err) {
        console.error(err)
        exit(1)
    }
}

/**
 * The main function that runs the meteo data processing program.
 */
function main() {
    const meteoData = loadMeteoData(meteoDataFilePath)

    const startTime = new Date()
    const startMemory = process.memoryUsage.rss()

    const meteoProcessor = new MeteoProcessor(meteoData ?? '', true)
    const processedMeteoData = meteoProcessor.getStatistics()

    const endTime = new Date()
    const endMemory = process.memoryUsage.rss()

    console.info(endTime.getTime() - startTime.getTime())
    console.info(endMemory - startMemory)

    console.info(processedMeteoData.getJSONString())
}

main()