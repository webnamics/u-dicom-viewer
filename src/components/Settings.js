import React from 'react'
//import { Button, Card, CardText, Checkbox, SelectionControlGroup, Toolbar } from 'react-md'
import { getSettingsSaveAs, setSettingsSaveAs, 
         getSettingsDcmHeader, setSettingsDcmHeader, 
         getSettingsOverlay, setSettingsOverlay } from '../functions'

import { makeStyles } from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
//import Button from '@material-ui/core/Button'
import Checkbox from '@material-ui/core/Checkbox'
import CloseIcon from '@material-ui/icons/Close'
import Dialog from '@material-ui/core/Dialog'
import Divider from '@material-ui/core/Divider'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import FormControl from '@material-ui/core/FormControl'
import FormLabel from '@material-ui/core/FormLabel'
import IconButton from '@material-ui/core/IconButton'
import Radio from '@material-ui/core/Radio'
import RadioGroup from '@material-ui/core/RadioGroup'
import Slide from '@material-ui/core/Slide'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'

//const style = { maxWidth: window.innerWidth-40 }

const useStyles = makeStyles(theme => ({
  appBar: {
    position: 'relative',
  },
  formControl: {
    margin: theme.spacing(3),
  },
  title: {
    marginLeft: theme.spacing(2),
    flex: 1,
  },
}))

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
})

const Settings = ({ onClose }) => {
  
  let saveAs = getSettingsSaveAs()
  let exportAs = getSettingsDcmHeader()
  let overlay = getSettingsOverlay()

  //const isIndexedDB = false // 'indexedDB' in window
  
  const handleChangeSaveAs = event => {
    setState({ ...state, 'saveAs': event.target.value })
    setSettingsSaveAs(event.target.value)
  }

  const handleChangeExportAs = event => {
    setState({ ...state, 'exportAs': event.target.value })
    setSettingsDcmHeader(event.target.value)
  }

  const handleChangeOverlay = event => {
    setState({ ...state, 'overlay': event.target.checked })
    setSettingsOverlay(event.target.checked)
  }

  const classes = useStyles()

  const [state, setState] = React.useState({
    saveAs: saveAs,
    exportAs: exportAs,
    overlay: overlay,
  })

  return (
    <div>
      <Dialog fullScreen open={true} onClose={onClose} TransitionComponent={Transition}>
        <AppBar className={classes.appBar}>
          <Toolbar variant="dense">
            <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" className={classes.title}>
              Settings
            </Typography>
          </Toolbar>
        </AppBar>
        <div>
        <FormControl component="fieldset" className={classes.formControl}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={state.overlay} 
                  onChange={handleChangeOverlay}
                  value="overlay" 
                />
              }
              label="Show overlay Information"
            />
          </FormControl>
          <Divider />
          <FormControl component="fieldset" className={classes.formControl}>
            <FormLabel component="legend">Save screenshot as:</FormLabel>
            <RadioGroup aria-label="saveas" name="saveas" value={state.saveAs} onChange={handleChangeSaveAs}>
              <FormControlLabel value="jpeg" control={<Radio />} label="JPEG" />
              <FormControlLabel value="png" control={<Radio />} label="PNG" />
            </RadioGroup>
          </FormControl>
          <Divider />
          <FormControl component="fieldset" className={classes.formControl}>
            <FormLabel component="legend">Export Dicom header as:</FormLabel>
            <RadioGroup aria-label="exportas" name="exportas" value={exportAs} onChange={handleChangeExportAs}>
              <FormControlLabel value="json" control={<Radio />} label="JSON" />
              <FormControlLabel value="csv" control={<Radio />} label="CSV" />
            </RadioGroup>
          </FormControl>   
        </div>
      </Dialog>
    </div>
  )

}

export default Settings
