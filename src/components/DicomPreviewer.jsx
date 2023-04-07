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
import * as cornerstone from "cornerstone-core"
import * as cornerstoneFileImageLoader from "cornerstone-file-image-loader"
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader"
import {uids} from '../constants/uids'
import OpenUrlDlg from './OpenUrlDlg'

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
  isFileImage,
  isFsFileImage,
  isUrlImage,
} from '../functions'

class DicomPreviewer extends React.Component {
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
      this.numberOfFrames = 1
      this.measurements = []
      this.originImage = null
      this.mprPlane = ''
      this.sliceMax = 0
      this.sliceIndex = 0
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
      this.props.runTool(this)
      const { dcmRef } = this.props
      dcmRef(this)          
    }

    componentWillUnmount() {
      this.props.runTool(undefined)
      const { dcmRef } = this.props
      dcmRef(undefined)            
    }

    componentDidUpdate(previousProps) {
      //console.log('dicomviewer - componentDidUpdate: ')
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
    }

    // Listen for changes to the viewport so we can update the text overlays in the corner
    onImageRendered = (e) => {
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

      const files = this.files === null ? this.props.files : this.files

      const image = files[index].image
      const imageId = files[index].imageId
      this.filename = files[index].name

      const element = this.dicomImage
      element.addEventListener("cornerstonenewimage", this.onNewImage)
      element.addEventListener("cornerstoneimagerendered", this.onImageRendered)
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
 
    }

    loadImage = (localfile, url=undefined, fsItem=undefined) => {

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

        cornerstone.loadImage(url).then(image => {
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
          console.log('loadImage, image from local: ', image)

          this.image = image
          this.isDicom = false
          this.PatientsName = ''

          cornerstone.displayImage(element, image)
          
          this.enableTool()

          this.props.setActiveDcm({image: this.image, element: this.dicomImage, isDicom: this.isDicom})

          this.props.setIsOpenStore({index: this.props.index, value: true})

        }, (e) => {
          console.log('error', e)
          this.setState({errorOnOpenImage: "This is not a valid JPG or PNG file."})
        })

      } else { // otherwise try to open as Dicom file

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

        cornerstone.loadAndCacheImage(imageId).then(image => {
          
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

          this.enableTool()

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

    runTool = (toolName, opt) => {
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
          this.sliceIndex = opt
          this.displayImageFromFiles(opt)
          break   
        }

        case 'reset': {
          this.reset()
          break
        }

        case 'clear': {
          this.files = null
          cornerstone.disable(this.dicomImage)
          break
        }  
  
        default: {
          break
        }
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
      //console.log('onImageClick: ')
    }

    getSeriesNumber = () => {
      if (this.props.series === undefined || this.props.series === null) return     
      return this.props.series.seriesList.get(this.props.series.seriesKeys[this.props.index])[this.props.index].series.seriesNumber
    }

    getSeriesLength = () => {
      if (this.props.series === undefined || this.props.series === null) return     
      return this.props.series.seriesList.get(this.props.series.seriesKeys[this.props.index]).length
    }

    getSeriesDescription = () => {
      if (this.props.series === undefined || this.props.series === null) return
      if (this.props.series.seriesList.get(this.props.series.seriesKeys[this.props.index])[this.props.index] === undefined) return
      return this.props.series.seriesList.get(this.props.series.seriesKeys[this.props.index])[this.props.index].series.seriesDescription
    }

    render() {

      const visible = this.props.visible ? 'visible' : 'hidden'
      const visibleOpenUrlDlg = this.state.visibleOpenUrlDlg
      const errorOnOpenImage = this.state.errorOnOpenImage
      const progress = this.state.progress
      
      this.sliceMax = this.getSeriesLength()

      //console.log('this.props.explorerActiveSeriesIndex: ', this.props.explorerActiveSeriesIndex)
      //console.log('this.props.index: ', this.props.index)
      
      const styleContainer = {
        width: '100%', 
        height: '100%', 
        border: (this.props.explorerActiveSeriesIndex === this.props.index) ? 'solid 1px #AAAAAA' : null,
        position: 'relative',
      }

      const styleDicomImage = {
        width: '100%', 
        height: '100%', 
        position: 'relative',
      }

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
              color:  '#AAAAAA',
              fontSize: '0.80em',
              textShadow: '1px 1px #000000',
              visibility: visible
            }}
            onContextMenu={() => false}
            className="cornerstone-enabled-image"
          >

            <div 
              id={`previewer-${this.props.index}`}
              ref={this.dicomImageRef} style={styleDicomImage}
            >
            </div>

            <div
              id={`mrtopleft-${this.props.index}`}
              style={{ position: "absolute", top: 0, left: 3 }}
            >
             {this.getSeriesNumber()}
            </div>
            <div
              id={`mrtopright-${this.props.index}`}
              style={{ position: "absolute", top: 0, right: 3 }}
            >
              
            </div>
            <div
              id={`mrbottomright-${this.props.index}`}
              style={{ position: "absolute", bottom: 0, right: 3 }}
            >
              {`${this.sliceMax}`}
            </div>
            <div
              id={`mrbottomleft-${this.props.index}`}
              style={{ position: "absolute", bottom: 0, left: 3 }}
            >
              {this.getSeriesDescription()}
            </div>   

            <div
              id={`mrtopcenter-${this.props.index}`}
              style={{ position: "absolute", top: 0, width: '60px', left: '50%', marginLeft: '0px' }}
            >
              
            </div>

            <div
              id={`mrleftcenter-${this.props.index}`}
              style={{ position: "absolute", top: '50%', width: '30px', left: 3, marginLeft: '0px' }}
            >
              
            </div>    

            <div
              id={`mrrightcenter-${this.props.index}`}
              style={{ position: "absolute", top: '50%', width: '30px', right: 3, marginRight: '-20px' }}
            >
              
            </div>                

            <div
              id={`mrbottomcenter-${this.props.index}`}
              style={{ position: "absolute", bottom: 0, width: '60px', left: '50%', marginLeft: '0px' }}
            >
              
            </div>
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
    tool: state.tool,
    activeDcmIndex: state.activeDcmIndex,
    activeDcm: state.activeDcm,
    explorerActiveSeriesIndex: state.explorerActiveSeriesIndex,
    measurements: state.measurements,
    fsCurrentDir: state.fsCurrentDir,
    fsCurrentList: state.fsCurrentList,
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

export default connect(mapStateToProps, mapDispatchToProps)(DicomPreviewer)
