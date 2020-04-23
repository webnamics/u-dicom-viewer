import React, { PureComponent } from 'react'
import {connect} from 'react-redux'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import LinearProgress from '@material-ui/core/LinearProgress'
import * as cornerstone from "cornerstone-core"
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader"
import {
  filesStore,
} from '../actions'
import { 
  getFileNameCorrect,
} from '../functions'

cornerstoneWADOImageLoader.external.cornerstone = cornerstone

class OpenMultipleFilesDlg extends PureComponent {
  constructor(props) {
    super(props)
    this.items = []
    this.count = 0
    this.step = 0
    //this.slicesDistance = []
  }

  state = {
    progress: 0,
    cancel: false,
  }  

  componentDidMount() {
    this.step = this.props.files.length / 50
    this.nextProgress = this.step
    this.t0 = performance.now()

    for (let i=0; i<this.props.files.length; i++) {
      const file = this.props.files[i]
      if (this.state.cancel) {
        this.props.setFilesStore(null)
        this.close()
        return
      }
      let imageId = null 
      
      if (this.props.origin === 'local')
        imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file)
      else // it's fs item
        imageId = cornerstoneWADOImageLoader.wadouri.fileManager.addBuffer(file.data)  

      cornerstone.loadImage(imageId).then((image) => {
        //console.log('image: ', image)
        //try {
          const instanceNumber = this.getInstanceNumber(image)
          const sliceDistance = this.getSliceDistance(image)
          const sliceLocation = this.getSliceLocation(image)         

          //this.slicesDistance.push(sliceDistance)
          //console.log('sliceDistance: ', sliceDistance)
  
          let item = null
          if (this.props.origin === 'local')
            item = {
              imageId: imageId, 
              instanceNumber: instanceNumber, 
              name: getFileNameCorrect(file.name), 
              image: image, 
              rows: this.getRows(image), 
              columns: this.getColumns(image), 
              sliceDistance: sliceDistance,
              sliceLocation: sliceLocation,
            }
          else
            item = {
              imageId: imageId, 
              instanceNumber: instanceNumber, 
              name: file.name, 
              image: image, 
              rows: this.getRows(image), 
              columns: this.getColumns(image), 
              sliceDistance: sliceDistance,
              sliceLocation: sliceLocation,            
            }
          this.items.push(item)
          this.count++
        //} catch(error) {
        //  console.log('Error in reading multiple files: ', file)
        //}
        //console.log('this.count: ', this.count)
        const progress = Math.floor(this.count*(100/this.props.files.length))
        //
        if (progress > this.nextProgress) {
          this.nextProgress += this.step
          this.setState({progress: progress})
        }
        if (this.count === this.props.files.length) {
          this.items.sort((l, r) => {
            return l.instanceNumber - r.instanceNumber
            // return l.sliceDistance - r.sliceDistance
            //return l.sliceLocation - r.sliceLocation
          })
          this.t1 = performance.now()
          console.log(`performance load image: ${this.t1-this.t0} milliseconds`)
          this.props.setFilesStore(this.items)
          this.close()
        }
			}, (e) => {
        console.log('Error in reading multiple files: ', e)
        this.count++
      })
      if (this.count === this.props.files.length) {
        this.close()
      }   
    }

  }
  
  getInstanceNumber = (image) => {
		const value = image.data.string('x00200013')
		if (value === undefined) {
			return
		}
		return value
  }	

  getSliceLocation = (image) => {
		const value = image.data.string('x00201041')
		if (value === undefined) {
			return
		}
		return parseFloat(value)
  }	

  getRows = (image) => {
    const value = image.data.uint16('x00280010')
		if (value === undefined) {
			return
		}
		return value    
  }

  getColumns = (image) => {
    const value = image.data.uint16('x00280011')
		if (value === undefined) {
			return
		}
		return value    
  }  

  // see https://stackoverflow.com/questions/37730772/get-distance-between-slices-in-dicom
  //
  getSliceDistance = (image) => {
    try {
      const ipp = image.data.string('x00200032').split('\\') // Image Position Patient
      //console.log("imagePosition: ", ipp)
      let topLeftCorner = new Array(3).fill(0)
      topLeftCorner[0] = parseFloat(ipp[0]) // X pos of frame (Top left) in real space
      topLeftCorner[1] = parseFloat(ipp[1]) // Y pos of frame (Top left) in real space
      topLeftCorner[2] = parseFloat(ipp[2]) // Z pos of frame (Top left) in real space
      //console.log("topLeftCorner: ", topLeftCorner)

      const iop = image.data.string('x00200037').split('\\') // Image Orientation Patient
      //console.log("values: ", iop)
      let v = new Array(3).fill(0).map(() => new Array(3).fill(0))

      v[0][0] = parseFloat(iop[0]) // the x direction cosines of the first row X
      v[0][1] = parseFloat(iop[1]) // the y direction cosines of the first row X
      v[0][2] = parseFloat(iop[2]) // the z direction cosines of the first row X
      v[1][0] = parseFloat(iop[3]) // the x direction cosines of the first column Y
      v[1][1] = parseFloat(iop[4]) // the y direction cosines of the first column Y
      v[1][2] = parseFloat(iop[5]) // the z direction cosines of the first column Y 

      //console.log("v: ", v)

      // calculate the slice normal from IOP
      v[2][0] = v[0][1] * v[1][2] - v[0][2] * v[1][1]
      v[2][1] = v[0][2] * v[1][0] - v[0][0] * v[1][2]
      v[2][2] = v[0][0] * v[1][1] - v[0][1] * v[1][0]
      
      let dist = 0
      for (let i = 0; i < 3; ++i) 
        dist += v[2][i] * topLeftCorner[i]
        
      return dist
    } catch(error) {
      return 0
    }
  }

  
  close = () => {
    //console.log('this.slicesDistance: ', this.slicesDistance)
    this.props.onClose()
  }

  cancel = () => {
    this.setState({cancel: true}) 
  }

  render() {
    return (
      <div>
        <Dialog
            open={true}
            onClose={this.close}
            aria-labelledby="alert-dialog-title"
        >
            <DialogTitle id="alert-dialog-title">{"Opening multiple files ..."}</DialogTitle>
            <DialogContent>
              <LinearProgress variant="determinate" value={this.state.progress} color='secondary' />
            </DialogContent>
            <DialogActions>
                <Button onClick={this.cancel}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
      </div>
    )
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
      setFilesStore: (files) => dispatch(filesStore(files)),
  }
}

export default connect(null, mapDispatchToProps)(OpenMultipleFilesDlg)
