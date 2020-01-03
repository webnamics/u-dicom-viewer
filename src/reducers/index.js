import {
  CLEAR_STORE, 
  DCM_IS_OPEN, 
  DCM_TOOL, 
  ACTIVE_DCM_INDEX, 
  ACTIVE_DCM, 
  DCM_IMAGE,
  ACTIVE_MEASUREMENTS,
  LAYOUT
} from '../actions'

export default function storeReducer(state={}, action) {
    switch(action.type) {
      
      case CLEAR_STORE:
        return {
          isOpen: state.isOpen.map((el, i) => i === state.activeDcmIndex ? false : el),
          tool: null,
          activeDcmIndex: state.activeDcmIndex,
          activeDcm: state.activeDcm,
          images: [],
          measurements: null,
          layout: state.layout
        }    

      case DCM_IS_OPEN:
          return {
            ...state,
            isOpen: state.isOpen.map((el, i) => i === state.activeDcmIndex ? action.value : el),
            images: [
              ...state.images
            ],            
            measurements: state.measurements,
            layout: state.layout        
          }    

      case DCM_TOOL:
          return {
            ...state,
            tool: action.tool,
            images: [
              ...state.images
            ],  
            measurements: state.measurements,
            layout: state.layout
          }  

      case ACTIVE_DCM_INDEX:
          return {
            ...state,
            activeDcmIndex: action.activeDcmIndex,
            images: [
              ...state.images
            ],  
            measurements: state.measurements,
            layout: state.layout
          }  

      case ACTIVE_DCM:
          return {
            ...state,
            activeDcm: action.activeDcm,
            images: [
              ...state.images
            ],  
            measurements: state.measurements,
            layout: state.layout
          }            

      case DCM_IMAGE:
          return {
            ...state,
            images: [
              ...state.images,
              action.images,
            ],  
            measurements: state.measurements,
            layout: state.layout
          } 

      case ACTIVE_MEASUREMENTS:
        return {
          ...state,
          measurements: [...action.measurements],
        }             

      case LAYOUT:
            return {
              ...state,
              images: [...state.images],
              measurements: state.measurements,
              layout: action.layout
            }  

      default:
          return state
    }
  }
  