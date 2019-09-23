import React from 'react'
import { Button, Card, CardText, Checkbox, SelectionControlGroup, Toolbar } from 'react-md'
import { getSettingsSaveAs, setSettingsSaveAs, getSettingsDcmHeader, setSettingsDcmHeader, getSettingsOverlay, setSettingsOverlay } from '../functions'

const style = { maxWidth: window.innerWidth-40 }

const Settings = ({ onClose }) => {
  
  let exportAs = getSettingsDcmHeader()
  let saveAs = getSettingsSaveAs()
  let overlay = getSettingsOverlay()

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
                //localStorage.setItem(SETTINGS_OVERLAY, overlay)  
                setSettingsOverlay(overlay)
              }}
            />
          </CardText>
        </Card>
      </div>
  )
}

export default Settings
