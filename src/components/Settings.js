import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import Checkbox from '@material-ui/core/Checkbox'
import CloseIcon from '@material-ui/icons/Close'
import Dialog from '@material-ui/core/Dialog'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import FormControl from '@material-ui/core/FormControl'
import FormLabel from '@material-ui/core/FormLabel'
import IconButton from '@material-ui/core/IconButton'
import Radio from '@material-ui/core/Radio'
import RadioGroup from '@material-ui/core/RadioGroup'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import { 
  getSettingsSaveAs, 
  setSettingsSaveAs, 
  getSettingsSaveInto,
  setSettingsSaveInto,
  getSettingsDcmHeader, 
  setSettingsDcmHeader, 
  getSettingsOverlay, 
  setSettingsOverlay,
  getSettingsFsView,
  setSettingsFsView,
  getSettingsDicomdirView,
  setSettingsDicomdirView,
  getSettingsMprInterpolation,
  setSettingsMprInterpolation,
} from '../functions'

const useStyles = makeStyles(theme => ({
  appBar: {
    position: 'relative',
  },
  formControl: {
    margin: theme.spacing(3),
  },
  formLabel: {
    fontSize: '0.85em',
  },
  radioControl: {
    size: 'small',
  },  
  title: {
    marginLeft: theme.spacing(2),
    flex: 1,
    fontSize: '0.95em',
  },
}))

/*const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="right" ref={ref} {...props} />;
})*/

const Settings = ({ onClose }) => {
  
  let saveAs = getSettingsSaveAs()
  let saveInto = getSettingsSaveInto()
  let exportAs = getSettingsDcmHeader()
  let overlay = getSettingsOverlay()
  let fsView = getSettingsFsView()
  let dicomdirView = getSettingsDicomdirView()
  let mprInterpolation = getSettingsMprInterpolation()

  //const isIndexedDB = false // 'indexedDB' in window
  
  const handleChangeSaveAs = event => {
    setState({ ...state, 'saveAs': event.target.value })
    setSettingsSaveAs(event.target.value)
  }
  
  const handleChangeSaveInto = event => {
    setState({ ...state, 'saveInto': event.target.value })
    setSettingsSaveInto(event.target.value)
  }

  const handleChangeExportAs = event => {
    setState({ ...state, 'exportAs': event.target.value })
    setSettingsDcmHeader(event.target.value)
  }

  const handleChangeOverlay = event => {
    setState({ ...state, 'overlay': event.target.checked })
    setSettingsOverlay(event.target.checked)
  }

  const handleChangeFsView = event => {
    setState({ ...state, 'fsView': event.target.value })
    setSettingsFsView(event.target.value)
  }

  const handleChangeDicomdirView = event => {
    setState({ ...state, 'dicomdirView': event.target.value })
    setSettingsDicomdirView(event.target.value)
  }  

  const handleChangeMprInterpolation = event => {
    setState({ ...state, 'mprInterpolation': event.target.value })
    setSettingsMprInterpolation(event.target.value)
  }  
  const classes = useStyles()

  const [state, setState] = React.useState({
    saveAs: saveAs,
    saveInto: saveInto,
    exportAs: exportAs,
    overlay: overlay,
    fsView: fsView,
    dicomdirView: dicomdirView,
    mprInterpolation: mprInterpolation,
  })

  return (
    <div>
      <Dialog fullScreen open={true} onClose={onClose}> {/* TransitionComponent={Transition} */}
        <AppBar className={classes.appBar} elevation={0}>
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
          <div>
          <FormControl component="fieldset" className={classes.formControl}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={state.overlay} 
                  onChange={handleChangeOverlay}
                  value="overlay" 
                  size='small'
                />
              }
              label="Show overlay Information"
            />
          </FormControl>
          </div>
          <div>
          <FormControl component="fieldset" className={classes.formControl}>
            <FormLabel component="legend" className={classes.formLabel}>Open sandbox file system from:</FormLabel>
            <RadioGroup size='small' aria-label="filesystem" name="filesystem" value={state.fsView} onChange={handleChangeFsView}>
              <FormControlLabel value="left" control={<Radio size='small' />} label="left" />
              <FormControlLabel value="right" control={<Radio size='small' />} label="right" />
              <FormControlLabel value="bottom" control={<Radio size='small' />} label="bottom" />
            </RadioGroup>
          </FormControl>    
          </div>
          <div>
          <FormControl component="fieldset" className={classes.formControl}>
            <FormLabel component="legend" className={classes.formLabel}>Open DICOMDIR panel from:</FormLabel>
            <RadioGroup size='small' aria-label="dicomdir" name="dicomdir" value={state.dicomdirView} onChange={handleChangeDicomdirView}>
              <FormControlLabel value="left" control={<Radio size='small' />} label="left" />
              <FormControlLabel value="right" control={<Radio size='small' />} label="right" />
              <FormControlLabel value="bottom" control={<Radio size='small' />} label="bottom" />
            </RadioGroup>
          </FormControl>                    
          </div>
          <div>
          <FormControl component="fieldset" className={classes.formControl}>
            <FormLabel component="legend" className={classes.formLabel}>Save screenshot as:</FormLabel>
            <RadioGroup aria-label="saveas" name="saveas" value={state.saveAs} onChange={handleChangeSaveAs}>
              <FormControlLabel value="jpeg" control={<Radio size='small' />} label="JPEG" />
              <FormControlLabel value="png" control={<Radio size='small' />} label="PNG" />
            </RadioGroup>
          </FormControl>
          </div>
          <div>
          <FormControl component="fieldset" className={classes.formControl}>
            <FormLabel component="legend" className={classes.formLabel}>Save screenshot into:</FormLabel>
            <RadioGroup aria-label="saveinto" name="saveinto" value={state.saveInto} onChange={handleChangeSaveInto}>
              <FormControlLabel value="local" control={<Radio size='small' />} label="local file system" />
              <FormControlLabel value="sandbox" control={<Radio size='small' />} label="sandbox file system" />
            </RadioGroup>
          </FormControl>          
          </div>
          <div>
          <FormControl component="fieldset" className={classes.formControl}>
            <FormLabel component="legend" className={classes.formLabel}>Export Dicom header as:</FormLabel>
            <RadioGroup aria-label="exportas" name="exportas" value={exportAs} onChange={handleChangeExportAs}>
              <FormControlLabel value="json" control={<Radio size='small' />} label="JSON" />
              <FormControlLabel value="csv" control={<Radio size='small' />} label="CSV" />
            </RadioGroup>
          </FormControl> 
          </div> 
          <div>
          <FormControl component="fieldset" className={classes.formControl}>
            <FormLabel component="legend" className={classes.formLabel}>MPR interpolation method:</FormLabel>
            <RadioGroup aria-label="mprinterpolation" name="mprinterpolation" value={mprInterpolation} onChange={handleChangeMprInterpolation}>
              <FormControlLabel value="no" control={<Radio size='small' />} label="No interpolation (duplicate planes)" />
              <FormControlLabel value="weightedlinear" control={<Radio size='small' />} label="Weighted linear interpolation" />
            </RadioGroup>
          </FormControl> 
          </div>            
        </div>
      </Dialog>
    </div>
  )

}

export default Settings
