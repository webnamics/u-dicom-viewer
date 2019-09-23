import {LOAD_LOCALFILE, LOAD_URL, DCMDATA_STORE, DCM_IS_OPEN, DCM_NUMBER_OF_FRAMES, DCM_TOOL} from '../actions'

export default function storeReducer(state={}, action) {
    switch(action.type) {
      case LOAD_LOCALFILE:
        //console.log('storeReducer - LOAD_LOCALFILE: ', action.localfile)
        return {
          localfile: action.localfile,
          url: null,
          isOpen: false,
          numberOfFrames: 1,
          tool: null,
          header: []
        }    

      case LOAD_URL:
          return {
            localfile: null,
            url: action.url,
            isOpen: false,
            numberOfFrames: 1,
            tool: null,
            header: []
          }    

      case DCMDATA_STORE:
        const [name, value] = action.data
        if (value === undefined) {
          return state
        }
        return {
          ...state,
          header: [
            ...state.header,
            {'name': name, 'value': value},
          ],
        }   

      case DCM_IS_OPEN:
          return {
            ...state,
            isOpen: action.value,
            header: [
              ...state.header
            ]
          }    

      case DCM_NUMBER_OF_FRAMES:
          return {
            ...state,
            numberOfFrames: action.value,
            header: [
              ...state.header
            ]
          }    

      case DCM_TOOL:
          return {
              ...state,
              tool: action.tool,
              header: [
                ...state.header
              ]
          }  

      default:
          return state
    }
  }
  