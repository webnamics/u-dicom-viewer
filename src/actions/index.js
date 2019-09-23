/*
 * action types
 */

export const LOAD_LOCALFILE = 'LOAD_LOCALFILE'
export const LOAD_URL = 'LOAD_URL'
export const DCM_IS_OPEN = 'DCM_IS_OPEN'
export const DCM_NUMBER_OF_FRAMES = 'DCM_NUMBER_OF_FRAMES'
export const DCM_TOOL = 'DCM_TOOL'
export const DCMDATA_STORE = 'DCMDATA_STORE'

/*
 * action creators
 */

export const loadLocalfile = (file) => {
    return { 
        type: LOAD_LOCALFILE, 
        localfile: file 
    }
}

export const loadUrl = (url) => {
    return { 
        type: LOAD_URL, 
        url: url 
    }
}

export const dcmDataStore = (data) => {
    return { 
        type: DCMDATA_STORE, 
        data: data 
    }
}

export const dcmIsOpen = (value) => {
    return { 
        type: DCM_IS_OPEN, 
        value: value 
    }
}

export const dcmNumberOfFrames = (value) => {
    return { 
        type: DCM_NUMBER_OF_FRAMES, 
        value: value 
    }
}

export const dcmTool = (tool) => {
    return { 
        type: DCM_TOOL, 
        tool: tool 
    }
}