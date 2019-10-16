import React from "react";
import Hammer from "hammerjs";
import * as cornerstone from "cornerstone-core";
import * as cornerstoneTools from "cornerstone-tools";
import * as cornerstoneMath from "cornerstone-math";
import * as cornerstoneWebImageLoader from "cornerstone-web-image-loader";
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import * as dicomParser from 'dicom-parser'
import {connect} from 'react-redux'
import {clearStore, loadLocalfile, loadUrl, dcmIsOpen, dcmNumberOfFrames, dcmTool, dcmDataStore, measureStore, measureRemove, measureClear} from '../actions'
//import {black} from "ansi-colors";
import {uids} from '../constants/uids'
import { SETTINGS_SAVEAS } from '../constants/settings'
//import {loadLocalfile} from '../actions'
//import dicomLoader from "./dicom-loader";
//import exampleImageIdLoader from "./exampleImageIdLoader";
import OpenUrlDlg from './OpenUrlDlg'
import CinePlayer from './CinePlayer'
//import { SETTINGS_OVERLAY } from '../constants/settings'
import { getSettingsOverlay, getSettingsMeasurement } from '../functions'
import { isBrowser, isMobile } from 'react-device-detect'
import { import as csTools } from 'cornerstone-tools'
import db from '../db'

const scrollToIndex = csTools('util/scrollToIndex')

const heightToolbar = 0

function getBlobUrl(url) {
  const baseUrl = window.URL || window.webkitURL;
  const blob = new Blob([`importScripts('${url}')`], {type: "application/javascript"});
  return baseUrl.createObjectURL(blob);
}

let webWorkerUrl = getBlobUrl(
  "https://unpkg.com/cornerstone-wado-image-loader@2.0.0/dist/cornerstoneWADOImageLoaderWebWorker.min.js"
);
let codecsUrl = getBlobUrl(
  "https://unpkg.com/cornerstone-wado-image-loader@2.0.0/dist/cornerstoneWADOImageLoaderCodecs.js"
  // "https://unpkg.com/cornerstone-wado-image-loader/dist/cornerstoneWADOImageLoaderCodecs.js"
);

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
};

console.log({ cornerstone });
console.log({ cornerstoneWADOImageLoader });
console.log({ dicomParser });


class DicomViewer extends React.Component {
    constructor(props) {
      super(props)
      this.dicomImage = null
      this.imageId = null
      this.image = null
      this.state.imageWidth = window.innerWidth
      this.state.imageHeight = isBrowser ? window.innerHeight-82 : window.innerHeight-82
      //console.log('this.state.imageWidth: ', this.state.imageWidth)
      //console.log('this.state.imageHeight: ', this.state.imageHeight)
    }

    state = { 
      imageWidth: 0,
      imageHeight: 0,
      file: null,
      visibleOpenUrlDlg: false,
      progress: null,
      visibleCinePlayer: true,
      frame: 1,
      inPlay: false,
      viewport: null
    }
  
    componentWillMount() {
      cornerstoneTools.external.cornerstone = cornerstone;
      cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
      cornerstoneWebImageLoader.external.cornerstone = cornerstone;
      cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
      cornerstoneWADOImageLoader.webWorkerManager.initialize(config);
      cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
      cornerstoneTools.external.Hammer = Hammer;
    }
  
    componentDidMount() {
      window.scrollTo(0, 1)
      this.props.runTool(this)
      this.props.changeTool(this)
    }

    componentWillUnmount() {
      this.props.runTool(undefined)
      this.props.changeTool(undefined)
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


    getTransferSyntax = (image) => {
      const value = image.data.string('x00020010')
      return value + ' [' + uids[value] + ']'
    }

    getSopClass = (image) => {
      const value = image.data.string('x00080016')
      return value + ' [' + uids[value] + ']'
    }

    getSopInstanceUID = (image) => {
      const value = image.data.string('x00080018')
      return value
    }

    getPixelRepresentation = (image) => {
      const value = image.data.uint16('x00280103')
      if (value === undefined) return
      return value + (value === 0 ? ' (unsigned)' : ' (signed)')
    }

    getPlanarConfiguration = (image) => {
      const value = image.data.uint16('x00280006')
      if (value === undefined) return 
      return value + (value === 0 ? ' (pixel)' : ' (plane)')
    }
    
    // Listen for changes to the viewport so we can update the text overlays in the corner
    onImageRendered = (e) => {
      //console.log('cornerstoneimagerendered: ')

      this.setState({
        imageWidth: isBrowser ? window.innerWidth : window.innerWidth,
        imageHeight: isBrowser ? window.innerHeight-82 : window.innerHeight-82
      })

      const viewport = cornerstone.getViewport(e.target)

      //console.log('viewport: ', viewport)

      document.getElementById(
        "mrtopleft"
      ).textContent = `${this.dataHeader.PatientsName}`

      document.getElementById(
        "mrtopright"
      ).textContent = `${viewport.displayedArea.brhc.x}x${viewport.displayedArea.brhc.x}`

      document.getElementById(
        "mrbottomleft"
      ).textContent = `WW/WC: ${Math.round(
        viewport.voi.windowWidth
      )}/${Math.round(viewport.voi.windowCenter)}`

      document.getElementById(
        "mrbottomright"
      ).textContent = `Zoom: ${viewport.scale.toFixed(2)*100}%`

      if (this.props.numberOfFrames > 1) {
        document.getElementById(
          "frameLabel"
        ).textContent = `${this.state.frame} / ${this.props.numberOfFrames}`
        if (this.state.inPlay) this.setState({frame: this.state.frame+1})
      }

      console.log('this.props.measure: ', this.props.measure)
    }

    onMeasurementAdded = (e) => {
      console.log('cornerstonetoolsmeasurementadded: ', e.detail.measurementData)
      /*
      if (getSettingsMeasurement() === 1) {
        try {
          db.measurement.add({
            sopinstanceuid: this.dataHeader.sopInstanceUid, 
            tool: this.props.tool,
            data: e.detail.measurementData
          })
        } catch(error) {
          console.error(error)
        }
      }
      */
    }

    onMeasurementModified = (e) => {
      //console.log('cornerstonetoolsmeasurementmodified: ', e.detail.measurementData)
      
    }

    onMeasurementCompleted = (e) => {
      console.log('cornerstonetoolsmeasurementcompleted: ', e.detail.measurementData)
      
      const measure = {
        tool: this.props.tool,
        note: '',
        data: e.detail.measurementData
      }
      this.props.measurementStore(measure)
    }
    
    loadImage = (localfile, url=undefined) => {
      console.log('loadImage, localfile: ', localfile)

      if (localfile === undefined && url === undefined) return
      
      if (localfile !== undefined) {
        this.props.localfileStore(localfile)
      } else {
        this.props.urlStore(url)
      }
 
      const element = this.dicomImage

      element.addEventListener("cornerstonenewimage", this.onNewImage)
      element.addEventListener("cornerstoneimagerendered", this.onImageRendered)
      element.addEventListener("cornerstonetoolsmeasurementadded", this.onMeasurementAdded)
      element.addEventListener("cornerstonetoolsmeasurementmodified", this.onMeasurementModified)
      element.addEventListener("cornerstonetoolsmeasurementcompleted", this.onMeasurementCompleted)

      cornerstoneTools.init(isMobile ? {touchEnabled: true} : {mouseEnabled: true})

      let imageId = undefined

      if (localfile !== undefined) {
        imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(localfile)
      } else {
        //this.hideOpenUrlDlg()
        imageId = "wadouri:"+url
      }

      console.log('loadImage, imageId: ', imageId)
  
      cornerstone.enable(element)

      cornerstone.loadAndCacheImage(imageId).then(image => {
        console.log('loadImage, image: ', image)

        this.hideOpenUrlDlg()

        this.image = image

        this.props.isOpenStore(true)

        //console.log('loadImage, image.data.elements: ', image.data.elements)
        //console.log('loadImage, image.data.elements.x00280010: ', image.data.uint16('x00280010'))
        //Object.keys(image.data.elements).forEach(e => console.log(`key=${e}  value=${image.data.elements[e]}`));

        //console.log('loadImage, x00280010: ', image.width)
        //console.log('loadImage, x00280011: ', image.height)
        
        this.props.dataStore(['Transfer Syntax', this.getTransferSyntax(image)])
        this.props.dataStore(['SOP Class', this.getSopClass(image)])
        this.props.dataStore(['SOP Instance UID', this.getSopInstanceUID(image)])
        this.props.dataStore(['Frame Rate', image.data.string('x00082144')])
        this.props.dataStore(['Samples per Pixel', image.data.uint16('x00280002')])
        this.props.dataStore(['Photometric Interpretation', image.data.string('x00280004')])
        this.props.dataStore(['Number of Frames', image.data.string('x00280008')])
        this.props.dataStore(['Planar Configuration', this.getPlanarConfiguration(image)])
        this.props.dataStore(['Rows', image.data.uint16('x00280010')])
        this.props.dataStore(['Columns', image.data.uint16('x00280011')])
        this.props.dataStore(['Pixel Spacing', image.data.string('x00280030')])
        this.props.dataStore(['Bits Allocated', image.data.uint16('x00280100')])
        this.props.dataStore(['Bits Stored', image.data.uint16('x00280101')])
        this.props.dataStore(['High Bit', image.data.uint16('x00280102')])
        this.props.dataStore(['Pixel Representation', this.getPixelRepresentation(image)])
        this.props.dataStore(['Window Center', image.data.string('x00281050')])
        this.props.dataStore(['Window Width', image.data.string('x00281051')])
        this.props.dataStore(['Rescale Intercept', image.data.string('x00281052')])
        this.props.dataStore(['Rescale Slope', image.data.string('x00281053')])
        this.props.dataStore(['Min Stored Pixel Value', image.minPixelValue])
        this.props.dataStore(['Max Stored Pixel Value', image.maxPixelValue])
        
        
        this.dataHeader = {
          transferSyntax: this.getTransferSyntax(image),
          sopClass: this.getSopClass(image),
          sopInstanceUid: this.getSopInstanceUID(image),
          PatientsName: image.data.string('x00100010'),
          samplesPerPixel: image.data.uint16('x00280002'), 
          photometricInterpretation: image.data.string('x00280004'),
          numberOfFrames: image.data.string('x00280008'),
          planarConfiguration: this.getPlanarConfiguration(image),
          rows: image.data.uint16('x00280010'),
          columns: image.data.uint16('x00280011'),
          pixelSpacing: image.data.string('x00280030'),
          bitsAllocated:  image.data.uint16('x00280100'),
          bitsStored: image.data.uint16('x00280101'),
          highBit: image.data.uint16('x00280102'),
          pixelRepresentation: this.getPixelRepresentation(image),
          windowCenter: image.data.string('x00281050'),
          windowWidth: image.data.string('x00281051'),
          rescaleIntercept: image.data.string('x00281052'),
          rescaleSlope: image.data.string('x00281053'),
          basicOffsetTable: image.data.elements.x7fe00010 && image.data.elements.x7fe00010.basicOffsetTable ? image.data.elements.x7fe00010.basicOffsetTable.length : '',
          fragments: image.data.elements.x7fe00010 && image.data.elements.x7fe00010.fragments ? image.data.elements.x7fe00010.fragments.length : '',
          minStoredPixelValue: image.minPixelValue,
          maxStoredPixelValue: image.maxPixelValue,
        }
        console.log('this.dataHeader: ', this.dataHeader)

        this.setState({
          imageWidth: isBrowser ? window.innerWidth : window.innerWidth,
          imageHeight: isBrowser ? window.innerHeight-82 : window.innerHeight-82
        })

        let stack = { currentImageIdIndex: 0, imageIds: "" }
        let nFrames = image.data.intString('x00280008')
        if (nFrames > 0) {
          //console.log('nFrames: ', nFrames)
          this.props.numberOfFramesStore(nFrames)
          let imageIds = []	
          for(var i=1; i <=nFrames; ++i) {
            imageIds.push(imageId + "?frame="+i)
          }	
          stack.imageIds = imageIds;
          console.log(stack.imageIds)
        }

        console.log('displayImage: ')
        cornerstone.displayImage(element, image)
        //cornerstoneTools.mouseInput.enable(element);
        //cornerstoneTools.mouseWheelInput.enable(element);

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

        if (nFrames > 1) {
          cornerstoneTools.addStackStateManager(element, ['stack', 'playClip']);    
          cornerstoneTools.addToolState(element, 'stack', stack)
          cornerstoneTools.setToolActive('StackScrollMouseWheel', { })
        }
 
        // Load the possible measurements from DB and save in the store 
        db.measurement.where('sopinstanceuid').equals(this.dataHeader.sopInstanceUid).each(measure => {
          console.log('load measure from db: ', measure)
          this.props.measurementStore(measure)
          cornerstoneTools.addToolState(element, measure.tool, measure.data)
          this.runTool(measure.tool)
          cornerstone.updateImage(element)
        })


      })
    }
  
    enableTool = (toolName, mouseButtonNumber) => {
      this.disableAllTools()
      //cornerstoneTools[toolName].activate(this.dicomImage, mouseButtonNumber);
      //console.log('csTools.store: ', this.csTools.store)
    };
  
    // helper function used by the tool button handlers to disable the active tool
    // before making a new tool active
    disableAllTools = () => {
      cornerstoneTools.setToolDisabled('Length')
      cornerstoneTools.setToolDisabled('Pan')
      cornerstoneTools.setToolDisabled('Magnify')
      cornerstoneTools.setToolDisabled('Angle')
      cornerstoneTools.setToolDisabled('RectangleRoi')
      cornerstoneTools.setToolDisabled('Wwwc')
      cornerstoneTools.setToolDisabled('ZoomTouchPinch')
      cornerstoneTools.setToolDisabled('Probe')
      cornerstoneTools.setToolDisabled('EllipticalRoi')
      cornerstoneTools.setToolDisabled('StackScrollMouseWheel')
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
            this.showOpenUrlDlg(opt)
            break                 
        }
        case 'clear': {
          //this.props.isOpenStore(false)
          //this.props.numberOfFramesStore(1)
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
          //console.log('opt: ', opt)
          const element = this.dicomImage
          cornerstoneTools.removeToolState(element, this.props.measure[opt].tool, this.props.measure[opt].data)
          cornerstone.updateImage(element)
          this.props.measurementRemoveStore(opt)
          break
        }  
        case 'removetools': {   
          const element = this.dicomImage
          // for each measurement remove it 
          this.props.measure.forEach(measure => {
            cornerstoneTools.clearToolState(element, measure.tool)         
          })
          cornerstone.updateImage(element)
          this.props.measurementClearStore()
          // also remove all measurements from db
          db.measurement.where('sopinstanceuid').equals(this.dataHeader.sopInstanceUid).delete()
          break
        }  
        case 'savetools': {
          // first, remove eventually previous measurements from db
          db.measurement.where('sopinstanceuid').equals(this.dataHeader.sopInstanceUid).delete()
          // then save all the current measurements
          this.props.measure.forEach(measure => {
            try {
              db.measurement.add({
                sopinstanceuid: this.dataHeader.sopInstanceUid, 
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
      console.log('run cine player: ', cmdName)
      const element = this.dicomImage
      switch (cmdName) {
        case 'firstframe':
          this.setState({frame: 1})
          scrollToIndex(element, this.state.frame)
          break
        case 'previousframe':
          if (this.state.frame > 1) {
            this.setState({frame: this.state.frame-1})
            scrollToIndex(element, this.state.frame)
          }
          break
        case 'play':
          cornerstoneTools.playClip(element, 30)
          this.setState({inPlay: true})
          break
        case 'pause':
            cornerstoneTools.stopClip(element)
            this.setState({inPlay: false})
          break
        case 'nextframe':
          if (this.state.frame < this.props.numberOfFrames) {
            this.setState({frame: this.state.frame+1})
            scrollToIndex(element, this.state.frame)
          }
          break  
        case 'lastframe':
          this.setState({frame: this.props.numberOfFrames-1})
          scrollToIndex(element, this.state.frame)
          break                           
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
      cornerstone.setViewport(element, viewport)
    }

    dicomImageRef = el => {
      this.dicomImage = el;
    };
    
    render() {
      //console.log('window.innerWidth: ', window.innerWidth)
      //console.log('window.innerHeight: ', window.innerHeight)
      //console.log('this.imageWidth: ', this.imageWidth)
      //console.log('this.imageHeight: ', this.imageHeight)

      this.props.visible ? document.body.style = 'background: #000000;' : document.body.style = 'background: $md-grey-700;'

      const visibleOpenUrlDlg = this.state.visibleOpenUrlDlg
      const progress = this.state.progress

      const styleDicomImage = {
        width: this.state.imageWidth, //this.imageWidth,
        height: this.state.imageHeight, //this.imageHeight,
        top: {heightToolbar},
        left: 0,
        position: "absolute"
      }

      const overlay = getSettingsOverlay() // localStorage.getItem(SETTINGS_OVERLAY) === '1'

      //console.log('this.props.visible', this.props.visible)
      //console.log('this.state.visibleOpenUrlDlg: ', this.state.visibleOpenUrlDlg)
      
      let cinePlayer = null
      let frameLabel = null
      if (this.state.visibleCinePlayer && this.props.numberOfFrames > 1) {
        cinePlayer = (<CinePlayer runCinePlayer={this.runCinePlayer} inPlay={this.state.inPlay} />)
        frameLabel = (<div id="frameLabel" style={{ width:300, margin:'0 auto', marginTop:-10, textAlign:"center", color:"#808080" }}>{this.state.frame} / {this.props.numberOfFrames}</div>)
      } 

      return (
        <div className="container" style={{ display: this.props.visible === true ? 'block' : 'none'}}>
          {visibleOpenUrlDlg ? <OpenUrlDlg progress={progress} onClose={this.hideOpenUrlDlg}/>: null}
          <div className="col-9">
              <div
                role="button"
                tabIndex="0"
                style={{
                  width: this.state.imageWidth, //this.imageWidth,
                  height: this.state.imageHeight, // this.imageHeight,
                  position: "relative",
                  display: "inline-block",
                  color: "white"
                }}
                onContextMenu={() => false}
                className="cornerstone-enabled-image"
                unselectable="on"
                onMouseDown={() => false}
              >
                <div
                  ref={this.dicomImageRef}
                  style={styleDicomImage}
                />
                <div
                  id="mrtopleft"
                  style={{ position: "absolute", top: 0, left: 3, display: this.props.isOpen && overlay ? "block" : "none" }}
                >
                  Patient Name
                </div>
                <div
                  id="mrtopright"
                  style={{ position: "absolute", top: 0, right: 3, display: this.props.isOpen && overlay ? "block" : "none" }}
                >
                  Size
                </div>
                <div
                  id="mrbottomright"
                  style={{ position: "absolute", bottom: 3, right: 3, display: this.props.isOpen && overlay ? "block" : "none" }}
                >
                  Zoom:
                </div>
                <div
                  id="mrbottomleft"
                  style={{ position: "absolute", bottom: 3, left: 3, display: this.props.isOpen && overlay ? "block" : "none" }}
                >
                  WW/WC:
                </div>      
                <div style={{position: "fixed", bottom:30, width:'100%'}}>
                  {cinePlayer}  
                  {frameLabel}                
                </div>          
            </div>
          </div>
        </div>
      )
    }
  }
  
const mapStateToProps = (state) => {
  return {
    localfile: state.loadLocalfile,
    url: state.url,
    isOpen: state.isOpen,
    numberOfFrames: state.numberOfFrames,
    tool: state.tool,
    header: state.header,
    measure: state.measure
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    clearingStore: () => dispatch(clearStore()),
    localfileStore: (file) => dispatch(loadLocalfile(file)),
    isOpenStore: (value) => dispatch(dcmIsOpen(value)),
    numberOfFramesStore: (value) => dispatch(dcmNumberOfFrames(value)),
    toolStore: (tool) => dispatch(dcmTool(tool)),
    urlStore: (url) => dispatch(loadUrl(url)),
    dataStore: (data) => dispatch(dcmDataStore(data)),
    measurementStore: (measure) => dispatch(measureStore(measure)),
    measurementRemoveStore: (index) => dispatch(measureRemove(index)),
    measurementClearStore: () => dispatch(measureClear()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DicomViewer)
