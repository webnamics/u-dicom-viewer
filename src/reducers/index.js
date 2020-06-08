import {
  CLEAR_STORE, 
  LOCALFILE_STORE,
  FSFILE_STORE,
  //ALLFILES_STORE,
  FILES_STORE,
  SERIES_STORE,
  DCM_IS_OPEN, 
  DCM_TOOL, 
  ACTIVE_DCM_INDEX, 
  ACTIVE_DCM,
  ACTIVE_MEASUREMENTS,
  EXPLORER_STORE,
  EXPLORER_ACTIVE_PATIENT_INDEX,
  EXPLORER_ACTIVE_STUDY_INDEX,
  EXPLORER_ACTIVE_SERIES_INDEX,
  LAYOUT,
  DICOMDIR,
  FSCURRENTDIR,
  FSCURRENTLIST,
  FSZIPPEDFILE,
  FSREFRESH,
  VOLUME_STORE,
  DCMENABLETOOL_STORE,
} from '../actions'

export default function storeReducer(state={}, action) {
    //console.log('storeReducer: ', action)
    switch(action.type) {
      
      case CLEAR_STORE:
        return {
          localFile: state.localFile,
          fsFile: state.fsFile,
          //allfiles: null,
          files: null, 
          series: null,
          isOpen: state.isOpen.map((el, i) => i === state.activeDcmIndex ? false : el),
          tool: null,
          activeDcmIndex: state.activeDcmIndex,
          activeDcm: state.activeDcm,
          explorer: state.explorer,
          explorerActivePatientIndex: state.explorerActivePatientIndex,
          explorerActiveStudyIndex: state.explorerActiveStudyIndex,
          explorerActiveSeriesIndex: state.explorerActiveSeriesIndex,
          measurements: null,
          layout: state.layout,
          dicomdir: state.dicomdir, 
          fsCurrentDir: state.fsCurrentDir,
          fsCurrentList: state.fsCurrentList,
          fsZippedFile: null,
          fsRefresh: state.fsRefresh,
          volume: null,
          //lut: null,
          dcmEnableTool: false
        }    

      case LOCALFILE_STORE:
          return {
            ...state,
            localFile: action.localFile,     
            fsFile: null,   
          } 

      case FSFILE_STORE:
          return {
            ...state,
            localFile: null,     
            fsFile: action.fsFile,   
          }
/*
      case ALLFILES_STORE:
          return {
            ...state,
            allFiles: action.allFiles,  
          } 
*/
      case FILES_STORE:
          return {
            ...state,
            files: action.files,  
          } 

      case SERIES_STORE:
          return {
            ...state,
            series: action.series,  
          }

      case DCM_IS_OPEN:
          return {
            ...state,
            isOpen: state.isOpen.map((el, i) => i === action.value.index ? action.value.value : el),    
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

      case EXPLORER_STORE:
        return {
          ...state,
          explorer: action.explorer,
        }  

      case EXPLORER_ACTIVE_PATIENT_INDEX:
        return {
          ...state,
          explorerActivePatientIndex: action.explorerActivePatientIndex,
        }

      case EXPLORER_ACTIVE_STUDY_INDEX:
        return {
          ...state,
          explorerActiveStudyIndex: action.explorerActiveStudyIndex,
        }

      case EXPLORER_ACTIVE_SERIES_INDEX:
        return {
          ...state,
          explorerActiveSeriesIndex: action.explorerActiveSeriesIndex,
        }    

      case LAYOUT:
            return {
              ...state,
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

      case VOLUME_STORE:
        return {
          ...state,
          volume: action.volume,        
        }      

      case DCMENABLETOOL_STORE:
        return {
          ...state,
          dcmEnableTool: action.dcmEnableTool,        
        }   

      default:
          return state
    }
  }
  