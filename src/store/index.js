import {createStore} from 'redux'
import storeReducer from '../reducers/index'

let initialState = {
    localfile: null,
    url: null,
    isOpen: false,
    numberOfFrames: 1,
    tool: null,
    images: [],
    header: [],
    measure: []
}

const store = createStore(storeReducer, initialState,
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__())

export default store
