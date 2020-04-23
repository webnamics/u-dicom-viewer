import { 
    isAndroid,
    isFirefox,
    isMobile, 
    isTablet 
  } from 'react-device-detect'
import { 
    SETTINGS_SAVEAS, 
    SETTINGS_SAVEINTO,
    SETTINGS_DCMHEADER, 
    SETTINGS_OVERLAY, 
    SETTINGS_MEASUREMENT,
    SETTINGS_FSVIEW,
    SETTINGS_DICOMDIRVIEW,    
    SETTINGS_MPRINTERPOLATION,
} from './constants/settings'


export function getPixelSpacing(image, index) {
    const value = image.data.string('x00280030')
    if (value === undefined) {
        return
    }
    const pixelSpacing = value.split('\\')
    return pixelSpacing[index]
}

export function getSpacingBetweenSlice(image) {
    const value = image.data.string('x00180088')
    if (value === undefined) {
        return
    }
    return parseFloat(value)
}

export function getSliceThickness(image) {
    const value = image.data.string('x00180050')
    if (value === undefined) {
        return
    }
    return parseFloat(value)
}

export function getSliceLocation(image) {
    const value = image.data.string('x00201041')
    if (value === undefined) {
        return
    }
    return parseFloat(value)
}	

  
export function capitalize(str) {
    if (str === undefined) 
        return ''
    else 
        return str.charAt(0).toUpperCase() + str.slice(1)
}

// To see the console output set the key 'debug-u-dicom-viewer' in 
// 'Storage->Local Storage' panel of your browser Develop Tool
export function log() {
    let log = localStorage.getItem('debug-u-dicom-viewer')
    if (log === null) {
        console.log = function(){}
    }
}

export function isInputDirSupported() {
    var tmpInput = document.createElement('input')
    if ('webkitdirectory' in tmpInput 
        || 'mozdirectory' in tmpInput 
        || 'odirectory' in tmpInput 
        || 'msdirectory' in tmpInput 
        || 'directory' in tmpInput) return true
    return false
}

export function isUrlImage(url) {
    if (url === undefined || url === null) return false
    return(url.match(/\.(jpeg|jpg|png)$/) != null)
}

export function isFileImage(file) {
    if (file === undefined || file === null) return false 
    const acceptedImageTypes = ['image/jpeg', 'image/png'] // 'image/gif', 
    return file && acceptedImageTypes.includes(file['type'])
}

export function isFsFileImage(fsItem) {
    console.log('isFsFileImage: ', fsItem)
    if (fsItem === undefined || fsItem === null) return false
    return fsItem.type.toLowerCase() === 'jpeg' || fsItem.type.toLowerCase() === 'png'
}

export function getFileNameCorrect(filename) {
    if (isAndroid && isFirefox) { // possible uncorrect .null extension is found in Android Firefox, it's a bug? CHECK IT
        const ext = getFileExt(filename)
        if (ext === 'null') {
            return getFileName(filename)
        }
    }
    return filename 
}

export function getFileExt(file) {
    const re = /(?:\.([^.]+))?$/
    const ext = re.exec(file)[1]
    if (ext === undefined) {
        return 'dcm'
    }
    return ext
}

export function getFileExtReal(file) {
    const re = /(?:\.([^.]+))?$/
    const ext = re.exec(file)[1]
    if (ext === undefined) {
        return ''
    }
    return ext
}

export function getFileName(file) {
    const name = file.replace(/\.[^.$]+$/, '')
    if (name === undefined) {
        return ''
    }
    return name    
}

export function formatBytes(bytes, decimals = 2) {
    if (bytes === '') return ''
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function getSettingsSaveAs() {
    let saveAs = localStorage.getItem(SETTINGS_SAVEAS)
    if (saveAs === null) {
      saveAs = "png"
      localStorage.setItem(SETTINGS_SAVEAS, saveAs)
    }
    return saveAs
}

export function setSettingsSaveAs(value) {
    localStorage.setItem(SETTINGS_SAVEAS, value)  
}

export function getSettingsSaveInto() {
    let saveInto = localStorage.getItem(SETTINGS_SAVEINTO)
    if (saveInto === null) {
        saveInto = "local"
      localStorage.setItem(SETTINGS_SAVEINTO, saveInto)
    }
    return saveInto
}

export function setSettingsSaveInto(value) {
    localStorage.setItem(SETTINGS_SAVEINTO, value)  
}

export function getSettingsDcmHeader() {
    let exportAs = localStorage.getItem(SETTINGS_DCMHEADER)
    if (exportAs === null) {
      exportAs = "json"
      localStorage.setItem(SETTINGS_DCMHEADER, exportAs)
    }  
    return exportAs
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
    return overlay === '1'
}

export function setSettingsOverlay(value) {
    localStorage.setItem(SETTINGS_OVERLAY, value ? '1' : '0')  
}

export function getSettingsMeasurement() {
    let measurement = localStorage.getItem(SETTINGS_MEASUREMENT)
    if (measurement === null) {
        measurement = '1'
        localStorage.setItem(SETTINGS_MEASUREMENT, measurement)
    }
    return measurement
}

export function setSettingsMeasurement(value) {
    localStorage.setItem(SETTINGS_MEASUREMENT, value)  
}

export function getSettingsFsView() {
    let view = localStorage.getItem(SETTINGS_FSVIEW)
    if (view === null) {
        view = isMobile && !isTablet ? 'bottom' : 'right'
        localStorage.setItem(SETTINGS_FSVIEW, view)
    }
    return view
}

export function setSettingsFsView(value) {
    localStorage.setItem(SETTINGS_FSVIEW, value)  
}

export function getSettingsDicomdirView() {
    let view = localStorage.getItem(SETTINGS_DICOMDIRVIEW)
    if (view === null) {
        view = isMobile && !isTablet ? 'bottom' : 'right'
        localStorage.setItem(SETTINGS_DICOMDIRVIEW, view)
    }
    return view
}

export function setSettingsDicomdirView(value) {
    localStorage.setItem(SETTINGS_DICOMDIRVIEW, value)  
}

export function getSettingsMprInterpolation() {
    let method = localStorage.getItem(SETTINGS_MPRINTERPOLATION)
    if (method === null) {
        method = 'weightedlinear'
        localStorage.setItem(SETTINGS_MPRINTERPOLATION, method)
    }
    return method
}

export function setSettingsMprInterpolation(value) {
    localStorage.setItem(SETTINGS_MPRINTERPOLATION, value)  
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

