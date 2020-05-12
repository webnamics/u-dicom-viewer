import React from "react"
import {connect} from 'react-redux'
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
import * as blobUtil from 'blob-util'
import {uids} from '../constants/uids'
import { SETTINGS_SAVEAS } from '../constants/settings'
import OpenUrlDlg from './OpenUrlDlg'
import CinePlayer from './CinePlayer'
import { isMobile } from 'react-device-detect'
import { import as csTools } from 'cornerstone-tools'
import db from '../db/db'
import fs from '../fs/fs'
import {
  clearStore, 
  dcmIsOpen, 
  activeDcm, 
  dcmTool, 
  activeMeasurements,
  doFsRefresh} 
from '../actions'
import {
  capitalize,
  getFileName,
  getSettingsOverlay,
  isFileImage,
  isFsFileImage,
  isUrlImage,
  getSettingsSaveInto
} from '../functions'

const scrollToIndex = csTools('util/scrollToIndex')

/*
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
var config = {
  maxWebWorkers: navigator.hardwareConcurrency || 1,
  startWebWorkersOnDemand: false,
}
*/
cornerstoneTools.external.cornerstone = cornerstone
cornerstoneTools.external.cornerstoneMath = cornerstoneMath
cornerstoneFileImageLoader.external.cornerstone = cornerstone
cornerstoneWebImageLoader.external.cornerstone = cornerstone
cornerstoneWADOImageLoader.external.cornerstone = cornerstone
//cornerstoneWADOImageLoader.webWorkerManager.initialize(config)
cornerstoneWADOImageLoader.external.dicomParser = dicomParser
cornerstoneTools.external.Hammer = Hammer
cornerstoneTools.init()

//console.log({ cornerstone })
//console.log({ cornerstoneWADOImageLoader })
//console.log({ dicomParser })

class DicomViewer extends React.Component {
    constructor(props) {
      super(props)
      this.filename = ''
      this.localfile = null
      this.localurl = null
      this.fsItem = null
      this.dicomImage = null
      this.imageId = null
      this.image = null
      this.isDicom = false
      this.numberOfFrames = 1
      this.measurements = []
      this.xSize = 0
      this.ySize = 0
      this.zSize = 0
      this.volume = null
      this.originImage = null
      this.mprPlane = ''
    }

    state = {
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
      //console.log('dicomviewer - componentDidUpdate: ')
      /*if (this.props.files !== null) {
        console.log('this.props.files[0]: ', this.props.files[0])
        console.log('this.props.files: ', this.props.files)
      }*/
      /*if (this.props.volume !== null) {
        console.log('volume set: ', this.props.volume)
        this.volume = this.props.volume
      }*/
      const isOpen = this.props.isOpen[this.props.index]
      if (this.props.layout !== previousProps.layout && isOpen) {
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
      //console.log('cornerstoneimagerendered: ', e.target)
      //console.log('cornerstoneimagerendered, plane: ', this.mprPlane)

      //const viewport = cornerstone.getViewport(this.dicomImage)
      const viewport = cornerstone.getViewport(e.target)

      //console.log('viewport: ', viewport)

      //if (this.props.activeDcm !== null)
      //  console.log('viewport activeDcm: ', cornerstone.getViewport(this.props.activeDcm.element))

      document.getElementById(
        `mrtopleft-${this.props.index}`
      ).textContent = this.mprIsOrthogonalView() ? `${capitalize(this.mprPlane)}` : `${this.PatientsName}`

      document.getElementById(
        `mrtopright-${this.props.index}`
      ).textContent = `${viewport.displayedArea.brhc.x}x${viewport.displayedArea.brhc.y}`

      document.getElementById(
        `mrbottomleft-${this.props.index}`
      ).textContent = `WW/WC: ${Math.round(viewport.voi.windowWidth)}/${Math.round(viewport.voi.windowCenter)}`

      document.getElementById(
        `mrbottomright-${this.props.index}`
      ).textContent = `Zoom: ${Math.round(viewport.scale.toFixed(2)*100)}%`

      document.getElementById(
        `mrtopcenter-${this.props.index}`
      ).textContent = ``
      document.getElementById(
        `mrbottomcenter-${this.props.index}`
      ).textContent = ``    
      document.getElementById(
        `mrleftcenter-${this.props.index}`
      ).textContent = ``      
      document.getElementById(
        `mrrightcenter-${this.props.index}`
      ).textContent = ``  

      if (this.mprPlane === 'sagittal') {
        document.getElementById(
          `mrtopcenter-${this.props.index}`
        ).textContent = `S`
        document.getElementById(
          `mrbottomcenter-${this.props.index}`
        ).textContent = `I`    
        document.getElementById(
          `mrleftcenter-${this.props.index}`
        ).textContent = `A`      
        document.getElementById(
          `mrrightcenter-${this.props.index}`
        ).textContent = `P`  

      } else if (this.mprPlane === 'axial') {
        document.getElementById(
          `mrtopcenter-${this.props.index}`
        ).textContent = `A`
        document.getElementById(
          `mrbottomcenter-${this.props.index}`
        ).textContent = `P`    
        document.getElementById(
          `mrleftcenter-${this.props.index}`
        ).textContent = `R`      
        document.getElementById(
          `mrrightcenter-${this.props.index}`
        ).textContent = `L`    

      } else if (this.mprPlane === 'coronal') {
        document.getElementById(
          `mrtopcenter-${this.props.index}`
        ).textContent = `S`
        document.getElementById(
          `mrbottomcenter-${this.props.index}`
        ).textContent = `I`    
        document.getElementById(
          `mrleftcenter-${this.props.index}`
        ).textContent = `R`      
        document.getElementById(
          `mrrightcenter-${this.props.index}`
        ).textContent = `L`                    
      }    

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

    onMeasurementAdded = (e) => {
      //console.log('cornerstonetoolsmeasurementadded: ', e.detail.measurementData)
      if (this.props.tool !== "Angle") return
      const measure = {
        tool: this.props.tool,
        note: '',
        data: e.detail.measurementData
      }
      this.measurementSave(measure)
      this.props.setActiveMeasurements(this.measurements)      
    }

    onMeasurementCompleted = (e) => {
      //console.log('cornerstonetoolsmeasurementcompleted: ', e.detail.measurementData)
      const measure = {
        tool: this.props.tool,
        note: '',
        data: e.detail.measurementData
      }
      if (this.props.tool === "FreehandRoi") {
        setTimeout(() => {
          this.measurementSave(measure)
          this.props.setActiveMeasurements(this.measurements)
        }, 500)
      } else {
        this.measurementSave(measure)
        this.props.setActiveMeasurements(this.measurements)
      }
    }
    
    onErrorOpenImageClose = () => {
      this.setState({errorOnOpenImage: null})
    }

    onErrorCorsClose = () => {
      this.setState({errorOnCors: false})
    }    

    /*overlayImage = () => {
      const viewport = cornerstone.getViewport(this.dicomImage)

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
    }*/

    displayImageFromFiles = (index) => {
      // console.log('displayImageFromFiles: ', index)

      const image = this.props.files[index].image
      const imageId = this.props.files[index].imageId
      this.filename = this.props.files[index].name

      const element = this.dicomImage
      element.addEventListener("cornerstonenewimage", this.onNewImage)
      element.addEventListener("cornerstoneimagerendered", this.onImageRendered)
      element.addEventListener("cornerstonetoolsmeasurementadded", this.onMeasurementAdded)
      element.addEventListener("cornerstonetoolsmeasurementmodified", this.onMeasurementModified)
      element.addEventListener("cornerstonetoolsmeasurementcompleted", this.onMeasurementCompleted)
      cornerstone.enable(element)

      this.image = image

      this.isDicom = true
      
      this.PatientsName = image.data.string('x00100010')
      this.sopInstanceUid = this.getSopInstanceUID()

      let stack = { currentImageIdIndex: 0, imageIds: "" }
      this.numberOfFrames = image.data.intString('x00280008')
      if (this.numberOfFrames > 0) {
        let imageIds = []	
        for(var i=0; i < this.numberOfFrames; ++i) {
          imageIds.push(imageId + "?frame="+i)
        }	
        stack.imageIds = imageIds
      }

      cornerstone.displayImage(element, image)

      /*const viewport = cornerstone.getViewport(this.dicomImage)
      const lut =  cornerstone.generateLut(this.image, viewport.voi.windowWidth, viewport.voi.windowCenter, viewport.invert, viewport.modalityLUT, viewport.voiLUT)
      this.props.setLutStore(lut)*/
      this.mprPlanePosition()
      
      this.enableTool()

      if (this.numberOfFrames > 1) {
        cornerstoneTools.addStackStateManager(element, ['stack', 'playClip']);    
        cornerstoneTools.addToolState(element, 'stack', stack)
        this.setState({frame: 1})
      }

      // Load the possible measurements from DB and save in the store 
      db.measurement.where('sopinstanceuid').equals(this.sopInstanceUid).each(measure => {
        console.log('load measure from db: ', measure)
        this.measurementSave(measure)
        cornerstoneTools.addToolState(element, measure.tool, measure.data)
        this.runTool(measure.tool)
        cornerstone.updateImage(element)
        cornerstoneTools.setToolEnabled(measure.tool)
      }).then(() => {
        this.props.setActiveMeasurements(this.measurements)
        this.props.setActiveDcm({image: this.image, element: this.dicomImage, isDicom: this.isDicom})   
        this.props.setIsOpenStore({index: this.props.index, value: true})        
      })   
      
      //this.overlayImage()
      
    }

    loadImageFromCanvas = (canvas) => {
      console.log('loadImageFromCanvas, dcmViewer: ', this.props.index)

      const element = this.dicomImage
      element.addEventListener("cornerstonenewimage", this.onNewImage)
      element.addEventListener("cornerstoneimagerendered", this.onImageRendered)
      element.addEventListener("cornerstonetoolsmeasurementadded", this.onMeasurementAdded)
      element.addEventListener("cornerstonetoolsmeasurementmodified", this.onMeasurementModified)
      element.addEventListener("cornerstonetoolsmeasurementcompleted", this.onMeasurementCompleted)
      cornerstone.enable(element)

      const imageId = cornerstoneFileImageLoader.fileManager.addCanvas(canvas)

      cornerstone.loadImage(imageId).then(image => {
        //this.t1 = performance.now()
        //console.log(`performance load image: ${this.t1-this.t0} milliseconds`)

        console.log('loadImageFromCanvas, image: ', image)

        this.image = image

        this.isDicom = false

        cornerstone.displayImage(element, image)

        this.enableTool()

        //this.props.setActiveDcm({image: this.image, element: this.dicomImage, isDicom: this.isDicom})
        this.props.setIsOpenStore({index: this.props.index, value: true})

        //this.t2 = performance.now()
        //console.log(`performance: ${this.t2-this.t1} milliseconds`)

        //this.overlayImage()

      }, (e) => {
        console.log('error', e)
        this.setState({errorOnOpenImage: "This is not a valid canvas."})
      })
    }

    loadImageFromCustomObject = (columns, rows, pixelData) => {
      //console.log('loadImageFromCustomObject: ')

      const element = this.dicomImage
      element.addEventListener("cornerstonenewimage", this.onNewImage)
      element.addEventListener("cornerstoneimagerendered", this.onImageRendered)
      element.addEventListener("cornerstonetoolsmeasurementadded", this.onMeasurementAdded)
      element.addEventListener("cornerstonetoolsmeasurementmodified", this.onMeasurementModified)
      element.addEventListener("cornerstonetoolsmeasurementcompleted", this.onMeasurementCompleted)
      cornerstone.enable(element)
      
      let customObj = {
        rows: rows,
        columns: columns,
        pixelData: pixelData,
        image: this.originImage,
      }

      const imageId = cornerstoneFileImageLoader.fileManager.addCustom(customObj)

      cornerstone.loadImage(imageId).then(image => {
        //console.log('loadImageFromCustomObject, image: ', image)

        this.image = image

        this.isDicom = true

        cornerstone.displayImage(element, image)

        //this.enableTool()

        this.props.setIsOpenStore({index: this.props.index, value: true})

      }, (e) => {
        console.log('error', e)
        this.setState({errorOnOpenImage: "This is not a valid canvas."})
      })
    }

    loadImage = (localfile, url=undefined, fsItem=undefined) => {
      //console.log('loadImage, localfile: ', localfile)
      //console.log('loadImage, fsItem: ', fsItem)
      //console.log('loadImage, url: ', url)

      if (localfile === undefined && url === undefined && fsItem === undefined) return
      
      if (fsItem !== undefined) {
        this.fsItem = fsItem
      } else if (localfile !== undefined) {
        this.localfile = localfile
      } else {
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

      let size = 0

      if (localfile === undefined && isUrlImage(url)) { // check if it's a simple image [jpeg or png] from url
        //console.log('image: ', file)
        cornerstone.loadImage(url).then(image => {
          //console.log('loadImage, image from url: ', image)

          this.hideOpenUrlDlg()

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

      } else if ((localfile !== undefined && isFileImage(localfile)) || (fsItem !== undefined && isFsFileImage(fsItem))) { // otherwise try to open as local image file (JPEG, PNG) 
        if (fsItem !== undefined) {
          imageId = cornerstoneFileImageLoader.fileManager.addBuffer(fsItem.data)
        } else {
          imageId = cornerstoneFileImageLoader.fileManager.add(localfile)
        }
        cornerstone.loadImage(imageId).then(image => {
          //console.log('loadImage, image from local: ', image)

          this.image = image
          this.isDicom = false
          this.PatientsName = ''

          cornerstone.displayImage(element, image)
          
          this.enableTool()

          this.props.setActiveDcm({image: this.image, element: this.dicomImage, isDicom: this.isDicom})
          //this.props.isOpenStore(true)
          this.props.setIsOpenStore({index: this.props.index, value: true})

        }, (e) => {
          console.log('error', e)
          this.setState({errorOnOpenImage: "This is not a valid JPG or PNG file."})
        })

      } else { // otherwise try to open as Dicom file

        if (fsItem !== undefined) {
          imageId = cornerstoneWADOImageLoader.wadouri.fileManager.addBuffer(fsItem.data)
          this.filename = fsItem.name
          size = fsItem.size
        } else if (localfile !== undefined) {
          imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(localfile)
          this.filename = localfile.name
          size = localfile.size
        } else { // it's a web dicom image
          imageId = "wadouri:"+url
        }
  
        //console.log('loadImage, imageId: ', imageId)

        cornerstone.loadAndCacheImage(imageId).then(image => {
          //console.log('loadImage, image: ', image)
          //let pixelDataElement = image.data.elements.x7fe00010
          //console.log('loadImage, pixelDataElement: ', pixelDataElement)
          //console.log('loadImage, getPixelData: ', image.getPixelData())
          
          this.hideOpenUrlDlg()

          this.image = image

          this.isDicom = true
          
          this.PatientsName = image.data.string('x00100010')
          this.sopInstanceUid = this.getSopInstanceUID()

          let stack = { currentImageIdIndex: 0, imageIds: "" }
          this.numberOfFrames = image.data.intString('x00280008')
          if (this.numberOfFrames > 0) {
            let imageIds = []	
            for(var i=0; i < this.numberOfFrames; ++i) {
              imageIds.push(imageId + "?frame="+i)
            }	
            stack.imageIds = imageIds
          }

          cornerstone.displayImage(element, image)
          //cornerstoneTools.mouseInput.enable(element);
          //cornerstoneTools.mouseWheelInput.enable(element);

          this.enableTool()

          /*const viewport = cornerstone.getViewport(this.dicomImage)
          const lut =  cornerstone.generateLut(this.image, viewport.voi.windowWidth, viewport.voi.windowCenter, viewport.invert, viewport.modalityLUT, viewport.voiLUT)
          console.log('lut: ', lut)*/

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
            this.props.setActiveDcm({name: this.filename, size: size, image: this.image, element: this.dicomImage, isDicom: this.isDicom})
            this.props.setIsOpenStore({index: this.props.index, value: true})            
          })       

        }, (e) => {
          console.log('error', e)   
          this.hideOpenUrlDlg()      
          //console.log('toString: ', e.error.toString())
          const error = e.error.toString()
          if (error === '[object XMLHttpRequest]') {
            this.setState({errorOnCors: true})
          } else {
            const pos = error.indexOf(":")
            this.setState({errorOnOpenImage: pos < 0 ? e.error : error.substring(pos+1)})            
          } 
        })
      }
    }
  
    enableTool = (toolName, mouseButtonNumber) => {
      // Enable all tools we want to use with this element
      const WwwcTool = cornerstoneTools.WwwcTool
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
      cornerstoneTools.setToolEnabled('FreehandRoi')
      cornerstoneTools.setToolEnabled('StackScrollMouseWheel')
    }
  
    runTool = (toolName, opt) => {
      //console.log('run tool: ', toolName)
      // this.disableAllTools()
      switch (toolName) {
        case 'openimage': {
          //console.log('openimage: ', opt)
          //console.log('openimage, this.dicomImage: ', this.dicomImage)
          cornerstone.disable(this.dicomImage)
          this.displayImageFromFiles(opt)
          break   
        }
        case 'openLocalFs': {
          //console.log('openLocalFs: ', opt)
          cornerstone.disable(this.dicomImage)
          this.loadImage(opt)
          break   
        } 
        case 'openSandboxFs': {
          //console.log('openSandboxFs: ', opt)
          cornerstone.disable(this.dicomImage)
          //this.setState({ file: opt })
          this.loadImage(undefined, undefined, opt)
          break   
        }         
        case 'openurl': {
          //console.log('run tool opt: ', opt)  
          this.showOpenUrlDlg(opt)
          break                 
        }
        case 'clear': {
          this.setState({ visibleCinePlayer: false })
          this.mprPlane = ''
          //this.props.clearingStore()
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
          break 
        }         
        case 'saveas': {
            let type = localStorage.getItem(SETTINGS_SAVEAS)
            if (getSettingsSaveInto() === 'local') {
              // cornerstoneTools.SaveAs(this.dicomImage, `${this.filename}.${type}`, `image/${type}`)   
              const element = this.dicomImage
              const viewport = cornerstone.getViewport(element)
              const canvas = document.getElementsByClassName('cornerstone-canvas')[this.props.activeDcmIndex]
              const zoom = viewport.scale.toFixed(2)
              const cols = this.image.columns * zoom
              const rows = this.image.rows * zoom

              let myCanvas = document.createElement('canvas')
              myCanvas = this.cropCanvas(canvas, 
                Math.round(canvas.width / 2 - cols / 2), 
                Math.round(canvas.height / 2 - rows / 2), 
                cols, rows)   

              let a = document.createElement("a")
              a.href = myCanvas.toDataURL(`image/${type}`)
              a.download = `${this.filename}.${type}`    
              document.body.appendChild(a) // Required for this to work in FireFox
              a.click()           

            } else { // store image into sandbox file system
              const element = this.dicomImage
              const viewport = cornerstone.getViewport(element)
              const canvas = document.getElementsByClassName('cornerstone-canvas')[this.props.activeDcmIndex]
              const zoom = viewport.scale.toFixed(2)
              const cols = this.image.columns * zoom
              const rows = this.image.rows * zoom

              let myCanvas = document.createElement('canvas')
              myCanvas = this.cropCanvas(canvas, 
                Math.round(canvas.width / 2 - cols / 2), 
                Math.round(canvas.height / 2 - rows / 2), 
                cols, rows)           
              
              blobUtil.canvasToBlob(myCanvas, `image/${type}`).then(blob => {
                blobUtil.blobToArrayBuffer(blob).then(arrayBuffer => {
                  const name = `${getFileName(this.filename)}-MPR-${this.mprPlane}`     
                  let newName = name
                  let counter = 1
                  let done = false             
                  do {
                      let filename = `${newName}.${type}`
                      const checkName = this.props.fsCurrentList.find(e => e.name === filename)
                      if (checkName === undefined) {
                          fs.transaction('rw', fs.files, async () => {
                              await fs.files.add({
                                  parent: this.props.fsCurrentDir,
                                  name: filename,
                                  type: type,
                                  size: arrayBuffer.byteLength,
                                  data: arrayBuffer
                              })
                          }).then(() => {
                            this.props.makeFsRefresh()
                          })
                          done = true
                      } else {
                          newName = `${name} - ${counter}`
                          counter++
                      }
                  } while (!done)
                })
              })
            }  
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

    cropCanvas = (canvas, x, y, width, height) => {
      console.log(`canvas: ${canvas.width}, ${canvas.height}`)
      console.log(`x, y: ${x}, ${y}`)
      console.log(`width, height: ${width}, ${height}`)

      // create a temp canvas
      const newCanvas = document.createElement('canvas')
      // set its dimensions
      newCanvas.width = width
      newCanvas.height = height
      // draw the canvas in the new resized temp canvas 
      newCanvas.getContext('2d').drawImage(canvas, x, y, width, height, 0, 0, width, height)
      return newCanvas
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

    // -------------------------------------------------------------------------------------------- MPR

    mprPlanePosition = () => {
      //console.log("mprPlanePosition: ")
      try {
        if (!this.isDicom) return this.mprPlane
        const imageOrientation = this.image.data.string('x00200037').split('\\')
        let v = new Array(6).fill(0)
        v[0] = parseFloat(imageOrientation[0]) // the x direction cosines of the first row X
        v[1] = parseFloat(imageOrientation[1]) // the y direction cosines of the first row X
        v[2] = parseFloat(imageOrientation[2]) // the z direction cosines of the first row X
        v[3] = parseFloat(imageOrientation[3]) // the x direction cosines of the first column Y
        v[4] = parseFloat(imageOrientation[4]) // the y direction cosines of the first column Y
        v[5] = parseFloat(imageOrientation[5]) // the z direction cosines of the first column Y    
        v = v.map((x) => Math.round(x))
        let p = [v[1]*v[5] - v[2]*v[4], v[2]*v[3] - v[0]*v[5], v[0]*v[4] - v[1]*v[3]] // cross product of X x Y
        p = p.map((x) => Math.abs(x))
        if (p[0] === 1) {
          this.mprPlane = 'sagittal'
        } else if (p[1] === 1) {
          this.mprPlane = 'coronal'
        } else if (p[2] === 1) {
          this.mprPlane = 'axial'
        }
      } catch(error) { // it's not possible to build MPR
        this.mprPlane = ''
      } 
      return this.mprPlane 
    }

    transpose = (matrix) => {
      return Object.keys(matrix[0]).map(colNumber => matrix.map(rowNumber => rowNumber[colNumber]));
    }

    mprRenderYZPlane = (filename, origin, x, mprData) => {
      if (this.volume === null) return
      this.filename = filename
      cornerstone.disable(this.dicomImage)
      //console.log(`mprRenderYZPlane, origin: ${origin}, x: ${x}`)
      //console.log('mprRenderYZPlane, volume: ', this.volume)

      if (origin === 'sagittal') 
        this.mprPlane = 'coronal'
      else if (origin === 'axial') 
        this.mprPlane = 'sagittal'
      else
        this.mprPlane = 'sagittal'

      this.xSize = this.props.files[0].columns
      this.ySize = this.props.files[0].rows 
      this.zSize = mprData.zDim

      const i = Math.round(x / this.xSize * this.props.files.length)
      this.originImage = this.props.files[i].image

      if (origin === 'sagittal') {
        let xoffset = Math.floor(this.xSize / 2) - Math.floor(this.zSize / 2)
        let plane = new Int16Array(this.xSize * this.ySize)
        for (let y = 0; y < this.ySize; y++) 
          for (let z = 0; z < this.zSize; z++) 
            plane[z + this.ySize * y + xoffset] = this.volume[z][x + this.ySize * y]        
        this.loadImageFromCustomObject(this.xSize, this.ySize, plane)

      } else if (origin === 'coronal') {
        let xoffset = Math.floor(this.xSize / 2) - Math.floor(this.zSize / 2)
        let plane = new Int16Array(this.xSize * this.ySize)
        for (let y = 0; y < this.ySize; y++) 
          for (let z = 0; z < this.zSize; z++) 
            plane[z + this.ySize * y + xoffset] = this.volume[z][x + this.ySize * y]        
        this.loadImageFromCustomObject(this.xSize, this.ySize, plane)

      } else { // axial
        const yzPlane = this.mprBuildYZPlane(x)
        this.loadImageFromCustomObject(this.ySize, this.zSize, yzPlane)
      }
    }

    mprBuildYZPlane = (x) => {
      //console.log(`mprBuildYZPlane, ySize: ${this.ySize}, zSize: ${this.zSize} `)
      let plane = new Int16Array(this.ySize * this.zSize)
      for (var y = 0; y < this.ySize; y++) 
        for (var z = 0; z < this.zSize; z++) 
          plane[y + this.ySize * z] = this.volume[z][x + this.ySize * y]
      //console.log('mprBuildYZPlane, plane: ', plane)
      return plane
    }

    mprRenderXZPlane = (filename, origin, y, mprData) => {
      if (this.volume === null) return
      this.filename = filename
      cornerstone.disable(this.dicomImage)
      //console.log(`mprRenderXZPlane, origin: ${origin}, y: ${y}`)
      //console.log('mprRenderXZPlane, volume: ', this.volume)

      if (origin === 'sagittal') 
        this.mprPlane = 'axial'
      else if (origin === 'axial') 
        this.mprPlane = 'coronal'
      else
        this.mprPlane = 'axial'

      this.xSize = this.props.files[0].columns
      this.ySize = this.props.files[0].rows
      this.zSize = mprData.zDim

      const i = Math.trunc(y / this.ySize * this.props.files.length)
      this.originImage = this.props.files[i].image

      if (origin === 'sagittal') {
        let xoffset = Math.floor(this.xSize / 2) - Math.floor(this.zSize / 2)
        let plane = new Int16Array(this.xSize * this.ySize)
        for (let x = 0; x < this.xSize; x++) 
          for (let z = 0; z < this.zSize; z++)
            plane[z + this.xSize * x + xoffset] = this.volume[z][x + this.xSize * y] 
        this.loadImageFromCustomObject(this.xSize, this.ySize, plane)

      } else {
        const xzPlane = this.mprBuildXZPlane(y)
        this.loadImageFromCustomObject(this.xSize, this.zSize, xzPlane)
      }
    }
  
    mprBuildXZPlane = (y) => {
      //console.log(`mprBuildXZPlane, xSize: ${this.xSize}, zSize: ${this.zSize} `)
      let plane = new Int16Array(this.xSize * this.zSize)
      for (let x = 0; x < this.xSize; x++) 
        for (let z = 0; z < this.zSize; z++)
          plane[x + this.xSize * z] = this.volume[z][x + this.xSize * y] 
      //console.log('mprBuildXZPlane, plane: ', plane)    
      return plane
    }  

    mprIsOrthogonalView = () => {
      //console.log('mprIsOrthogonalView: ', this.mprPlane)
      return (this.mprPlane !== '' && this.props.layout[0] === 1 && this.props.layout[1] === 3)
    }

    // -------------------------------------------------------------------------------------------- MPR
    
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
        border: this.props.activeDcmIndex === this.props.index && (this.props.layout[0] > 1 || this.props.layout[1] > 1) ? 'solid 1px #AAAAAA' : null,
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
            style={{
              width: '100%', 
              height: '100%', 
              position: "relative",
              color: '#FFFFFF',
              textShadow: '1px 1px #000000'
            }}
            onContextMenu={() => false}
            className="cornerstone-enabled-image"
          >
            <div 
              ref={this.dicomImageRef} style={styleDicomImage}
            >
            </div>

            <div
              id={`mrtopleft-${this.props.index}`}
              style={{ position: "absolute", top: 0, left: 3, display: isOpen && overlay ? "" : "none" }}
            >
              
            </div>
            <div
              id={`mrtopright-${this.props.index}`}
              style={{ position: "absolute", top: 0, right: 3, display: isOpen && overlay ? "" : "none" }}
            >
              
            </div>
            <div
              id={`mrbottomright-${this.props.index}`}
              style={{ position: "absolute", bottom: 0, right: 3, display: isOpen && overlay ? "" : "none" }}
            >
              
            </div>
            <div
              id={`mrbottomleft-${this.props.index}`}
              style={{ position: "absolute", bottom: 0, left: 3, display: isOpen && overlay ? "" : "none" }}
            >
              
            </div>   

            <div
              id={`mrtopcenter-${this.props.index}`}
              style={{ position: "absolute", top: 0, width: '60px', left: '50%', marginLeft: '0px', display: isOpen && overlay ? "" : "none" }}
            >
              
            </div>

            <div
              id={`mrleftcenter-${this.props.index}`}
              style={{ position: "absolute", top: '50%', width: '30px', left: 3, marginLeft: '0px', display: isOpen && overlay ? "" : "none" }}
            >
              
            </div>    

            <div
              id={`mrrightcenter-${this.props.index}`}
              style={{ position: "absolute", top: '50%', width: '30px', right: 3, marginRight: '-20px', display: isOpen && overlay ? "" : "none" }}
            >
              
            </div>                

            <div
              id={`mrbottomcenter-${this.props.index}`}
              style={{ position: "absolute", bottom: 0, width: '60px', left: '50%', marginLeft: '0px', display: isOpen && overlay ? "" : "none" }}
            >
              
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
    files: state.files,
    url: state.url,
    isOpen: state.isOpen,
    tool: state.tool,
    activeDcmIndex: state.activeDcmIndex,
    activeDcm: state.activeDcm,
    measurements: state.measurements,
    layout: state.layout,
    fsCurrentDir: state.fsCurrentDir,
    fsCurrentList: state.fsCurrentList,
    volume: state.volume,
    lut: state.lut,
    //sandboxedFile: state.sandboxedFile,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    clearingStore: () => dispatch(clearStore()),
    setIsOpenStore: (value) => dispatch(dcmIsOpen(value)),
    toolStore: (tool) => dispatch(dcmTool(tool)),
    setActiveDcm: (dcm) => dispatch(activeDcm(dcm)),
    setActiveMeasurements: (measurements) => dispatch(activeMeasurements(measurements)),
    makeFsRefresh: (dcm) => dispatch(doFsRefresh()),
    //setLutStore: (lut) => dispatch(setLut(lut)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DicomViewer)
