export const CLEAR_STORE = 'CLEAR_STORE'
export const LOCALFILE_STORE = 'LOCALFILE_STORE'
export const FSFILE_STORE = 'LOCALFILE_STORE'
export const FILES_STORE = 'FILES_STORE'
export const DCM_IS_OPEN = 'DCM_IS_OPEN'
export const DCM_TOOL = 'DCM_TOOL'
export const ACTIVE_DCM_INDEX = 'ACTIVE_DCM_INDEX'
export const ACTIVE_DCM = 'ACTIVE_DCM'
//export const DCM_IMAGE = 'DCM_IMAGE'
export const ACTIVE_MEASUREMENTS = 'ACTIVE_MEASUREMENTS'
export const LAYOUT = 'LAYOUT'
export const DICOMDIR = 'DICOMDIR'
export const FSCURRENTDIR = 'FSCURRENTDIR'
export const FSCURRENTLIST = 'FSCURRENTLIST'
export const FSZIPPEDFILE = 'FSZIPPEDFILE'
export const FSREFRESH = 'FSREFRESH'
export const VOLUME_STORE = 'VOLUME_STORE'
//export const LUT_STORE = 'LUT_STORE'
//export const SANDBOXEDFILE_STORE = 'SANDBOXEDFILE_STORE'

export const clearStore = () => {
    return { 
        type: CLEAR_STORE, 
    }
}

export const localFileStore = (file) => {
    return { 
        type: LOCALFILE_STORE, 
        localFile: file
    }
}

export const fsFileStore = (file) => {
    return { 
        type: FSFILE_STORE, 
        fsFile: file
    }
}

export const filesStore = (files) => {
    return { 
        type: FILES_STORE, 
        files: files
    }
}

export const dcmIsOpen = (value) => {
    return { 
        type: DCM_IS_OPEN, 
        value: value
    }
}

export const dcmTool = (tool) => {
    return { 
        type: DCM_TOOL, 
        tool: tool 
    }
}

export const activeDcmIndex = (index) => {
    return { 
        type: ACTIVE_DCM_INDEX, 
        activeDcmIndex: index 
    }
}

export const activeDcm = (dcm) => {
    return { 
        type: ACTIVE_DCM, 
        activeDcm: dcm 
    }
}
/*
export const dcmImage = (image) => {
    return { 
        type: DCM_IMAGE, 
        images: image 
    }
}
*/
export const activeMeasurements = (measurements) => {
    return { 
        type: ACTIVE_MEASUREMENTS, 
        measurements: measurements 
    }
}

export const setLayout = (row, col) => {
    return { 
        type: LAYOUT, 
        layout: [row, col]
    }
}

export const setDicomdir = (dicomdir) => {
    return { 
        type: DICOMDIR, 
        dicomdir: dicomdir
    }
}

export const setFsCurrentDir = (dir) => {
    return { 
        type: FSCURRENTDIR, 
        fsCurrentDir: dir
    }
}

export const setFsCurrentList = (list) => {
    return { 
        type: FSCURRENTLIST, 
        fsCurrentList: list
    }
}

export const setZippedFile = (file) => {
    return { 
        type: FSZIPPEDFILE, 
        fsZippedFile: file
    }
}

export const doFsRefresh = () => {
    return { 
        type: FSREFRESH,
    }
}

export const setVolume = (volume) => {
    return { 
        type: VOLUME_STORE,
        volume: volume,
    }
}
/*
export const setLut = (lut) => {
    return { 
        type: LUT_STORE,
        lut: lut,
    }
}


export const sandboxedfileStore = (file) => {
    return { 
        type: SANDBOXEDFILE_STORE, 
        sandboxedFile: file
    }
}
*/