import React from 'react'
import { Button, Card, CardText, Checkbox, SelectionControlGroup, Toolbar } from 'react-md'
import { getSettingsSaveAs, setSettingsSaveAs, 
         getSettingsDcmHeader, setSettingsDcmHeader, 
         getSettingsOverlay, setSettingsOverlay,
         getSettingsMeasurement, setSettingsMeasurement } from '../functions'

const style = { maxWidth: window.innerWidth-40 }

const indexedDBsection = (isIndexedDB, measurement) => {
  if (isIndexedDB) {
    return(
      <Card className="md-block-centered" style={style}>
      <CardText>  
        <Checkbox
          id="checkbox-measurement"
          name="checkbox-measurement[]"
          label="Save Measurement"
          defaultChecked={measurement === '1' ? true : false }
          onChange= {(value) => {
            measurement = value ? '1' : '0'   
            setSettingsMeasurement(measurement)
          }}
        />
      </CardText>
    </Card>    
    )
  } else return
}
const Settings = ({ onClose }) => {
  
  let exportAs = getSettingsDcmHeader()
  let saveAs = getSettingsSaveAs()
  let overlay = getSettingsOverlay()
  let measurement = getSettingsMeasurement()

  const isIndexedDB = 'indexedDB' in window
  
  return (
      <div>
        <Toolbar
          fixed
          nav={<Button icon onClick={() => onClose(false)}>close</Button>}
          title={'Settings'}
        />
        <Card className="md-block-centered" style={style}>
          <CardText>
            <SelectionControlGroup
              id="selection-control-group-radios-1"
              name="radio-saveas"
              type="radio"
              label="Save screenshot as:"
              defaultValue={saveAs}
              onChange={(value) => {setSettingsSaveAs(value)}}
              controls={[{
                label: 'JPEG',
                value: 'jpeg',
              }, {
                label: 'PNG',
                value: 'png',
              }]}            
            />
          </CardText>
        </Card>
        <br />      
        <Card className="md-block-centered" style={style}>
          <CardText>
            <SelectionControlGroup
              id="selection-control-group-radios-2"
              name="radio-export-header"
              type="radio"
              label="Export Dicom header as:"
              defaultValue={exportAs}
              onChange= {(value) => {setSettingsDcmHeader(value)}}
              controls={[{
                label: 'JSON',
                value: 'json',
              }, {
                label: 'CSV',
                value: 'csv',
              }]}            
            />          
          </CardText>
        </Card>
        <br />      
        <Card className="md-block-centered" style={style}>
          <CardText>  
            <Checkbox
              id="checkbox-read-material-design-spec"
              name="simple-checkboxes[]"
              label="Overlay Information"
              defaultChecked={overlay === '1' ? true : false }
              onChange= {(value) => {
                overlay = value ? '1' : '0'
                setSettingsOverlay(overlay)
              }}
            />
          </CardText>
        </Card>
        <br />     
        { indexedDBsection(isIndexedDB, measurement) }
      </div>
  )
}

export default Settings
