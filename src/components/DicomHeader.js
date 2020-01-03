import React from 'react'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import Icon from '@mdi/react'
import IconButton from '@material-ui/core/IconButton'
import { SETTINGS_DCMHEADER } from '../constants/settings'
import { toCsv } from '../functions'
import {
    mdiContentSaveOutline
} from '@mdi/js'

const DicomHeader = ({dcmViewer, classes, color}) => {
    let header = []
    header.push({name: 'Transfer Syntax', value: dcmViewer.getTransferSyntax()})
    header.push({name: 'SOP Class', value: dcmViewer.getSopClass()})
    header.push({name: 'SOP Instance UID', value: dcmViewer.getSopInstanceUID()})
    header.push({name: 'Patient Name', value: dcmViewer.image.data.string('x00100010')})
    header.push({name: 'Frame Rate', value: dcmViewer.image.data.string('x00082144')})
    header.push({name: 'Samples per Pixel', value: dcmViewer.image.data.uint16('x00280002')})
    header.push({name: 'Photometric Interpretation', value: dcmViewer.image.data.string('x00280004')})
    header.push({name: 'Number of Frames', value: dcmViewer.image.data.string('x00280008')})
    header.push({name: 'Planar Configuration', value: dcmViewer.getPlanarConfiguration()})
    header.push({name: 'Rows', value: dcmViewer.image.data.uint16('x00280010')})
    header.push({name: 'Columns', value: dcmViewer.image.data.uint16('x00280011')})
    header.push({name: 'Pixel Spacing', value: dcmViewer.image.data.string('x00280030')})
    header.push({name: 'Bits Allocated', value: dcmViewer.image.data.uint16('x00280100')})
    header.push({name: 'Bits Stored', value: dcmViewer.image.data.uint16('x00280101')})
    header.push({name: 'High Bit', value: dcmViewer.image.data.uint16('x00280102')})
    header.push({name: 'Pixel Representation', value: dcmViewer.getPixelRepresentation()})
    header.push({name: 'Window Center', value: dcmViewer.image.data.string('x00281050')})
    header.push({name: 'Window Width', value: dcmViewer.image.data.string('x00281051')})
    header.push({name: 'Rescale Intercept', value: dcmViewer.image.data.string('x00281052')})
    header.push({name: 'Rescale Slope', value: dcmViewer.image.data.string('x00281053')})
    header.push({name: 'Min Stored Pixel Value', value: dcmViewer.image.minPixelValue})
    header.push({name: 'Max Stored Pixel Value', value: dcmViewer.image.maxPixelValue})

    const listItems = header.map((item, index) => {
        if (item.value !== undefined) 
            return (
                <ListItem dense={true} key={index}>
                    <ListItemText primary={item.name} secondary={item.value} />
                </ListItem>
            ) 
        else return null
    })

    const saveHeader = () => {
        let exportAs = localStorage.getItem(SETTINGS_DCMHEADER)
        if (exportAs === null) {
          exportAs = "json"
          localStorage.setItem(SETTINGS_DCMHEADER, exportAs)
        }  
    
        let fileData = ''
        
        if (exportAs === 'csv') {
          fileData = toCsv(header)
        } else {
          const obj = header.reduce((o, item) => ({ ...o, [item.name]: item.value}), {})
          fileData = JSON.stringify(obj)
        }
        
        const element = document.createElement("a")
        const file = new Blob([fileData], {type: 'text/plain'})
        element.href = URL.createObjectURL(file)
        element.download = `${dcmViewer.localfile.name}.${exportAs}`
        document.body.appendChild(element) // Required for this to work in FireFox
        element.click()
    }

    console.log('dcmViewer', dcmViewer)

    return (
        <div style={{marginTop: '48px'}}>
        <Toolbar variant="dense">
          <Typography variant="subtitle1" className={classes.title}>
            Dicom Header
          </Typography>
          <div className={classes.grow} />
          <IconButton color="inherit" onClick={saveHeader}>
            <Icon path={mdiContentSaveOutline} size={'1.5rem'} color={color} />
          </IconButton>
        </Toolbar>
        <div>
            <List dense={true} component="div">
                {listItems}             
            </List>
        </div>      
      </div>

    )
}
  
export default DicomHeader
