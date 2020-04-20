import {createStore} from 'redux'
import storeReducer from '../reducers/index'

let initialState = {
    localFile: null,
    fsFile: null,
    files: null,
    isOpen: new Array(16).fill(false),
    tool: null,
    activeDcmIndex: 0,
    activeDcm: null,
    //images: [],
    measurements: [],
    layout: [1,1], // first element represents the rows, second the columns
    dicomdir: null,
    fsCurrentDir: '',
    fsCurrentList: [],
    fsZippedFile: null,
    fsRefresh: false,
    volume: null,
    //lut: null,
    //sandboxedFile: null,
}

const store = createStore(storeReducer, initialState,
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__())

export default store
