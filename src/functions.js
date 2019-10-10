import { SETTINGS_SAVEAS, SETTINGS_DCMHEADER, SETTINGS_OVERLAY, SETTINGS_MEASUREMENT } from './constants/settings'


export function getSettingsSaveAs() {
    let saveAs = localStorage.getItem(SETTINGS_SAVEAS)
    if (saveAs === null) {
      saveAs = "png"
      localStorage.setItem(SETTINGS_SAVEAS, saveAs)
    }
}

export function setSettingsSaveAs(value) {
    localStorage.setItem(SETTINGS_SAVEAS, value)  
}

export function getSettingsDcmHeader() {
    let exportAs = localStorage.getItem(SETTINGS_DCMHEADER)
    if (exportAs === null) {
      exportAs = "json"
      localStorage.setItem(SETTINGS_DCMHEADER, exportAs)
    }  
}

export function setSettingsDcmHeader(value) {
    localStorage.setItem(SETTINGS_DCMHEADER, value)  
}

export function getSettingsOverlay() {
    let overlay = localStorage.getItem(SETTINGS_OVERLAY)
    if (overlay === null) {
      overlay = "1"
      localStorage.setItem(SETTINGS_OVERLAY, overlay)
    }
    return overlay
}

export function setSettingsOverlay(value) {
    localStorage.setItem(SETTINGS_OVERLAY, value)  
}

export function getSettingsMeasurement() {
    let measurement = localStorage.getItem(SETTINGS_MEASUREMENT)
    if (measurement === null) {
        measurement = "1"
      localStorage.setItem(SETTINGS_MEASUREMENT, measurement)
    }
    return measurement
}

export function setSettingsMeasurement(value) {
    localStorage.setItem(SETTINGS_MEASUREMENT, value)  
}


/**
 * Converts a value to a string appropriate for entry into a CSV table.  E.g., a string value will be surrounded by quotes.
 * @param {string|number|object} theValue
 */
function toCsvValue(theValue) {
    let t = typeof theValue,
        output

    let sDelimiter = '"'

    if (t === 'undefined' || t === null) {
        output = ''
    } else if (t === 'string') {
        output = sDelimiter + theValue.replace(/"/g, '""') + sDelimiter
    } else {
        output = sDelimiter + String(theValue).replace(/"/g, '""') + sDelimiter
    }

    return output
}

/**
 * Converts an array of objects (with identical schemas) into a CSV table.
 * @param {Array} objArray An array of objects.  Each object in the array must have the same property list.
 * @param {string} cDelimiter The column delimiter.  Defaults to a comma (,) if omitted.
 * @return {string} The CSV equivalent of objArray.
 */
export function toCsv(objArray, cDelimiter) {
    var i,
        l,
        names = [],
        name,
        value,
        obj,
        row,
        output = '',
        n,
        nl

    // Initialize default parameters.

    let sDelimiter = '"'
    if (typeof cDelimiter === 'undefined' || cDelimiter === null) {
        cDelimiter = ','
    }

    for (i = 0, l = objArray.length; i < l; i += 1) {
        // Get the names of the properties.
        obj = objArray[i]
        row = ''
        if (i === 0) {
            // Loop through the names
            for (name in obj) {
                if (obj.hasOwnProperty(name)) {
                    names.push(name)
                    row += [
                        sDelimiter,
                        name.replace(/"/g, '""'),
                        sDelimiter,
                        cDelimiter,
                    ].join('')
                }
            }
            row = row.substring(0, row.length - 1)
            output += row
        }

        output += '\n'
        row = ''
        for (n = 0, nl = names.length; n < nl; n += 1) {
            name = names[n]
            value = obj[name]
            if (n > 0) {
                row += cDelimiter
            }
            row += toCsvValue(value)
        }
        output += row
    }

    return output
}

