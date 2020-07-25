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
//import * as math from 'mathjs'
import {uids} from '../constants/uids'
import { SETTINGS_SAVEAS } from '../constants/settings'
import OpenUrlDlg from './OpenUrlDlg'
import CinePlayer from './CinePlayer'
import { isMobile } from 'react-device-detect'
import { import as csTools } from 'cornerstone-tools'
import db from '../db/db'
import fs from '../fs/fs'
//import { EPSILON } from '../LinearAlgebra/constants'
import Matrix from '../LinearAlgebra/Matrix'
import Point from '../LinearAlgebra/Point'
//import Vector from '../LinearAlgebra/Vector'
import Line from '../LinearAlgebra/Line'
import DicomGeometry from '../DicomGeometry/DicomGeometry'

import { 
  areEqual, 
} from '../LinearAlgebra/utils'

import {
  clearStore, 
  dcmIsOpen, 
  activeDcm, 
  dcmTool, 
  activeMeasurements,
  doFsRefresh,
  setDcmEnableTool,
} from '../actions'

import {
  getDicomIpp,
  //getDicomFrameOfReferenceUID,
  capitalize,  
  getFileName,
  getSettingsOverlay,  
  getSettingsSaveInto,
  isFileImage,
  isFsFileImage,
  isLocalizer,  
  isUrlImage,
  //objectIsEmpty,
} from '../functions'


const scrollToIndex = csTools('util/scrollToIndex')

cornerstoneTools.external.cornerstone = cornerstone
cornerstoneTools.external.cornerstoneMath = cornerstoneMath
cornerstoneFileImageLoader.external.cornerstone = cornerstone
cornerstoneWebImageLoader.external.cornerstone = cornerstone
cornerstoneWADOImageLoader.external.cornerstone = cornerstone
cornerstoneWADOImageLoader.external.dicomParser = dicomParser
cornerstoneTools.external.Hammer = Hammer
cornerstoneTools.init({
  globalToolSyncEnabled: true,
})

class DicomViewer extends React.Component {
    constructor(props) {
      super(props)
      this.files = null
      this.filename = ''
      this.localfile = null
      this.localurl = null
      this.fsItem = null
      this.dicomImage = null
      this.explorerIndex = 0
      this.imageId = null
      this.image = null
      this.isDicom = false
      this.layoutIndex = 0
      this.numberOfFrames = 1
      this.measurements = []
      this.xSize = 0
      this.ySize = 0
      this.zSize = 0
      this.volume = null
      this.originImage = null
      this.mprPlane = ''
      this.sliceMax = 0
      this.sliceIndex = 0
      this.mpr = {}      
      this.referenceLines = {}
      this.shouldScroll = false
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
      //console.log('dicomviewer - componentDidMount: ')
      this.props.runTool(this)
      this.props.changeTool(this)
      cornerstone.events.addEventListener('cornerstoneimageloaded', this.onImageLoaded)
      const { dcmRef } = this.props
      dcmRef(this)          
      this.layoutIndex = this.props.index

      document.getElementById(`viewer-${this.props.index}`).addEventListener("wheel", this.handlerMouseScroll)
    }

    componentWillUnmount() {
      this.props.runTool(undefined)
      this.props.changeTool(undefined)
      const { dcmRef } = this.props
      dcmRef(undefined)            
    }

    componentDidUpdate(previousProps) {
      //console.log('dicomviewer - componentDidUpdate: ')
      const isOpen = this.props.isOpen[this.props.index]
      if (this.props.layout !== previousProps.layout && isOpen) {
        cornerstone.resize(this.dicomImage)
      }
    }
  
    handlerMouseScroll = (e) => {
      if (this.shouldScroll) { 
        if (e.deltaY > 0) this.props.listOpenFilesNextFrame()
        else if (e.deltaY < 0) this.props.listOpenFilesPreviousFrame()
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

    getDicomViewerElement = () => {
      return document.getElementsByClassName('cornerstone-enabled-image')
    }
   
    onImageLoaded = (e) => {
      //console.log('cornerstoneimageloaded: ')
      this.props.onLoadedImage()
    }

    // Listen for changes to the viewport so we can update the text overlays in the corner
    onImageRendered = (e) => {
      //console.log('cornerstoneimagerendered: ', e.target)

      //const viewport = cornerstone.getViewport(this.dicomImage)
      const viewport = cornerstone.getViewport(e.target)
      this.zoom = Math.round(viewport.scale.toFixed(2)*100)

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
      ).textContent = `Zoom: ${this.zoom}%`

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

      if (this.referenceLines.isScoutDraw) {
        this.referenceLines.isScoutDraw = false
        this.referenceLinesDraw()
      }

      if (this.mpr.isSliceLocation) {
        this.mpr.isSliceLocation = false
        this.mprSliceLocationDraw()
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

      this.props.onRenderedImage(this.props.index)
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

    updateImage = () => {
      const element = this.dicomImage
      cornerstone.updateImage(element)
    }

    displayImageFromFiles = (index) => {
      //console.log('displayImageFromFiles: ', index)

      const files = this.files === null ? this.props.files : this.files

      const image = files[index].image
      const imageId = files[index].imageId
      this.filename = files[index].name
      this.sliceIndex = index

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

      this.mprPlanePosition()
      
      this.enableTool()

      if (this.numberOfFrames > 1) {
        cornerstoneTools.addStackStateManager(element, ['stack', 'playClip']);    
        cornerstoneTools.addToolState(element, 'stack', stack)
        this.setState({frame: 1})
      }
     
      // Load the possible measurements from DB and save in the store 
      db.measurement.where('sopinstanceuid').equals(this.sopInstanceUid).each(measure => {
        //console.log('load measure from db: ', measure)
        this.measurementSave(measure)
        cornerstoneTools.addToolState(element, measure.tool, measure.data)
        this.runTool(measure.tool)
        cornerstone.updateImage(element)
        cornerstoneTools.setToolEnabled(measure.tool)
      }).then(() => {
        //if (this.useIsNormal) {
          this.props.setActiveMeasurements(this.measurements)
          this.props.setActiveDcm(this) // {image: this.image, element: this.dicomImage, isDicom: this.isDicom}     
          this.props.setIsOpenStore({index: this.props.index, value: true})         
        //} 
      })   
      
    }

    loadImageFromCanvas = (canvas) => {
      //console.log('loadImageFromCanvas, dcmViewer: ', this.props.index)

      const element = this.dicomImage
      element.addEventListener("cornerstonenewimage", this.onNewImage)
      element.addEventListener("cornerstoneimagerendered", this.onImageRendered)
      element.addEventListener("cornerstonetoolsmeasurementadded", this.onMeasurementAdded)
      element.addEventListener("cornerstonetoolsmeasurementmodified", this.onMeasurementModified)
      element.addEventListener("cornerstonetoolsmeasurementcompleted", this.onMeasurementCompleted)
      cornerstone.enable(element)

      const imageId = cornerstoneFileImageLoader.fileManager.addCanvas(canvas)

      cornerstone.loadImage(imageId).then(image => {
        this.image = image

        this.isDicom = false

        cornerstone.displayImage(element, image)

        this.enableTool()

        this.props.setIsOpenStore({index: this.props.index, value: true})

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

      if (localfile === undefined && isUrlImage(url)) { // check if it's a simple image [jpeg or png] from url
        //console.log('image: ', file)
        cornerstone.loadImage(url).then(image => {
          //console.log('loadImage, image from url: ', image)

          this.hideOpenUrlDlg()

          this.image = image

          this.isDicom = false

          cornerstone.displayImage(element, image)
          
          this.enableTool()

          this.props.setActiveDcm(this) // {image: this.image, element: this.dicomImage, isDicom: this.isDicom}
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
          console.log('loadImage, image from local: ', image)

          this.image = image
          this.isDicom = false
          this.PatientsName = ''

          cornerstone.displayImage(element, image)
          
          this.enableTool()

          this.props.setActiveDcm(this) // {image: this.image, element: this.dicomImage, isDicom: this.isDicom}
          //this.props.isOpenStore(true)
          this.props.setIsOpenStore({index: this.props.index, value: true})

        }, (e) => {
          console.log('error', e)
          this.setState({errorOnOpenImage: "This is not a valid JPG or PNG file."})
        })

      } else { // otherwise try to open as Dicom file
        //let size = 0
        if (fsItem !== undefined) {
          imageId = cornerstoneWADOImageLoader.wadouri.fileManager.addBuffer(fsItem.data)
          this.filename = fsItem.name
          //size = fsItem.size
        } else if (localfile !== undefined) {
          imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(localfile)
          this.filename = localfile.name
          //size = localfile.size
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

          if (this.numberOfFrames > 1) {
            cornerstoneTools.addStackStateManager(element, ['stack', 'playClip']);    
            cornerstoneTools.addToolState(element, 'stack', stack)
            //cornerstoneTools.setToolActive('StackScrollMouseWheel', { })
            this.setState({frame: 1})
          }
  
          // Load the possible measurements from DB and save in the store 
          db.measurement.where('sopinstanceuid').equals(this.sopInstanceUid).each(measure => {
            //console.log('load measure from db: ', measure)
            //this.props.measurementStore(measure)
            this.measurementSave(measure)
            cornerstoneTools.addToolState(element, measure.tool, measure.data)
            this.runTool(measure.tool)
            cornerstone.updateImage(element)
            cornerstoneTools.setToolEnabled(measure.tool)
          }).then(() => {
            //console.log('this.measurements: ', this.measurements)
            this.props.setActiveMeasurements(this.measurements)
            this.props.setActiveDcm(this) // {name: this.filename, size: size, image: this.image, element: this.dicomImage, isDicom: this.isDicom}
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
      if (this.props.dcmEnableTool) return
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
      
      this.props.setDcmEnableToolStore(true)
    }
  
    // helper function used by the tool button handlers to disable the active tool
    // before making a new tool active
    disableAllTools = () => {
      this.props.setDcmEnableToolStore(false)
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
      //console.log(`runTool: ${toolName}, ${opt}`)
      if (this.state.inPlay) {
        this.runCinePlayer('pause')
      }
      switch (toolName) {
        case 'setfiles': {
          this.files = opt
          this.sliceMax = this.files.length
          this.shouldScroll = this.files.length > 1
          break   
        }        
        case 'openimage': {
          cornerstone.disable(this.dicomImage)
          this.displayImageFromFiles(opt)
          break   
        }
        case 'openLocalFs': {
          cornerstone.disable(this.dicomImage)
          this.loadImage(opt)
          break   
        } 
        case 'openSandboxFs': {
          cornerstone.disable(this.dicomImage)
          this.loadImage(undefined, undefined, opt)
          break   
        }         
        case 'openurl': {
          this.showOpenUrlDlg(opt)
          break                 
        }
        case 'clear': {
          this.setState({ visibleCinePlayer: false })
          this.mprPlane = ''
          this.files = null
          this.props.setIsOpenStore({index: this.props.index, value: false}) 
          cornerstone.disable(this.dicomImage)
          break
        }  
        case 'notool': {
          this.disableAllTools()
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
          //console.log('removetool index: ', opt)
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
      //console.log('change tool, value: ', toolName, value)

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
    //#region MPR

    mprPlanePosition = () => {
      try {
        if (!this.isDicom) return this.mprPlane
        const image = this.files[0].image
        const imageOrientation = image.data.string('x00200037').split('\\')
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
      
      //console.log('mprRenderYZPlane, mprData: ', mprData) 

      this.mprData = mprData

      const files = this.files === null ? this.props.files : this.files

      this.sliceIndex = x
      
      this.filename = filename
      cornerstone.disable(this.dicomImage)

      if (origin === 'sagittal') 
        this.mprPlane = 'coronal'
      else if (origin === 'axial') 
        this.mprPlane = 'sagittal'
      else
        this.mprPlane = 'sagittal'

      this.xSize = files[0].columns
      this.ySize = files[0].rows 
      this.zSize = mprData.zDim

      const i = Math.round(x / this.xSize * files.length)
      this.originImage = files[i].image

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
      return plane
    }

    mprRenderXZPlane = (filename, origin, y, mprData) => {
      if (this.volume === null) return

      this.mprData = mprData

      //console.log('mprRenderXZPlane, mprData: ', mprData) 

      const files = this.files === null ? this.props.files : this.files
      
      this.sliceIndex = y

      this.filename = filename
      cornerstone.disable(this.dicomImage)

      if (origin === 'sagittal') 
        this.mprPlane = 'axial'
      else if (origin === 'axial') 
        this.mprPlane = 'coronal'
      else
        this.mprPlane = 'axial'

      this.xSize = files[0].columns
      this.ySize = files[0].rows
      this.zSize = mprData.zDim

      const i = Math.trunc(y / this.ySize * files.length)
      this.originImage = files[i].image

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
      let plane = new Int16Array(this.xSize * this.zSize)
      for (let x = 0; x < this.xSize; x++) 
        for (let z = 0; z < this.zSize; z++)
          plane[x + this.xSize * z] = this.volume[z][x + this.xSize * y]     
      return plane
    }  

    mprIsOrthogonalView = () => {
      return (this.mprPlane !== '' && this.props.layout[0] === 1 && this.props.layout[1] === 3)
    }

    mprReferenceLines = (index) => {
      const fromPlane = this.props.activeDcm.mprPlane
      const toPlane = this.mprPlane
      const border = 3
      const offset = this.mprData.instanceNumberOrder === 1 ? index * this.mprData.zStep : (this.mprData.indexMax - index) * this.mprData.zStep

      this.mpr.sliceLocation = {}
      if (fromPlane === 'axial') {
        this.mpr.sliceLocation.p0 = new Point(border, offset)
        this.mpr.sliceLocation.p1 = new Point(this.xSize-border, offset)
      } else if (fromPlane === 'sagittal') {
        const start = Math.round((this.xSize - this.zSize) / 2)
        this.mpr.sliceLocation.p0 = new Point(start+offset, border)
        this.mpr.sliceLocation.p1 = new Point(start+offset, this.ySize-border)
      } else { // from coronal
        if (toPlane === 'axial') {
          this.mpr.sliceLocation.p0 = new Point(border, offset)
          this.mpr.sliceLocation.p1 = new Point(this.xSize-border, offset)
        } else { // to sagittal
          const start = Math.round((this.xSize - this.zSize) / 2)
          this.mpr.sliceLocation.p0 = new Point(start+offset, border)
          this.mpr.sliceLocation.p1 = new Point(start+offset, this.ySize-border)       
        }
      }
      this.mpr.isSliceLocation = true
      this.updateImage()
    }

    mprReferenceLines2 = (index) => { // from second view to third view or from third view to second view
      const fromPlane = this.props.activeDcm.mprPlane
      const toPlane = this.mprPlane
      const border = 3
      const offset = this.mprData.instanceNumberOrder === 1 ?  index : index

      this.mpr.sliceLocation = {}
      if (fromPlane === 'axial') {
        this.mpr.sliceLocation.p0 = new Point(border, offset)
        this.mpr.sliceLocation.p1 = new Point(this.xSize-border, offset)
      } else if (fromPlane === 'sagittal') {
        this.mpr.sliceLocation.p0 = new Point(offset, border)
        this.mpr.sliceLocation.p1 = new Point(offset, this.zSize-border)
      } else { // from coronal
        if (toPlane === 'axial') {
          this.mpr.sliceLocation.p0 = new Point(border, offset)
          this.mpr.sliceLocation.p1 = new Point(this.xSize-border, offset)
        } else { // to sagittal
          this.mpr.sliceLocation.p0 = new Point(offset, border)
          this.mpr.sliceLocation.p1 = new Point(offset, this.zSize-border)      
        }
      }
      this.mpr.isSliceLocation = true
      this.updateImage()
    }

    mprReferenceLines3 = (index, mprData) => { // from second or third view to first view
      const xSize = this.image.columns
      const ySize = this.image.rows
      const fromPlane = this.props.activeDcm.mprPlane
      const toPlane = this.mprPlane
      const offset = 3

      this.mpr.sliceLocation = {}
      if (fromPlane === 'axial') {
        this.mpr.sliceLocation.p0 = new Point(offset, index)
        this.mpr.sliceLocation.p1 = new Point(xSize-offset, index)
      } else if (fromPlane === 'sagittal') {
        this.mpr.sliceLocation.p0 = new Point(index, offset)
        this.mpr.sliceLocation.p1 = new Point(index, ySize-offset)
      } else { // from coronal
        if (toPlane === 'axial') {
          this.mpr.sliceLocation.p0 = new Point(offset, index)
          this.mpr.sliceLocation.p1 = new Point(xSize-offset, index)
        } else { // to sagittal
          this.mpr.sliceLocation.p0 = new Point(index, offset)
          this.mpr.sliceLocation.p1 = new Point(index, ySize-offset)      
        }
      }
      this.mpr.isSliceLocation = true
      this.updateImage()
    }

    mprSliceLocationDraw = () => {
      const canvas = document.getElementById(`viewer-${this.props.index}`).getElementsByClassName('cornerstone-canvas')[0]
      const ctx = canvas.getContext("2d")
      const p0 = this.mpr.sliceLocation.p0
      const p1 = this.mpr.sliceLocation.p1
      ctx.beginPath()
      ctx.setLineDash([])
      if (this.zoom < 150) ctx.lineWidth = 2
      ctx.strokeStyle = 'rgba(255, 255, 51, 0.7)'
      ctx.moveTo(p0.x, p0.y)
      ctx.lineTo(p1.x, p1.y)
      ctx.lineWidth = 1
      ctx.stroke()
    }

    //#endregion

    // -------------------------------------------------------------------------------------------- REFERENCE LINES
    //#region REFERENCE LINES

    // see https://stackoverflow.com/questions/10241062/how-to-draw-scout-reference-lines-in-dicom
    //     http://www.dclunie.com/dicom3tools/workinprogress/dcpost.cc
    // 
    referenceLinesBuild = (srcImage) => {
      //console.log('referenceLinesBuild - srcImage: ', srcImage)
      
      this.referenceLines.dst = new DicomGeometry(this.image)
      //console.log('this.referenceLines.dst: ', this.referenceLines.dst)
      this.referenceLines.src = new DicomGeometry(srcImage)
      //console.log('this.referenceLines.src: ', this.referenceLines.src)

      this.referenceLines.isReferenceLine = this.referenceLines.dst.orientation !== undefined &&
                                            this.referenceLines.src.orientation !== undefined && 
                                            this.referenceLines.dst.orientation !== this.referenceLines.src.orientation

      this.referenceLines.isScoutDraw = true

      this.updateImage()

    }

    referenceLinesBuildLine = () => {
      const dst = this.referenceLines.dst
      const src = this.referenceLines.src

      const nP = dst.nrmDir.dotProduct(dst.topLeft)
      const nA = dst.nrmDir.dotProduct(src.topLeft)
      const nB = dst.nrmDir.dotProduct(src.topRight)
      const nC = dst.nrmDir.dotProduct(src.bottomRight)
      const nD = dst.nrmDir.dotProduct(src.bottomLeft)

      let list = []

      if (!areEqual(nB, nA)) {
        const t = (nP - nA) / (nB - nA)
        if (t > 0 && t <= 1) 
          list.push(src.topLeft.add((src.topRight.sub(src.topLeft)).mul(t)))
      }

      if (!areEqual(nC, nB)) { 
        const t = (nP - nB) / (nC - nB)
        if (t > 0 && t <= 1)
          list.push(src.topRight.add((src.bottomRight.sub(src.topRight)).mul(t)))
      }
        
      if (!areEqual(nD, nC)) { 
        const t = (nP - nC) / (nD - nC)
        if (t > 0 && t <= 1)
          list.push(src.bottomRight.add((src.bottomLeft.sub(src.bottomRight)).mul(t)))
      }

      if (!areEqual(nA, nD)) { 
        const t = (nP - nD) / (nA - nD)
        if (t > 0 && t <= 1)
          list.push(src.bottomLeft.add((src.topLeft.sub(src.bottomLeft)).mul(t)))
      }

      // the destinationplane should have been crossed exactly two times
      if (list.length !== 2)
        return 

      // now back from 3D patient space to 2D pixel space
      const p = {
        startPoint: this.transformDstPatientPointToImage(list[0]),
        endPoint:   this.transformDstPatientPointToImage(list[1])
      }
      return p      
    }

    transformDstPatientPointToImage = (p) => {
      const v = new Matrix(
        [p.x], 
        [p.y], 
        [p.z], 
        [1]
      )
      const transformed = this.referenceLines.dst.transformRcsToImage.multiply(v)
      // validation, if the point is within the image plane, then the z-component of the transformed point should be zero
      const point = new Point(Math.round(transformed.get(0,0)), Math.round(transformed.get(1,0)))
      return point
    }

    referenceLinesBuildPlane = () => {
      const dst = this.referenceLines.dst 
      const src = this.referenceLines.src 

      let pos = []

      // TLHC is what is in ImagePositionPatient
      pos[0] = src.topLeft
      // TRHC
      pos[1] = src.topLeft.add(src.rowDir.mul(src.lengthX))
      // BRHC
      pos[2] = src.topLeft.add((src.rowDir.mul(src.lengthX)).add(src.colDir.mul(src.lengthY)))
      // BLHC
      pos[3] = src.topLeft.add(src.colDir.mul(src.lengthY))

      let pixel = []

      let rotation = new Matrix(
        dst.rowDir.toArray(),
        dst.colDir.toArray(),
        dst.nrmDir.toArray()
      )

      for (let i = 0; i < 4; i++) {            
          // move everything to origin of target
          pos[i] = pos[i].add(Point.zero.sub(dst.topLeft))

          // The rotation is easy ... just rotate by the row, col and normal vectors ...
          const m = rotation.multiply(pos[i].toMatrix())
          pos[i] = new Point(Math.round(m.get(0,0)), Math.round(m.get(1,0)), Math.round(m.get(2,0))) 

          // DICOM coordinates are center of pixel 1\1
          pixel[i] = new Point(Math.trunc(pos[i].x / dst.spacingY + 0.5),
                               Math.trunc(pos[i].y / dst.spacingX + 0.5))
      }         

      //console.log('referenceLinesBuildPlane: ', pixel)
      return pixel
    }

    referenceLinesDraw = () => {
      if (!this.referenceLines.isReferenceLine) return

      const canvas = document.getElementById(`viewer-${this.props.index}`).getElementsByClassName('cornerstone-canvas')[0]
      const ctxH = canvas.getContext("2d")

      this.referenceLines.plane = this.referenceLinesBuildPlane()

      this.referenceLines.line = this.referenceLinesBuildLine()

      const line = this.referenceLines.line
      
      ctxH.beginPath()
      ctxH.setLineDash([])
      ctxH.strokeStyle = 'rgba(255, 255, 51, 0.5)'
      ctxH.moveTo(line.startPoint.x, line.startPoint.y)
      ctxH.lineTo(line.endPoint.x, line.endPoint.y)
      ctxH.lineWidth = 1
      ctxH.stroke()

      const plane = this.referenceLines.plane

      const d = Math.max(this.referenceLines.dst.rows, this.referenceLines.dst.cols) / 30

      const line0 = new Line(plane[0], plane[1])
      const line1 = new Line(plane[1], plane[2])
      const line2 = new Line(plane[2], plane[3])
      const line3 = new Line(plane[3], plane[0])

      if (Math.min(line0.distance(line2), line1.distance(line3)) < d) return

      ctxH.beginPath()
      ctxH.setLineDash([3, 3])
      ctxH.strokeStyle = 'rgba(135, 206, 250, 0.5)'
      ctxH.moveTo(plane[0].x, plane[0].y)
      ctxH.lineTo(plane[1].x, plane[1].y)
      ctxH.lineTo(plane[2].x, plane[2].y)
      ctxH.lineTo(plane[3].x, plane[3].y)
      ctxH.lineTo(plane[0].x, plane[0].y)
      ctxH.lineWidth = 1
      ctxH.stroke()
    }
    
    //#endregion


    dicomImageRef = el => {
      this.dicomImage = el
    }

    onImageClick = () => {
      //console.log('onImageClick: ')
    }

    isLocalizer = () => {
      return isLocalizer(this.image)
    }

    findFirstSliceWithIppValue = (ippValue, ippPos) => {
      const increasing = this.files[0].sliceDistance - this.files[this.files.length-1].sliceDistance < 0
      //console.log('DicomViewer - findFirstSliceWithIppValue, ippValue: ', ippValue)
      for(let i=0; i < this.files.length; i++) {
        const ipp = getDicomIpp(this.files[i].image, ippPos)
        //console.log(`DicomViewer - findFirstSliceWithIppValue, i: ${i}, ipp: ${ipp}`)
        if (increasing) {
          if (ipp >= ippValue) return i          
        } else {
          if (ipp <= ippValue) return i          
        }
      }
      return -1
    }

    render() {

      const visible = this.props.visible ? 'visible' : 'hidden'
      const isOpen = this.props.isOpen[this.props.index]
      const visibleOpenUrlDlg = this.state.visibleOpenUrlDlg
      const errorOnOpenImage = this.state.errorOnOpenImage
      const progress = this.state.progress

      const styleContainer = {
        width: '100%', 
        height: '100%', 
        border: (this.props.activeDcmIndex === this.props.index && (this.props.layout[0] > 1 || this.props.layout[1] > 1)) ? 'solid 1px #AAAAAA' : null,
        position: 'relative',
      }

      const styleDicomImage = {
        width: '100%', 
        height: '100%', 
        position: 'relative',
      }

      const overlay = getSettingsOverlay() && this.props.overlay

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
              color:  '#FFFFFF',
              fontSize: '1.00em',
              textShadow: '1px 1px #000000',
              visibility: visible
            }}
            onContextMenu={() => false}
            className="cornerstone-enabled-image"
          >

            <div 
              id={`viewer-${this.props.index}`}
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
          </div>
        </div>
      )
    }
  }
  
const mapStateToProps = (state) => {
  return {
    files: state.files,
    series: state.series,
    url: state.url,
    isOpen: state.isOpen,
    tool: state.tool,
    activeDcmIndex: state.activeDcmIndex,
    activeDcm: state.activeDcm,
    explorerActiveSeriesIndex: state.explorerActiveSeriesIndex,
    measurements: state.measurements,
    layout: state.layout,
    fsCurrentDir: state.fsCurrentDir,
    fsCurrentList: state.fsCurrentList,
    volume: state.volume,
    dcmEnableTool: state.dcmEnableTool,
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
    setDcmEnableToolStore: (value) => dispatch(setDcmEnableTool(value))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DicomViewer)
