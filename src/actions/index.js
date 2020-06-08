export const CLEAR_STORE = 'CLEAR_STORE'
export const LOCALFILE_STORE = 'LOCALFILE_STORE'
export const FSFILE_STORE = 'LOCALFILE_STORE'
//export const ALLFILES_STORE = 'ALLFILES_STORE'
export const FILES_STORE = 'FILES_STORE'
export const SERIES_STORE = 'SERIES_STORE'
export const DCM_IS_OPEN = 'DCM_IS_OPEN'
export const DCM_TOOL = 'DCM_TOOL'
export const ACTIVE_DCM_INDEX = 'ACTIVE_DCM_INDEX'
export const ACTIVE_DCM = 'ACTIVE_DCM'
export const ACTIVE_MEASUREMENTS = 'ACTIVE_MEASUREMENTS'
export const EXPLORER_STORE = 'EXPLORER_STORE'
export const EXPLORER_ACTIVE_PATIENT_INDEX = 'EXPLORER_ACTIVE_PATIENT_INDEX'
export const EXPLORER_ACTIVE_STUDY_INDEX = 'EXPLORER_ACTIVE_STUDY_INDEX'
export const EXPLORER_ACTIVE_SERIES_INDEX = 'EXPLORER_ACTIVE_SERIES_INDEX'
export const LAYOUT = 'LAYOUT'
export const DICOMDIR = 'DICOMDIR'
export const FSCURRENTDIR = 'FSCURRENTDIR'
export const FSCURRENTLIST = 'FSCURRENTLIST'
export const FSZIPPEDFILE = 'FSZIPPEDFILE'
export const FSREFRESH = 'FSREFRESH'
export const VOLUME_STORE = 'VOLUME_STORE'
export const DCMENABLETOOL_STORE = 'DCMENABLETOOL_STORE'

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
/*
export const allFilesStore = (files) => {
    return { 
        type: ALLFILES_STORE, 
        allFiles: files
    }
}
*/
export const filesStore = (files) => {
    return { 
        type: FILES_STORE, 
        files: files
    }
}

export const seriesStore = (series) => {
    return { 
        type: SERIES_STORE, 
        series: series
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

export const activeMeasurements = (measurements) => {
    return { 
        type: ACTIVE_MEASUREMENTS, 
        measurements: measurements 
    }
}

export const explorer = (data) => {
    return { 
        type: EXPLORER_STORE, 
        explorer: data 
    }
}

export const explorerActivePatientIndex = (index) => {
    return { 
        type: EXPLORER_ACTIVE_PATIENT_INDEX, 
        explorerActivePatientIndex: index 
    }
}

export const explorerActiveStudyIndex = (index) => {
    return { 
        type: EXPLORER_ACTIVE_STUDY_INDEX, 
        explorerActiveStudyIndex: index 
    }
}

export const explorerActiveSeriesIndex = (index) => {
    return { 
        type: EXPLORER_ACTIVE_SERIES_INDEX, 
        explorerActiveSeriesIndex: index 
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

export const setDcmEnableTool = (value) => {
    return { 
        type: DCMENABLETOOL_STORE,
        dcmEnableTool: value,
    }
}
