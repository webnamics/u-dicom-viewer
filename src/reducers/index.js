import {
  CLEAR_STORE, 
  LOAD_LOCALFILE, 
  LOAD_URL, 
  DCM_IS_OPEN, 
  DCM_NUMBER_OF_FRAMES, 
  DCM_TOOL, 
  DCM_IMAGE,
  MEASURE_STORE, 
  MEASURE_CLEAR, 
  MEASURE_REMOVE, 
  DCMDATA_STORE
} from '../actions'

export default function storeReducer(state={}, action) {
    switch(action.type) {
      
      case CLEAR_STORE:
        return {
          localfile: null,
          url: null,
          isOpen: false,
          numberOfFrames: 1,
          tool: null,
          images: [],
          header: [],
          measure: []
        }    

      case LOAD_LOCALFILE:
        return {
          localfile: action.localfile,
          url: null,
          isOpen: false,
          numberOfFrames: 1,
          tool: null,
          images: [],
          header: [],
          measure: []
        }    

      case LOAD_URL:
          return {
            localfile: null,
            url: action.url,
            isOpen: false,
            numberOfFrames: 1,
            tool: null,
            images: [],
            header: [],
            measure: []
          }    

      case DCM_IS_OPEN:
          return {
            ...state,
            isOpen: action.value,
            images: [
              ...state.images
            ],            
            header: [
              ...state.header
            ],
            measure: [
              ...state.measure
            ]            
          }    

      case DCM_NUMBER_OF_FRAMES:
          return {
            ...state,
            numberOfFrames: action.value,
            images: [
              ...state.images
            ],  
            header: [
              ...state.header
            ],
            measure: [
              ...state.measure
            ]
          }    

      case DCM_TOOL:
          return {
              ...state,
              tool: action.tool,
              images: [
                ...state.images
              ],  
              header: [
                ...state.header
              ],
              measure: [
                ...state.measure
              ]  
          }  

      case DCM_IMAGE:
          return {
              ...state,
              images: [
                ...state.images,
                action.images,
              ],  
              header: [
                ...state.header
              ],
              measure: [
                ...state.measure
              ]  
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
            { 'name': name, 'value': value },
          ],
        }   

      case MEASURE_STORE:
        return {
          ...state,
          images: [
            ...state.images
          ],
          header: [
            ...state.header
          ],          
          measure: [
            ...state.measure,
            action.measure,
          ],
        }   

      case MEASURE_REMOVE:
        let measure = [...state.measure]
        measure.splice(action.index, 1)
        return {
          ...state,
          images: [
            ...state.images
          ],
          header: [
            ...state.header
          ],          
          measure: [
            ...measure,
          ],
        }   

      case MEASURE_CLEAR:
            return {
              ...state,
              images: [
                ...state.images
              ],
              header: [
                ...state.header
              ],          
              measure: [],
            }  

      default:
          return state
    }
  }
  