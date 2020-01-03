import React from "react"
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import Link from '@material-ui/core/Link'
import Typography from '@material-ui/core/Typography'
import Hammer from "hammerjs"
import * as cornerstone from "cornerstone-core"
import * as cornerstoneTools from "cornerstone-tools"
import * as cornerstoneMath from "cornerstone-math"
import * as cornerstoneFileImageLoader from "cornerstone-file-image-loader"
import * as cornerstoneWebImageLoader from "cornerstone-web-image-loader"
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader"
import * as dicomParser from 'dicom-parser'
import {connect} from 'react-redux'
import {clearStore, dcmIsOpen, activeDcm, dcmTool, activeMeasurements} from '../actions'
import {uids} from '../constants/uids'
import { SETTINGS_SAVEAS } from '../constants/settings'
import OpenUrlDlg from './OpenUrlDlg'
import CinePlayer from './CinePlayer'
import { getSettingsOverlay } from '../functions'
import { isMobile } from 'react-device-detect'
import { import as csTools } from 'cornerstone-tools'
import db from '../db/db'
import { isFileImage } from '../functions'
import { isUrlImage } from '../functions'
const scrollToIndex = csTools('util/scrollToIndex')


function getBlobUrl(url) {
  const baseUrl = window.URL || window.webkitURL;
  const blob = new Blob([`importScripts('${url}')`], {type: "application/javascript"});
  return baseUrl.createObjectURL(blob);
}

let webWorkerUrl = getBlobUrl(
  "https://unpkg.com/cornerstone-wado-image-loader@3.0.0/dist/cornerstoneWADOImageLoaderWebWorker.min.js"
)
let codecsUrl = getBlobUrl(
  "https://unpkg.com/cornerstone-wado-image-loader@3.0.0/dist/cornerstoneWADOImageLoaderCodecs.js"
  // "https://unpkg.com/cornerstone-wado-image-loader/dist/cornerstoneWADOImageLoaderCodecs.js"
)
// See componentDidMount line 110 for initialization, registration
const config = {
  maxWebWorkers: 4, //
  //startWebWorkersOnDemand: true, //
  webWorkerPath: webWorkerUrl,
  //webWorkerTaskPaths: [], //
  taskConfiguration: {
    decodeTask: {
      //loadCodecsOnStartup: true, //
      //initializeCodecsOnStartup: false, //
      codecsPath: codecsUrl,
      //usePDFJS: false, //
      //strict: true //
    }
  }
}
cornerstoneTools.external.cornerstone = cornerstone
cornerstoneTools.external.cornerstoneMath = cornerstoneMath
cornerstoneFileImageLoader.external.cornerstone = cornerstone
cornerstoneWebImageLoader.external.cornerstone = cornerstone
cornerstoneWADOImageLoader.external.cornerstone = cornerstone
cornerstoneWADOImageLoader.webWorkerManager.initialize(config)
cornerstoneWADOImageLoader.external.dicomParser = dicomParser
cornerstoneTools.external.Hammer = Hammer
cornerstoneTools.init()

//console.log({ cornerstone })
//console.log({ cornerstoneWADOImageLoader })
//console.log({ dicomParser })

class DicomViewer extends React.Component {
    constructor(props) {
      super(props)
      this.localfile = null
      this.localurl = null
      this.dicomImage = null
      this.imageId = null
      this.image = null
      this.isDicom = false
      this.numberOfFrames = 1
      this.measurements = []
    }

    state = { 
      file: null,
      visibleOpenUrlDlg: false,
      progress: null,
      visibleCinePlayer: false,
      errorOnOpenImage: null,
      errorOnCors: false,
      frame: 1,
      inPlay: false,
      viewport: null,
    }
  
    componentDidMount() {
      this.props.runTool(this)
      this.props.changeTool(this)
      cornerstone.events.addEventListener('cornerstoneimageloaded', this.onImageLoaded)
      const { dcmRef } = this.props
      dcmRef(this)          
    }

    componentWillUnmount() {
      this.props.runTool(undefined)
      this.props.changeTool(undefined)
      const { dcmRef } = this.props
      dcmRef(undefined)            
    }

    componentDidUpdate(previousProps) {
      const isOpen = this.props.isOpen[this.props.index]
      if (this.props.layout !== previousProps.layout && isOpen) {
        //console.log('dicomImage: ', this.dicomImage)
        cornerstone.resize(this.dicomImage)        
      }
    }
  
    onOpenUrl = (e) => {
      const eventData = e.detail
      this.setState({ progress: eventData.percentComplete })
    }

    showOpenUrlDlg = (url) => {
      this.setState({ visibleOpenUrlDlg: true }, () => {
        cornerstone.events.addEventListener('cornerstoneimageloadprogress', this.onOpenUrl)
        this.loadImage(undefined, url)
      })
    }
  
    hideOpenUrlDlg = () => {
      this.setState({ visibleOpenUrlDlg: false, progress: null })
    }

    measurementSave = (measure) => {
      this.measurements.push(measure) 
    }

    measurementClear = () => {
      this.measurements.splice(0, this.measurements.length)
    }

    measurementRemove = (index) => {
      //console.log('this.measurements: ', this.measurements)
      this.measurements.splice(index, 1)
    }    

    getTransferSyntax = () => {
      const value = this.image.data.string('x00020010')
      return value + ' [' + uids[value] + ']'
    }

    getSopClass = () => {
      const value = this.image.data.string('x00080016')
      return value + ' [' + uids[value] + ']'
    }

    getSopInstanceUID = () => {
      const value = this.image.data.string('x00080018')
      return value
    }

    getPixelRepresentation = () => {
      const value = this.image.data.uint16('x00280103')
      if (value === undefined) return
      return value + (value === 0 ? ' (unsigned)' : ' (signed)')
    }

    getPlanarConfiguration = () => {
      const value = this.image.data.uint16('x00280006')
      if (value === undefined) return 
      return value + (value === 0 ? ' (pixel)' : ' (plane)')
    }

    
    onImageLoaded = (e) => {
      //console.log('cornerstoneimageloaded: ')

    }

    // Listen for changes to the viewport so we can update the text overlays in the corner
    onImageRendered = (e) => {
      //console.log('cornerstoneimagerendered: ')

      const viewport = cornerstone.getViewport(e.target)

      //console.log('viewport: ', viewport)

      if (this.isDicom) document.getElementById(
        `mrtopleft-${this.props.index}`
      ).textContent = `${this.PatientsName}`

      document.getElementById(
        `mrtopright-${this.props.index}`
      ).textContent = `${viewport.displayedArea.brhc.x}x${viewport.displayedArea.brhc.y}`

      document.getElementById(
        `mrbottomleft-${this.props.index}`
      ).textContent = `WW/WC: ${Math.round(viewport.voi.windowWidth)}/${Math.round(viewport.voi.windowCenter)}`

      document.getElementById(
        `mrbottomright-${this.props.index}`
      ).textContent = `Zoom: ${Math.round(viewport.scale.toFixed(2)*100)}%`

      if (this.isDicom && this.state.visibleCinePlayer && this.numberOfFrames > 1) {
        document.getElementById(
          `frameLabel-${this.props.index}`
        ).textContent = `${this.state.frame} / ${this.numberOfFrames}`
        if (this.state.inPlay) {
          let frame = this.state.frame === this.numberOfFrames ? 1 : this.state.frame+1
          this.setState({frame: frame})
        }
      }
      
    }

    onMeasurementModified = (e) => {
      //console.log('cornerstonetoolsmeasurementmodified: ', e.detail.measurementData)
    }

    onMeasurementCompleted = (e) => {
      //console.log('cornerstonetoolsmeasurementcompleted: ', e.detail.measurementData)
      
      const measure = {
        tool: this.props.tool,
        note: '',
        data: e.detail.measurementData
      }
      //this.props.measurementStore(measure)
      this.measurementSave(measure)
      this.props.setActiveMeasurements(this.measurements)
      //console.log('this.measurements: ', this.measurements)
    }
    
    onErrorOpenImageClose = () => {
      this.setState({errorOnOpenImage: null})
    }

    onErrorCorsClose = () => {
      this.setState({errorOnCors: false})
    }    

    loadImage = (localfile, url=undefined) => {
      //console.log('loadImage, localfile: ', localfile)
      //console.log('loadImage, url: ', url)

      if (localfile === undefined && url === undefined) return
      
      if (localfile !== undefined) {
        //this.props.localfileStore(localfile)
        this.localfile = localfile
      } else {
        //this.props.urlStore(url)
        this.localurl = url
      }
 
      const element = this.dicomImage

      element.addEventListener("cornerstonenewimage", this.onNewImage)
      element.addEventListener("cornerstoneimagerendered", this.onImageRendered)
      element.addEventListener("cornerstonetoolsmeasurementadded", this.onMeasurementAdded)
      element.addEventListener("cornerstonetoolsmeasurementmodified", this.onMeasurementModified)
      element.addEventListener("cornerstonetoolsmeasurementcompleted", this.onMeasurementCompleted)

      let imageId = undefined

      cornerstone.enable(element)

      if (localfile === undefined && isUrlImage(url)) { // check if it's a simple image [jpeg or png] from url
        //const file = "file:///C:/GARBAGE/_DCM/"+localfile.name
        //console.log('image: ', file)
        cornerstone.loadImage(url).then(image => {
          console.log('loadImage, image from url: ', image)

          this.hideOpenUrlDlg()

          this.image = image

          //this.setState({isDicom: false})
          this.isDicom = false

          cornerstone.displayImage(element, image)
          
          this.enableTool()

          this.props.setActiveDcm({image: this.image, element: this.dicomImage, isDicom: this.isDicom})
          this.props.isOpenStore(true)

        }, (e) => {
          console.log('error', e)
          this.setState({errorOnOpenImage: "This is not a valid JPG or PNG file."})
        })

      } else if (localfile !== undefined && isFileImage(localfile)) { // otherwise try to open as local image file (JPEG, PNG) 
        imageId = cornerstoneFileImageLoader.fileManager.add(localfile)
        cornerstone.loadImage(imageId).then(image => {
          //console.log('loadImage, image from local: ', image)

          this.image = image

          this.isDicom = false

          cornerstone.displayImage(element, image)
          
          this.enableTool()

          this.props.setActiveDcm({image: this.image, element: this.dicomImage, isDicom: this.isDicom})
          this.props.isOpenStore(true)

        }, (e) => {
          console.log('error', e)
          this.setState({errorOnOpenImage: "This is not a valid JPG or PNG file."})
        })

      } else { // otherwise try to open as Dicom file

        if (localfile !== undefined) {
          imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(localfile)
        } else { // it's a web dicom image
          imageId = "wadouri:"+url
        }
  
        console.log('loadImage, imageId: ', imageId)

        cornerstone.loadAndCacheImage(imageId).then(image => {
          //console.log('loadImage, image: ', image)

          this.hideOpenUrlDlg()

          this.image = image

          this.isDicom = true
          
          this.PatientsName = image.data.string('x00100010')
          this.sopInstanceUid = this.getSopInstanceUID()

          let stack = { currentImageIdIndex: 0, imageIds: "" }
          this.numberOfFrames = image.data.intString('x00280008')
          if (this.numberOfFrames > 0) {
            //console.log('nFrames: ', nFrames)
            //this.props.numberOfFramesStore(nFrames)
            let imageIds = []	
            for(var i=0; i < this.numberOfFrames; ++i) {
              imageIds.push(imageId + "?frame="+i)
            }	
            stack.imageIds = imageIds;
            //console.log(stack.imageIds)
          }

          console.log('displayImage: ')
          cornerstone.displayImage(element, image)
          //cornerstoneTools.mouseInput.enable(element);
          //cornerstoneTools.mouseWheelInput.enable(element);

          this.enableTool()

          if (this.numberOfFrames > 1) {
            cornerstoneTools.addStackStateManager(element, ['stack', 'playClip']);    
            cornerstoneTools.addToolState(element, 'stack', stack)
            //cornerstoneTools.setToolActive('StackScrollMouseWheel', { })
            this.setState({frame: 1})
          }
  
          // Load the possible measurements from DB and save in the store 
          db.measurement.where('sopinstanceuid').equals(this.sopInstanceUid).each(measure => {
            console.log('load measure from db: ', measure)
            //this.props.measurementStore(measure)
            this.measurementSave(measure)
            cornerstoneTools.addToolState(element, measure.tool, measure.data)
            this.runTool(measure.tool)
            cornerstone.updateImage(element)
            cornerstoneTools.setToolEnabled(measure.tool)
          }).then(() => {
            //console.log('this.measurements: ', this.measurements)
            this.props.setActiveMeasurements(this.measurements)
            this.props.setActiveDcm({image: this.image, element: this.dicomImage, isDicom: this.isDicom})
            this.props.isOpenStore(true)            
          })       

        }, (e) => {
          console.log('error', e)   
          this.hideOpenUrlDlg()      
          //console.log('toString: ', e.error.toString())
          if (e.error.toString() === '[object XMLHttpRequest]') {
            this.setState({errorOnCors: true})
          } else {
            let pos = e.error.indexOf(":")
            this.setState({errorOnOpenImage: pos < 0 ? e.error : e.error.substring(pos+1)})            
          }
 
        })

      }

    }
  
    enableTool = (toolName, mouseButtonNumber) => {
      // Enable all tools we want to use with this element
      const WwwcTool = cornerstoneTools.WwwcTool;
      const LengthTool = cornerstoneTools['LengthTool']
      const PanTool = cornerstoneTools.PanTool
      const ZoomTouchPinchTool = cornerstoneTools.ZoomTouchPinchTool
      const ZoomTool = cornerstoneTools.ZoomTool
      const ProbeTool = cornerstoneTools.ProbeTool
      const EllipticalRoiTool = cornerstoneTools.EllipticalRoiTool
      const RectangleRoiTool = cornerstoneTools.RectangleRoiTool
      const FreehandRoiTool = cornerstoneTools.FreehandRoiTool
      const AngleTool = cornerstoneTools.AngleTool
      const MagnifyTool = cornerstoneTools.MagnifyTool
      const StackScrollMouseWheelTool = cornerstoneTools.StackScrollMouseWheelTool

      cornerstoneTools.addTool(MagnifyTool)
      cornerstoneTools.addTool(AngleTool)    
      cornerstoneTools.addTool(WwwcTool)
      cornerstoneTools.addTool(LengthTool)
      cornerstoneTools.addTool(PanTool)
      cornerstoneTools.addTool(ZoomTouchPinchTool)
      cornerstoneTools.addTool(ZoomTool)
      cornerstoneTools.addTool(ProbeTool)
      cornerstoneTools.addTool(EllipticalRoiTool)
      cornerstoneTools.addTool(RectangleRoiTool)
      cornerstoneTools.addTool(FreehandRoiTool)
      cornerstoneTools.addTool(StackScrollMouseWheelTool)      
    }
  
    // helper function used by the tool button handlers to disable the active tool
    // before making a new tool active
    disableAllTools = () => {
      cornerstoneTools.setToolEnabled('Length')
      cornerstoneTools.setToolEnabled('Pan')
      cornerstoneTools.setToolEnabled('Magnify')
      cornerstoneTools.setToolEnabled('Angle')
      cornerstoneTools.setToolEnabled('RectangleRoi')
      cornerstoneTools.setToolEnabled('Wwwc')
      cornerstoneTools.setToolEnabled('ZoomTouchPinch')
      cornerstoneTools.setToolEnabled('Probe')
      cornerstoneTools.setToolEnabled('EllipticalRoi')
      cornerstoneTools.setToolEnabled('StackScrollMouseWheel')
    }
  
    runTool = (toolName, opt) => {
      console.log('run tool: ', toolName)
//      this.disableAllTools()
      switch (toolName) {
        case 'openfile': {
          cornerstone.disable(this.dicomImage)
          this.setState({ file: opt })
          this.loadImage(opt)
          break   
        } 
        case 'openurl': {
          console.log('run tool opt: ', opt)  
          this.showOpenUrlDlg(opt)
          break                 
        }
        case 'clear': {
          //if (this.state.visibleHistogram) this.runTool('Histogram')
          //console.log('this.dicomImage: ', this.dicomImage)
          this.setState({ visibleCinePlayer: false })
          this.props.clearingStore()
          cornerstone.disable(this.dicomImage)
          break
        }  
        case 'notool': {
          this.disableAllTools()

          //const element = this.dicomImage

          //cornerstoneTools.clearToolState(element, 'Length')
          
          //const toolStateManager = cornerstoneTools.getElementToolStateManager(element)
          //console.log('toolStateManager.toolState: ', toolStateManager.toolState)
          /*
          const toolState = toolStateManager.toolState
          // const allTools = Object.keys(toolState).map(key => toolState[key])
          let key = Object.keys(toolState)[0]
          let allTools = toolState[key]
          //console.log('allTools: ', allTools)

          for (let [tool, data] of Object.entries(allTools)) {
            //console.log(`${tool}: `, data)
            let key = Object.keys(data)[0]
            let tools = data[key]
            //console.log('tools: ', tools)
            tools.forEach(item => {
              //console.log('tool: ', tool)
              //console.log(item)
              const measure = {
                tool: tool,
                note: '',
                data: item
              }
              console.log('measure: ', measure)
              this.props.measurementStore(measure)
            })
          }
          */
          //const toolState = toolStateManager.get(element, 'Length')
          //console.log('toolState: ', toolState)

          /*
          const measurementData = {
            visible: true,
            active: true,
            invalidated: true,
            handles: {
                start: {
                    x: 100,
                    y: 100,
                    highlight: true,
                    active: false
                },
                end: {
                    x: 200,
                    y: 200,
                    highlight: true,
                    active: true
                },
                textBox: {
                    active: false,
                    hasMoved: false,
                    movesIndependently: false,
                    drawnIndependently: true,
                    allowedOutsideImage: true,
                    hasBoundingBox: true
                }
              }
          }
          cornerstoneTools.addToolState(element, 'RectangleRoi', measurementData)    
          cornerstoneTools.setToolActive('RectangleRoi', { mouseButtonMask: 1 })
          */  
          //cornerstone.updateImage(element)   
          break
        }
        case 'Wwwc': {
          cornerstoneTools.setToolActive('Wwwc', { mouseButtonMask: 1 })
          break
        }  
        case 'Pan': {
          cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 1 })
          break   
        }  
        case 'Zoom': {
          cornerstoneTools.setToolActive(isMobile ? 'ZoomTouchPinch' : 'Zoom', { mouseButtonMask: 1 })
          break
        }
        case 'Length': {
          cornerstoneTools.setToolActive('Length', isMobile ? { isTouchActive: true } : { mouseButtonMask: 1 })
          break  
        }
        case 'Probe': {
            cornerstoneTools.setToolActive('Probe', { mouseButtonMask: 1 })
          break
        }
        case 'EllipticalRoi': {
          cornerstoneTools.setToolActive('EllipticalRoi', { mouseButtonMask: 1 })
          break   
        }
        case 'RectangleRoi': {
          cornerstoneTools.setToolActive('RectangleRoi', { mouseButtonMask: 1 })
          break  
        }
        case 'Angle': {
          cornerstoneTools.setToolActive('Angle', { mouseButtonMask: 1 })
          break 
        }
        case 'Magnify': {
          cornerstoneTools.setToolActive('Magnify', { mouseButtonMask: 1 })
          break  
        }
        case 'FreehandRoi': {
          cornerstoneTools.setToolActive('FreehandRoi', { mouseButtonMask: 1 })
          break 
        }
        case 'Invert': {
          const element = this.dicomImage

          const viewport = cornerstone.getViewport(element)

          viewport.invert = !viewport.invert
          
          cornerstone.setViewport(element, viewport)

          console.log('viewport: ', viewport)

          break 
        }         
        case 'saveas': {
            let type = localStorage.getItem(SETTINGS_SAVEAS)
            cornerstoneTools.SaveAs(this.dicomImage, `${this.state.file.name}.${type}`, `image/${type}`)      
          break
        }
        case 'cine': {
          this.setState({ visibleCinePlayer: !this.state.visibleCinePlayer })
          break
        }
        case 'reset': {
          this.reset()
          break
        }
        case 'removetool': {
          console.log('removetool index: ', opt)
          const element = this.dicomImage
          cornerstoneTools.removeToolState(element, this.measurements[opt].tool, this.measurements[opt].data)
          cornerstone.updateImage(element)
          //this.props.measurementRemoveStore(opt)
          this.measurementRemove(opt)
          this.props.setActiveMeasurements(this.measurements)
          break
        }  
        case 'removetools': {   
          const element = this.dicomImage
          // for each measurement remove it 
          this.measurements.forEach(measure => {
            cornerstoneTools.clearToolState(element, measure.tool)         
          })
          cornerstone.updateImage(element)
          this.measurementClear()
          // also remove all measurements from db
          db.measurement.where('sopinstanceuid').equals(this.sopInstanceUid).delete()
          this.props.setActiveMeasurements(this.measurements)
          break
        }  
        case 'savetools': {
          // first, remove eventually previous measurements from db
          db.measurement.where('sopinstanceuid').equals(this.sopInstanceUid).delete()
          // then save all the current measurements
          this.measurements.forEach(measure => {
            try {
              db.measurement.add({
                sopinstanceuid: this.sopInstanceUid, 
                tool: measure.tool,
                note: measure.note,
                data: measure.data
              })
            } catch(error) {
              console.error(error)
            }                       
          })
          break
        }
        default: {
          break
        }
      }
    } 

    changeTool = (toolName, value) => {
      console.log('change tool, value: ', toolName, value)

      switch (toolName) {
        case 'Wwwc':
          if (value === 1) {
            cornerstoneTools.setToolActive('Wwwc', { mouseButtonMask: 1 })
          } else if (value === 0) {
            cornerstoneTools.setToolPassive('Wwwc')
          }
          break  
        case 'Pan':
          if (value === 1) {
            cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 1 })
          } else if (value === 0) {
            cornerstoneTools.setToolPassive('Pan')
          }
          break    
        case 'Zoom':
          if (value === 1) {
            cornerstoneTools.setToolActive(isMobile ? 'ZoomTouchPinch' : 'Zoom', { mouseButtonMask: 1 })
          } else if (value === 0) {
            cornerstoneTools.setToolPassive(isMobile ? 'ZoomTouchPinch' : 'Zoom')
          }
          break                             
        case 'Length':
          if (value === 1) {
            cornerstoneTools.setToolActive('Length', isMobile ? { isTouchActive: true } : { mouseButtonMask: 1 })
          } else if (value === 0) {
            cornerstoneTools.setToolPassive('Length')
          }
          break   
        case 'Probe':
          if (value === 1) {
            cornerstoneTools.setToolActive('Probe', { mouseButtonMask: 1 })
          } else if (value === 0) {
            cornerstoneTools.setToolPassive('Probe')
          }
          break        
        case 'Angle':
          if (value === 1) {
            cornerstoneTools.setToolActive('Angle', { mouseButtonMask: 1 })
          } else if (value === 0) {
            cornerstoneTools.setToolPassive('Angle')
          }          
          break   
        case 'Magnify':
          if (value === 1) {
            cornerstoneTools.setToolActive('Magnify', { mouseButtonMask: 1 })
          } else if (value === 0) {
            cornerstoneTools.setToolPassive('Magnify')
          }          
          break        
        case 'EllipticalRoi':
          if (value === 1) {
            cornerstoneTools.setToolActive('EllipticalRoi', { mouseButtonMask: 1 })
          } else if (value === 0) {
            cornerstoneTools.setToolPassive('EllipticalRoi')
          }
          break   
        case 'RectangleRoi':
          if (value === 1) {
            cornerstoneTools.setToolActive('RectangleRoi', { mouseButtonMask: 1 })
          } else if (value === 0) {
            cornerstoneTools.setToolPassive('RectangleRoi')
          }
          break
        case 'FreehandRoi':
          if (value === 1) {
            cornerstoneTools.setToolActive('FreehandRoi', { mouseButtonMask: 1 })
          } else if (value === 0) {
            cornerstoneTools.setToolPassive('FreehandRoi')
          }
          break     
        default:
            break
        }  
    }

    runCinePlayer = (cmdName) => {
      //console.log('this.state.frame: ', this.state.frame)
      const element = this.dicomImage
      switch (cmdName) {
        case 'firstframe': {
          let frame = 1
          this.setState({frame: frame})
          scrollToIndex(element, 0)
          break
        }
        case 'previousframe': {
          if (this.state.frame > 1) {
            let frame = this.state.frame-1
            this.setState({frame: frame})     
            scrollToIndex(element, frame-1)       
          }
          break
        }
        case 'play': {
          cornerstoneTools.playClip(element, 30)
          this.setState({inPlay: true})
          break
        }
        case 'pause': {
            cornerstoneTools.stopClip(element)
            this.setState({inPlay: false})
          break
        }
        case 'nextframe': {
          if (this.state.frame < this.numberOfFrames) {
            let frame = this.state.frame+1
            this.setState({frame: frame})            
            scrollToIndex(element, frame-1)
          }
          break  
        }
        case 'lastframe': {
          let frame = this.numberOfFrames
          this.setState({frame: frame})   
          scrollToIndex(element, frame-1)      
          break    
        }                       
        default:
          break
      }
    }

    reset = () => {
      const element = this.dicomImage
      const defaultViewport = cornerstone.getDefaultViewportForImage(element, this.image)
      let viewport = cornerstone.getViewport(element)
      viewport.voi.windowWidth = defaultViewport.voi.windowWidth
      viewport.voi.windowCenter = defaultViewport.voi.windowCenter
      viewport.invert = false
      cornerstone.setViewport(element, viewport)
    }

    dicomImageRef = el => {
      this.dicomImage = el
    }

    onImageClick = () => {
      console.log('onImageClick: ')
    }
    
    render() {
      //console.log('DicomViewer render: ')

      //this.props.visible ? document.body.style = 'background: #000000;' : document.body.style = 'background: $md-grey-700;'

      const isOpen = this.props.isOpen[this.props.index]
      //const visibleHistogram = this.state.visibleHistogram
      const visibleOpenUrlDlg = this.state.visibleOpenUrlDlg
      const errorOnOpenImage = this.state.errorOnOpenImage
      const progress = this.state.progress

      const styleContainer = {
        width: '100%', 
        height: '100%', 
        border: this.props.activeDcmIndex === this.props.index && (this.props.layout[0] > 1 || this.props.layout[1] > 1) ? 'solid 1px #AAAAAA' : 'solid 1px #000000',
        position: 'relative',
      }

      const styleDicomImage = {
        width: '100%', 
        height: '100%', 
        position: 'relative',
      }

      const overlay = getSettingsOverlay() 

      return ( 
        <div className="container" style={styleContainer} >

          {visibleOpenUrlDlg ? <OpenUrlDlg progress={progress} onClose={this.hideOpenUrlDlg} /> : null}

          <Dialog
            open={errorOnOpenImage !== null}
            onClose={this.onErrorOpenImageClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title">{"Error on opening image"}</DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                {this.state.errorOnOpenImage}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={this.onErrorOpenImageClose} autoFocus>
                Ok
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={this.state.errorOnCors}
            onClose={this.onErrorCorsClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title">{"Error on loading image"}</DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                <Typography gutterBottom>
                  CORS or Cross Origin Resource Sharing is a browser security policy 
                  that prevents javascript from loading data from a server with a different base URL 
                  than the server that served up the javascript file. 
                </Typography> 
                <Typography gutterBottom>
                  See the &nbsp; 
                  <Link href="http://enable-cors.org/" target='_blank' color='textPrimary'>
                    Enable CORS site
                  </Link>
                  &nbsp; for information about CORS.                     
                </Typography>                                
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={this.onErrorCorsClose} autoFocus>
                Ok
              </Button>
            </DialogActions>
          </Dialog>

          <div
            //tabIndex="0"
            style={{
              width: '100%', 
              height: '100%', 
              position: "relative",
              //display: "inline-block",
              color: '#FFFFFF',
              textShadow: '1px 1px #000000'
            }}
            onContextMenu={() => false}
            className="cornerstone-enabled-image"
            //unselectable="on"
            //onMouseDown={() => false}
          >
            <div 
              ref={this.dicomImageRef} style={styleDicomImage}
            >
            </div>
            <div
              id={`mrtopleft-${this.props.index}`}
              style={{ position: "absolute", top: 0, left: 3, display: isOpen && overlay ? "" : "none" }}
            >
              Patient Name
            </div>
            <div
              id={`mrtopright-${this.props.index}`}
              style={{ position: "absolute", top: 0, right: 3, display: isOpen && overlay ? "" : "none" }}
            >
              Size
            </div>
            <div
              id={`mrbottomright-${this.props.index}`}
              style={{ position: "absolute", bottom: 0, right: 3, display: isOpen && overlay ? "" : "none" }}
            >
              Zoom:
            </div>
            <div
              id={`mrbottomleft-${this.props.index}`}
              style={{ position: "absolute", bottom: 0, left: 3, display: isOpen && overlay ? "" : "none" }}
            >
              WW/WC:
            </div>    
            { this.state.visibleCinePlayer && this.numberOfFrames > 1 ? (
              <div style={{position:"absolute", width:'100%', bottom:0, textAlign:'center'}}>
                <div style={{margin:'0 auto', width:'240px', backgroundColor:'rgba(136, 136, 136, 0.5)'}}>
                  <CinePlayer runCinePlayer={this.runCinePlayer} inPlay={this.state.inPlay} />  
                  <div 
                    id={`frameLabel-${this.props.index}`}
                    style={{ width:230, margin:'0 auto', marginTop:-10, textAlign:"center" }}
                  >
                    {this.state.frame} / {this.numberOfFrames}
                  </div> 
                </div>               
              </div> 
              ) : null
            }  
            {/*<div style={{position:"absolute", width:'100%', height:'100%', top:0, left:0}}></div>*/}
          </div>
        </div>
      )
    }
  }
  
const mapStateToProps = (state) => {
  return {
    url: state.url,
    isOpen: state.isOpen,
    tool: state.tool,
    activeDcmIndex: state.activeDcmIndex,
    measurements: state.measurements,
    layout: state.layout
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    clearingStore: () => dispatch(clearStore()),
    isOpenStore: (value) => dispatch(dcmIsOpen(value)),
    toolStore: (tool) => dispatch(dcmTool(tool)),
    setActiveDcm: (dcm) => dispatch(activeDcm(dcm)),
    setActiveMeasurements: (measurements) => dispatch(activeMeasurements(measurements)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DicomViewer)
