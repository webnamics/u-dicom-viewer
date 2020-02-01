import {
  CLEAR_STORE, 
  LOCALFILE_STORE,
  DCM_IS_OPEN, 
  DCM_TOOL, 
  ACTIVE_DCM_INDEX, 
  ACTIVE_DCM, 
  DCM_IMAGE,
  ACTIVE_MEASUREMENTS,
  LAYOUT,
  DICOMDIR,
  FSCURRENTDIR,
  FSCURRENTLIST,
  FSZIPPEDFILE,
  FSREFRESH,
  SANDBOXEDFILE_STORE,
} from '../actions'

export default function storeReducer(state={}, action) {
    //console.log('storeReducer: ', action)
    switch(action.type) {
      
      case CLEAR_STORE:
        return {
          localfile: state.localfile,
          isOpen: state.isOpen.map((el, i) => i === state.activeDcmIndex ? false : el),
          tool: null,
          activeDcmIndex: state.activeDcmIndex,
          activeDcm: state.activeDcm,
          images: [],
          measurements: null,
          layout: state.layout,
          dicomdir: state.dicomdir, 
          fsCurrentDir: state.fsCurrentDir,
          fsCurrentList: state.fsCurrentList,
          fsZippedFile: null,
          fsRefresh: state.fsRefresh,
          sandboxedFile: state.sandboxedFile,
        }    

      case LOCALFILE_STORE:
          return {
            ...state,
            localfile: action.localfile,     
            sandboxedFile: null,   
          } 

      case DCM_IS_OPEN:
          return {
            ...state,
            isOpen: state.isOpen.map((el, i) => i === state.activeDcmIndex ? action.value : el),
            images: [
              ...state.images
            ],            
            measurements: state.measurements,
            layout: state.layout,    
            dicomdir: state.dicomdir,    
            fsCurrentDir: state.fsCurrentDir,
            fsCurrentList: state.fsCurrentList,            
          }    

      case DCM_TOOL:
          return {
            ...state,
            tool: action.tool,
            images: [
              ...state.images
            ],  
            measurements: state.measurements,
            layout: state.layout,
            dicomdir: state.dicomdir,
            fsCurrentDir: state.fsCurrentDir,
            fsCurrentList: state.fsCurrentList,  
          }  

      case ACTIVE_DCM_INDEX:
          return {
            ...state,
            activeDcmIndex: action.activeDcmIndex,
            images: [
              ...state.images
            ],  
            measurements: state.measurements,
            layout: state.layout,
            dicomdir: state.dicomdir,
            fsCurrentDir: state.fsCurrentDir,
            fsCurrentList: state.fsCurrentList,  
          }  

      case ACTIVE_DCM:
          return {
            ...state,
            activeDcm: action.activeDcm,
            images: [
              ...state.images
            ],  
            measurements: state.measurements,
            layout: state.layout,
            dicomdir: state.dicomdir,
            fsCurrentDir: state.fsCurrentDir,
            fsCurrentList: state.fsCurrentList,  
          }            

      case DCM_IMAGE:
          return {
            ...state,
            images: [
              ...state.images,
              action.images,
            ],  
            measurements: state.measurements,
            layout: state.layout,
            dicomdir: state.dicomdir,
            fsCurrentDir: state.fsCurrentDir,
            fsCurrentList: state.fsCurrentList,  
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
              layout: action.layout,
              dicomdir: state.dicomdir,
              fsCurrentDir: state.fsCurrentDir,
              fsCurrentList: state.fsCurrentList,  
            }  

      case DICOMDIR:
            return {
              ...state,
              dicomdir: action.dicomdir
            }  

      case FSCURRENTDIR:
            return {
              ...state,
              fsCurrentDir: action.fsCurrentDir
            }  

      case FSCURRENTLIST:
            return {
              ...state,
              fsCurrentList: [...action.fsCurrentList]
            }  

      case FSZIPPEDFILE:
            return {
              ...state,
              fsZippedFile: action.fsZippedFile
            }  

      case FSREFRESH:
            return {
              ...state,
              fsRefresh: !state.fsRefresh
            }  

      case SANDBOXEDFILE_STORE:
        return {
          ...state,
          localfile: null,
          sandboxedFile: action.sandboxedFile,        
        } 

      default:
          return state
    }
  }
  