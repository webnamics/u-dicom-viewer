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
  //allFilesStore,
  filesStore,
} from '../actions'
import { 
  getDicomPatientName,
  getDicomStudyId,
  getDicomStudyDate,
  getDicomStudyTime,
  getDicomStudyDescription,
  getDicomSeriesDate,
  getDicomSeriesTime,
  getDicomSeriesDescription,
  getDicomSeriesNumber,
  getDicomInstanceNumber,
  getDicomSliceLocation,
  getDicomSliceDistance,
  getDicomRows,
  getDicomColumns,
  getDicomEchoNumber,
  getFileNameCorrect,
  dicomDateTimeToLocale,
} from '../functions'

cornerstoneWADOImageLoader.external.cornerstone = cornerstone

class OpenMultipleFilesDlg extends PureComponent {

  state = {
    progress: 0,
    cancel: false,
  }  

  componentDidMount() {
    //console.log('OpenMultipleFilesDlg - componentDidMount: ', this.props.files)

    this.items = []
    this.count = 0
    this.step = 0

    const files = this.props.files

    this.step = files.length / 50
    this.nextProgress = this.step
    this.t0 = performance.now()

    //console.log('OpenMultipleFilesDlg - cachedImages: ', cornerstone.imageCache.cachedImages)

    //cornerstoneWADOImageLoader.wadouri.fileManager.purge()
    //cornerstone.imageCache.purgeCache()
    
    let imageIds = [] 

    for (let i=0; i < files.length; i++) {
      const file = files[i]
      if (this.props.origin === 'local')
        imageIds.push(cornerstoneWADOImageLoader.wadouri.fileManager.add(file))
      else // it's fs item
        imageIds.push(cornerstoneWADOImageLoader.wadouri.fileManager.addBuffer(file.data))
    }
    
    //console.log('OpenMultipleFilesDlg - files: ', files)

    for (let i=0; i < files.length; i++) {
      const file = files[i]
      if (this.state.cancel) {
        //this.props.setAllFilesStore(null)
        this.props.setFilesStore(null)
        this.close()
        return
      }
      
      //console.log('imageId', imageIds[i])
      
      cornerstone.loadImage(imageIds[i]).then((image) => {
        //console.log('image', image)
        const patientName = getDicomPatientName(image)

        const studyId = getDicomStudyId(image)
        const studyDate = getDicomStudyDate(image)
        const studyTime = getDicomStudyTime(image)
        const studyDescription = getDicomStudyDescription(image)

        const seriesDate = getDicomSeriesDate(image)
        const seriesTime = getDicomSeriesTime(image)
        const seriesDescription = getDicomSeriesDescription(image)        
        const seriesNumber = getDicomSeriesNumber(image)

        const instanceNumber = getDicomInstanceNumber(image)
        const sliceDistance = getDicomSliceDistance(image)
        const echoNumber = getDicomEchoNumber(image)
        const sliceLocation = getDicomSliceLocation(image)  
        const columns = getDicomColumns(image)       
        const rows = getDicomRows(image)

        const studyDateTime = studyDate === undefined ? undefined : dicomDateTimeToLocale(`${studyDate}.${studyTime}`)

        let item = null
        if (this.props.origin === 'local')
          item = {
            imageId: imageIds[i], 
            instanceNumber: instanceNumber, 
            name: getFileNameCorrect(file.name), 
            image: image, 
            rows: rows, 
            columns: columns, 
            sliceDistance: sliceDistance,
            sliceLocation: sliceLocation,
            patient: {
              patientName: patientName
            },
            study: {
              studyId: studyId,
              studyDate: studyDate,
              studyTime: studyTime,
              studyDateTime: studyDateTime,
              studyDescription: studyDescription
            },
            series: {
              seriesDate: seriesDate,
              seriesTime: seriesTime,
              seriesDescription: seriesDescription,
              seriesNumber: seriesNumber,
              echoNumber: echoNumber
            }
          }
        else
          item = {
            imageId: imageIds[i], 
            instanceNumber: instanceNumber, 
            name: file.name, 
            image: image, 
            rows: rows, 
            columns: columns, 
            sliceDistance: sliceDistance,
            sliceLocation: sliceLocation,  
            patient: {
              patientName: patientName
            },
            study: {
              studyId: studyId,
              studyDate: studyDate,
              studyTime: studyTime,
              studyDateTime: studyDateTime,
              studyDescription: studyDescription
            },
            series: {
              seriesDate: seriesDate,
              seriesTime: seriesTime,
              seriesDescription: seriesDescription,
              seriesNumber: seriesNumber,
              echoNumber: echoNumber
            }          
          }
        this.items.push(item)
        this.count++

        const progress = Math.floor(this.count*(100/files.length))
        //
        if (progress > this.nextProgress) {
          this.nextProgress += this.step
          this.setState({progress: progress})
        }
        if (this.count === files.length) {
          this.items.sort((l, r) => {
            return l.instanceNumber - r.instanceNumber
            // return l.sliceDistance - r.sliceDistance
            // return l.sliceLocation - r.sliceLocation
          })
          this.t1 = performance.now()
          console.log(`performance load ${this.count} images in ${this.t1-this.t0} milliseconds`)
          this.props.setFilesStore(this.items)
          this.close()
        }
			}, (e) => {
        console.log('Error in reading multiple files: ', e)
        this.count++
      })
      if (this.count === files.length) {
        
      }   
    }
    //this.close()
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
      //setAllFilesStore: (files) => dispatch(allFilesStore(files)),
      setFilesStore: (files) => dispatch(filesStore(files)),
  }
}

export default connect(null, mapDispatchToProps)(OpenMultipleFilesDlg)
