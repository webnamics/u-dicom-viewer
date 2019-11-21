import React, { PureComponent } from 'react'
import {connect} from 'react-redux'
import DicomViewer from './components/dicomviewer'
import HeaderItem from './components/HeaderItem'
import MeasureItem from './components/MeasureItem'
import Settings from './components/Settings'
import AboutDlg from './components/AboutDlg'
import { SETTINGS_DCMHEADER } from './constants/settings'
import { toCsv } from './functions'
import {deviceDetect} from 'react-device-detect'
import {dcmTool} from './actions/index'
import Icon from '@mdi/react'

//import { isBrowser, isMobile } from 'react-device-detect'

//import clsx from 'clsx'
//import { makeStyles } from '@material-ui/core/styles'
import { withStyles } from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import ClearIcon from '@material-ui/icons/Clear'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import Divider from '@material-ui/core/Divider'
import Drawer from '@material-ui/core/Drawer'
import IconButton from '@material-ui/core/IconButton'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import MenuIcon from '@material-ui/icons/Menu'
import PhotoCameraIcon from '@material-ui/icons/PhotoCamera'
import SaveIcon from '@material-ui/icons/Save'
import TextField from '@material-ui/core/TextField'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'

import { 
  mdiAngleAcute,
  mdiArrowAll,
  mdiChartHistogram,
  mdiCheckboxIntermediate,
  mdiContentSaveOutline,   
  mdiCursorDefault, 
  mdiCursorPointer,
  mdiDelete,
  mdiEllipse,
  mdiEyedropper,
  mdiFileDocument, 
  mdiFileCad, 
  mdiFolder,
  mdiGesture,
  mdiInformationOutline,
  mdiMagnify,
  mdiRefresh,
  mdiRectangle,
  mdiRuler,
  mdiSettings,
  mdiTrashCanOutline, 
  mdiVideo,
  mdiWeb,
} from '@mdi/js'

import './App.css'

const iconColor = '#FFFFFF'
let iconTool = null

const drawerWidth = 240

const styles = theme => ({
  '@global': {
    body: {
        backgroundColor: theme.palette.common.black,
    },
  },
  grow: {
    flexGrow: 1,
  },
  root: {
    //flexGrow: 1,
    display: 'flex',
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  appBar: {
    position: 'relative',
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },

  hide: {
    display: 'none',
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  drawerOpen: {
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerClose: {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: theme.spacing(7) + 1,
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing(9) + 1,
    },
  },

  // Loads information about the app bar, including app bar height
  toolbar: theme.mixins.toolbar,

  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },

})


class App extends PureComponent {

  constructor(props) {
    super(props)
    this.file = null
    this.fileOpen = React.createRef()
    this.showFileOpen = this.showFileOpen.bind(this)
    this.openUrlField = React.createRef()

  }

  menuListSetting = [
    {
      key: 'overlay',
      primaryText: 'Overlay information',
      onClick: () => {
        console.log('menu setting overlay ')
      },
    }, {
      key: 'saveas',
      primaryText: 'Save screenshot as ...',
      onClick: () => {
        console.log('menu setting saveas ')
      },
    },
  ]

  state = { 
    visibleDcm: true,
    visibleMainMenu: true,
    visibleHeader: false,
    visibleSettings: false,
    visibleToolbar: true,
    visibleOpenUrl: false,
    visibleMeasure: false,
    visibleClearMeasureDlg: false,
    visibleAbout: false,
    toolState: 1,
  }

  showFileOpen() {
    this.fileOpen.current.click()
  }

  handleChange = (filesSelected) => {
    console.log('load file: ', filesSelected)
    this.hideMainMenu()
    const file = filesSelected[0]
    this.runTool.runTool('openfile', file)
  }

  componentDidMount() {
    // Need to set the renderNode since the drawer uses an overlay
    this.dialog = document.getElementById('drawer-routing-example-dialog')
    console.log('deviceDetect: ', deviceDetect())
  }


  toggleMainMenu = () => {
    this.setState({ visibleMainMenu: !this.state.visibleMainMenu })
  }
  
  showMainMenu = () => {
    this.setState({ visibleMainMenu: true })
  }

  hideMainMenu = () => {
    this.setState({ visibleMainMenu: false })
  }

  handleVisibility = (visibleMainMenu) => {
    this.setState({ visibleMainMenu })
  }


  toggleHeader = () => {
    this.setState({ visibleHeader: !this.state.visibleHeader })
  }

  saveHeader = () => {
    let exportAs = localStorage.getItem(SETTINGS_DCMHEADER)
    if (exportAs === null) {
      exportAs = "json"
      localStorage.setItem(SETTINGS_DCMHEADER, exportAs)
    }  

    let fileData = ''
    
    if (exportAs === 'csv') {
      fileData = toCsv(this.props.header)
    } else {
      const obj = this.props.header.reduce((o, item) => ({ ...o, [item.name]: item.value}), {})
      fileData = JSON.stringify(obj)
    }
    
    const element = document.createElement("a")
    const file = new Blob([fileData], {type: 'text/plain'})
    element.href = URL.createObjectURL(file)
    element.download = `${this.props.localfile.name}.${exportAs}`
    document.body.appendChild(element) // Required for this to work in FireFox
    element.click()
  }


  saveMeasure = () => {
    this.runTool.runTool('savetools')
  }
  
  toggleMeasure = () => {
    this.setState({ visibleMeasure: !this.state.visibleMeasure })
  }

  hideMeasure = () => {
    this.setState({ visibleMeasure: false })
  }

  handleVisibilityMeasure = (visibleMeasure) => {
    this.setState({ visibleMeasure })
  }

  clearMeasure = () => {
    this.showClearMeasureDlg()
  }

  showClearMeasureDlg = () => {
    this.setState({ visibleClearMeasureDlg: true })
  }

  hideClearMeasureDlg = () => {
      this.setState({ visibleClearMeasureDlg: false })
  }

  confirmClearMeasureDlg = () => {
    this.hideClearMeasureDlg()
    this.runTool.runTool('removetools')
  }


  showAbout = () => {
    this.setState({ visibleAbout: !this.state.visibleAbout })
  }

  
  showSettings = () => {
    this.setState({ visibleDcm: false, visibleMainMenu: false, visibleSettings: true, visibleToolbar: false, position: 'right' });
  }

  hideSettings = () => {
    this.setState({ visibleDcm: true, visibleMainMenu: true, visibleSettings: false, visibleToolbar: true })
  }

  handleVisibilitySettings = (visibleSettings) => {
    this.setState({ visibleSettings });
  }


  showOpenUrl = () => {
    this.setState({ visibleOpenUrl: true })
  }

  hideOpenUrl = (openDlg) => {
    this.setState({ visibleOpenUrl: false },
      () => {
        if (openDlg) {
          this.hideMainMenu()
          return(this.runTool.runTool('openurl', this.openUrlField.value))
        } 
    })
  }

  downloadOpenUrl = () => {
    this.setState({ visibleDcm: true, visibleOpenUrl: false, visibleToolbar: true })
  }
  
  resetImage = () => {
    console.log('resetImage: ')
    this.runTool.runTool('reset')
  }
  
  saveShot = () => {
    console.log('saveShot: ')
    this.runTool.runTool('saveas')
  }

  cinePlayer = () => {
    console.log('cinePlayer: ')
    this.runTool.runTool('cine')
  }

  toolExecute = (tool) => {
    this.hideMainMenu()
    switch (tool) {
      case 'notool': 
        iconTool = null
        this.setState({toolState: null})
        break
      case 'Wwwc':
        iconTool = mdiArrowAll
        break
      case 'Pan':
        iconTool = mdiCursorPointer
        break        
      case 'Zoom':
        iconTool = mdiMagnify
        break        
      case 'Length':
        iconTool = mdiRuler
        break       
      case 'Probe':
        iconTool = mdiEyedropper
        break    
      case 'Angle':
        iconTool = mdiAngleAcute
        break   
      case 'EllipticalRoi':
        iconTool = mdiEllipse
        break     
      case 'RectangleRoi':
        iconTool = mdiRectangle
        break
      case 'FreehandRoi':
        iconTool = mdiGesture
        break       

      default:
          break     
    }
    this.props.toolStore(tool)
    this.runTool.runTool(tool)
  }

  toolChange = () => {
    console.log('toolChange: ')
    const toolState = 1-this.state.toolState
    this.setState({toolState: toolState}, () => {
      this.changeTool.changeTool(this.props.tool, toolState)
    })
  }

  toolRemove = (index) => {
    this.runTool.runTool('removetool', index)
  }

  render() {
    const { classes } = this.props

    const isOpen = this.props.isOpen

    const visibleDcm = this.state.visibleDcm
    const visibleMainMenu = this.state.visibleMainMenu
    const visibleHeader = this.state.visibleHeader
    const visibleSettings = this.state.visibleSettings
    const visibleAbout = this.state.visibleAbout
    //const visibleToolbar = this.state.visibleToolbar
    //const visibleOpenUrl = this.state.visibleOpenUrl
    const visibleMeasure = this.state.visibleMeasure
    
    let iconToolColor = this.state.toolState === 1 ? '#FFFFFF' : '#999999'

    return (
      <div>
        <div>
          <input
            type="file"
            id="my_file"
            style={{ display: "none" }}
            ref={this.fileOpen}
            onChange={e => this.handleChange(e.target.files)}
          />
        </div>

        <AppBar className={classes.appBar}>
          <Toolbar variant="dense">
            <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu" onClick={this.toggleMainMenu}>
              <MenuIcon />
            </IconButton>
            { !isOpen ? (
              <Typography variant="overline" className={classes.title}>
                <strong>U</strong>niversal <strong>D</strong>icom <strong>V</strong>iewer
              </Typography>
             ) : null
            }
            <div className={classes.grow} />
            { !isOpen ? (
              <IconButton onClick={this.showAbout}>
                <Icon path={mdiInformationOutline} size={'1.5rem'} color={iconColor} />
              </IconButton> 
             ) : null
            }            
            { iconTool !== null && this.props.tool !== null &&  isOpen ? (
                <IconButton onClick={this.toolChange}>
                  <Icon path={iconTool} size={'1.5rem'} color={iconToolColor} />
                </IconButton>
              ) : null
            }
            { this.props.numberOfFrames > 1 &&  isOpen ? (
                <IconButton onClick={this.cinePlayer}>
                  <Icon path={mdiVideo} size={'1.5rem'} color={iconColor} />
                </IconButton> 
              ): null
            }
            { isOpen ? (
              <IconButton onClick={this.resetImage}>
                <Icon path={mdiRefresh} size={'1.5rem'} color={iconColor} />
              </IconButton>
             ) : null
            }
            { isOpen ? (
              <IconButton color="inherit" onClick={this.saveShot}>
                <PhotoCameraIcon />
              </IconButton>
             ) : null
            }
            { isOpen > 0 ? (
              <IconButton color="inherit" onClick={this.toggleMeasure}>
                <Icon path={mdiFileCad} size={'1.5rem'} color={iconColor} />
              </IconButton>
              ) : null
            }  
            { this.props.header.length > 0 ? (
              <IconButton color="inherit" onClick={this.toggleHeader}>
                <Icon path={mdiFileDocument} size={'1.5rem'} color={iconColor} />
              </IconButton>
              ) : null
            }  
          </Toolbar>
        </AppBar>

        <Drawer 
          open={visibleMainMenu} 
          style={{position:'relative', zIndex: 1}}
          onClose={this.toggleMainMenu}
        >
          <div className={classes.toolbar}>
            <List dense={true}>
              <ListItem button onClick={() => this.showSettings()}>
                <ListItemIcon><Icon path={mdiSettings} size={'1.5rem'} color={iconColor} /></ListItemIcon>
                <ListItemText primary='Settings' />
              </ListItem>              
              <ListItem button onClick={() => this.showFileOpen()}>
                <ListItemIcon><Icon path={mdiFolder} size={'1.5rem'} color={iconColor} /></ListItemIcon>
                <ListItemText primary='Open File ...' />
              </ListItem>
              <ListItem button onClick={() => this.showOpenUrl()}>
                <ListItemIcon><Icon path={mdiWeb} size={'1.5rem'} color={iconColor} /></ListItemIcon>
                <ListItemText primary='Open URL ...' />
              </ListItem>
              <ListItem button onClick={() => this.runTool.runTool('clear')}>
                <ListItemIcon><Icon path={mdiDelete} size={'1.5rem'} color={iconColor} /></ListItemIcon>
                <ListItemText primary='Clear' />
              </ListItem>  
              <ListItem button onClick={() => this.showSettings()}>
                <ListItemIcon><Icon path={mdiSettings} size={'1.5rem'} color={iconColor} /></ListItemIcon>
                <ListItemText primary='Settings' />
              </ListItem>                
              <Divider />
              <ListItem button onClick={() => this.toolExecute('notool')} disabled={!isOpen}>
                <ListItemIcon><Icon path={mdiCursorDefault} size={'1.5rem'} color={iconColor} /></ListItemIcon>
                <ListItemText primary='No tool' />
              </ListItem>         
              <ListItem button onClick={() => this.toolExecute('Wwwc')} disabled={!isOpen}>
                <ListItemIcon><Icon path={mdiArrowAll} size={'1.5rem'} color={iconColor} /></ListItemIcon>
                <ListItemText primary='WW/WC' />
              </ListItem>  
              <ListItem button onClick={() => this.toolExecute('Pan')} disabled={!isOpen}>
                <ListItemIcon><Icon path={mdiCursorPointer} size={'1.5rem'} color={iconColor} /></ListItemIcon>
                <ListItemText primary='Pan' />
              </ListItem>  
              <ListItem button onClick={() => this.toolExecute('Zoom')} disabled={!isOpen}>
                <ListItemIcon><Icon path={mdiMagnify} size={'1.5rem'} color={iconColor} /></ListItemIcon>
                <ListItemText primary='Zoom' />
              </ListItem>      
              <ListItem button onClick={() => this.toolExecute('Magnify')} disabled={!isOpen}>
                <ListItemIcon><Icon path={mdiCheckboxIntermediate} size={'1.5rem'} color={iconColor} /></ListItemIcon>
                <ListItemText primary='Magnify' />
              </ListItem>       
              <ListItem button onClick={() => this.toolExecute('Length')} disabled={!isOpen}>
                <ListItemIcon><Icon path={mdiRuler} size={'1.5rem'} color={iconColor} /></ListItemIcon>
                <ListItemText primary='Length' />
              </ListItem>        
              <ListItem button onClick={() => this.toolExecute('Probe')} disabled={!isOpen}>
                <ListItemIcon><Icon path={mdiEyedropper} size={'1.5rem'} color={iconColor} /></ListItemIcon>
                <ListItemText primary='Probe' />
              </ListItem> 
              <ListItem button onClick={() => this.toolExecute('Angle')} disabled={!isOpen}>
                <ListItemIcon><Icon path={mdiAngleAcute} size={'1.5rem'} color={iconColor} /></ListItemIcon>
                <ListItemText primary='Angle' />
              </ListItem>  
              <ListItem button onClick={() => this.toolExecute('EllipticalRoi')} disabled={!isOpen}>
                <ListItemIcon><Icon path={mdiEllipse} size={'1.5rem'} color={iconColor} /></ListItemIcon>
                <ListItemText primary='Elliptical Roi' />
              </ListItem>     
              <ListItem button onClick={() => this.toolExecute('RectangleRoi')} disabled={!isOpen}>
                <ListItemIcon><Icon path={mdiRectangle} size={'1.5rem'} color={iconColor} /></ListItemIcon>
                <ListItemText primary='Rectangle Roi' />
              </ListItem> 
              <ListItem button onClick={() => this.toolExecute('FreehandRoi')} disabled={!isOpen}>
                <ListItemIcon><Icon path={mdiGesture} size={'1.5rem'} color={iconColor} /></ListItemIcon>
                <ListItemText primary='Freehand Roi' />
              </ListItem> 
              <ListItem button onClick={() => this.toolExecute('Histogram')} disabled={!isOpen}>
                <ListItemIcon><Icon path={mdiChartHistogram} size={'1.5rem'} color={iconColor} /></ListItemIcon>
                <ListItemText primary='Histogram' />
              </ListItem>                                                                                                                                                      
            </List>
          </div>
        </Drawer>       

        <Drawer
          anchor='right'
          open={visibleHeader}
          onClose={this.toggleHeader}
        >
          <Toolbar variant="dense">
            <IconButton color="inherit" onClick={this.toggleHeader}>
              <ClearIcon />
            </IconButton>
            <Typography variant="h6" className={classes.title}>
              Dicom Header
            </Typography>
              <div className={classes.grow} />
            <IconButton color="inherit" onClick={this.saveHeader}>
              <SaveIcon />
            </IconButton>
          </Toolbar>
          {this.props.header.map((item, index) => <HeaderItem name={item.name} value={item.value} key={index} />)} 
        </Drawer>  

        <Drawer
          anchor='right'
          open={visibleMeasure}
          onClose={this.toggleMeasure}
        >
          <Toolbar variant="dense">
            <IconButton color="inherit" onClick={this.toggleMeasure}>
              <ClearIcon />
            </IconButton>
            <Typography variant="h6" className={classes.title}>
              Measurements&nbsp;&nbsp;
            </Typography>
              <div className={classes.grow} />
            <IconButton color="inherit" onClick={this.saveMeasure} edge="end">
              <Icon path={mdiContentSaveOutline} size={'1.5rem'} color={iconColor} />
            </IconButton>
            <IconButton color="inherit" onClick={this.clearMeasure} edge="end">
              <Icon path={mdiTrashCanOutline} size={'1.5rem'} color={iconColor} />
            </IconButton>
          </Toolbar>
          {this.props.measure.map((item, index) => <MeasureItem item={item} index={index} toolRemove={this.toolRemove} key={index} classes={classes} />)} 
        </Drawer>  

        {visibleSettings ? <Settings onClose={this.hideSettings}/>: null}

        {visibleAbout ? <AboutDlg onClose={this.showAbout}/>: null}

        <Dialog
            open={this.state.visibleClearMeasureDlg}
            onClose={this.hideClearMeasureDlg}
            aria-labelledby="alert-dialog-title"
        >
            <DialogTitle id="alert-dialog-title">{"Are you sure to remove all the measurements?"}</DialogTitle>
            <DialogActions>
                <Button onClick={this.hideClearMeasureDlg}>
                    Cancel
                </Button>
                <Button onClick={this.confirmClearMeasureDlg} autoFocus>
                    Ok
                </Button>
            </DialogActions>
        </Dialog>

        <Dialog
            open={this.state.visibleOpenUrl}
            aria-labelledby="form-dialog-title"
        >
            <DialogTitle id="form-dialog-title">{"Open URL"}</DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  Insert an URL to download a DICOM or image file:
                </DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    id="id-open-url"
                    inputRef={input => (this.openUrlField = input)}
                    fullWidth
                />
              </DialogContent>
            <DialogActions>
                <Button onClick={() => this.hideOpenUrl(false)} >
                    Cancel
                </Button>
                <Button onClick={() => this.hideOpenUrl(true)} autoFocus>
                    Ok
                </Button>
            </DialogActions>
        </Dialog>

        <DicomViewer 
          runTool={ref => (this.runTool = ref)} 
          changeTool={ref => (this.changeTool = ref)} 
          visible={visibleDcm} 
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    localfile: state.localfile,
    isOpen: state.isOpen,
    numberOfFrames: state.numberOfFrames,
    tool: state.tool,
    header: state.header,
    measure: state.measure
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    toolStore: (tool) => dispatch(dcmTool(tool)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(App))
