import React, { PureComponent } from 'react'
import {connect} from 'react-redux'
import DicomViewer from './components/dicomviewer'
import DicomHeader from './components/DicomHeader'
import Measurements from './components/Measurements'
import Settings from './components/Settings'
import AboutDlg from './components/AboutDlg'
import { log } from './functions'
import {dcmTool} from './actions/index'
import {dcmIsOpen} from './actions/index'
import {activeDcm} from './actions/index'
import {activeDcmIndex} from './actions/index'
import {activeMeasurements} from './actions/index'
import {setLayout} from './actions/index'
import Histogram from './components/Histogram'
import Icon from '@mdi/react'
import LayoutTool from './components/LayoutTool'
import { withStyles } from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import Collapse from '@material-ui/core/Collapse'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import Divider from '@material-ui/core/Divider'
import Drawer from '@material-ui/core/Drawer'
import ExpandLess from '@material-ui/icons/ExpandLess'
import ExpandMore from '@material-ui/icons/ExpandMore'
import IconButton from '@material-ui/core/IconButton'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import MenuIcon from '@material-ui/icons/Menu'
import PhotoCameraIcon from '@material-ui/icons/PhotoCamera'
import Popover from '@material-ui/core/Popover'
import TextField from '@material-ui/core/TextField'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import { isMobile, isTablet } from 'react-device-detect'

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
  mdiViewGridPlusOutline,
  mdiImageEdit,
  mdiInformationOutline,
  mdiInvertColors,
  mdiMagnify,
  mdiRefresh,
  mdiRectangle,
  mdiRuler,
  mdiSettings,
  mdiToolbox,
  mdiTrashCanOutline, 
  mdiVideo,
  mdiWeb,
} from '@mdi/js'

import './App.css'

log()

const drawerWidth = 240
const iconColor = '#FFFFFF'
let iconTool = null

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
    
    this.dicomViewersRefs = []
    this.dicomViewers = []
    for(let i=0; i < 16; i++) {
      this.dicomViewers.push(this.setDcmViewer(i))
    }
  }

  /*menuListSetting = [
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
  ]*/

  state = { 
    anchorElLayout: null,    
    openImageEdit: false,
    visibleMainMenu: true,
    visibleHeader: false,
    visibleSettings: false,
    visibleToolbar: true,
    visibleOpenUrl: false,
    visibleToolbox: false,
    visibleMeasure: false,
    visibleClearMeasureDlg: false,
    visibleAbout: false,
    toolState: 1,
  }

  setDcmViewer = (index) => {
    return (
      <DicomViewer 
        dcmRef={(ref) => {this.dicomViewersRefs[index] = ref}}
        index={index}
        runTool={ref => (this.runTool = ref)} 
        changeTool={ref => (this.changeTool = ref)} 
      />   
    )
  }

  getDcmViewerRef = (index) => {
    return this.dicomViewersRefs[index]
  }

  getDcmViewer = (index) => {
    return this.dicomViewers[index]
  }

  getActiveDcmViewer = () => {
    return this.dicomViewersRefs[this.props.activeDcmIndex]
  }  

  showFileOpen() {
    this.props.isOpenStore(false)
    this.fileOpen.current.click()
  }

  handleOpenFile = (filesSelected) => {
    this.hideMainMenu()
    const file = filesSelected[0]
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool('clear')
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool('openfile', file)
  }

  componentDidMount() {
    // Need to set the renderNode since the drawer uses an overlay
    //this.dialog = document.getElementById('drawer-routing-example-dialog')
    window.scrollTo(0, 0)
  }


  showAppBar = () => {
    window.scrollTo(0, 0)
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
    const visible = !this.state.visibleHeader
    this.setState({ visibleHeader: visible })
    if (visible) 
      this.setState({ visibleMeasure: false, visibleToolbox: false })    
  }


  toggleToolbox = () => {
    const visible = !this.state.visibleToolbox
    this.setState({ visibleToolbox: visible })
    if (visible) 
      this.setState({ visibleMeasure: false, visibleHeader: false })
  }

  saveMeasure = () => {
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool('savetools')
  }
  
  toggleMeasure = () => {
    const visible = !this.state.visibleMeasure
    this.setState({ visibleMeasure: visible })
    if (visible) 
      this.setState({ visibleToolbox: false, visibleHeader: false })
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
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool('removetools')
  }


  showAbout = () => {
    this.setState({ visibleAbout: !this.state.visibleAbout })
  }

  
  showSettings = () => {
    this.setState({ visibleMainMenu: false, visibleSettings: true, visibleToolbar: false, position: 'right' });
  }

  hideSettings = () => {
    this.setState({ visibleMainMenu: true, visibleSettings: false, visibleToolbar: true })
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
          return(this.dicomViewersRefs[this.props.activeDcmIndex].runTool('openurl', this.openUrlField.value))
        } 
    })
  }

  downloadOpenUrl = () => {
    this.setState({ visibleOpenUrl: false, visibleToolbar: true })
  }
  
  resetImage = () => {
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool('reset')
  }
  
  saveShot = () => {
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool('saveas')
  }

  cinePlayer = () => {
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool('cine')
  }

  clear = () => {  
    this.setState({openImageEdit: false, visibleToolbox: false, visibleMeasure: false, visibleHeader: false})
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool('clear')
  }

  handleLayout = (event) => {
    this.setState({anchorElLayout: event.currentTarget})
  }
  
  closeLayout = () => {
    this.setState({anchorElLayout: null})
  }

  changeLayout = (row, col) => {
    //console.log('this.dicomViewersRefs: ', this.dicomViewersRefs)
    // if reduce the grid clear the unused views
    if (row < this.props.layout[0] || col < this.props.layout[1]) {
      this.layoutGridClick(0)
      for(let i=0; i < 4; i++) {
        for(let j=0; j < 4; j++) {
          if ((i+1 > row) || (j+1 > col)) {
            const index = i*4+j
            if (this.dicomViewersRefs[index] !== undefined) {  
              //console.log(`clear view [${i},${j}], index: ${index}`)
              this.dicomViewersRefs[index].runTool('clear')
             }
          }
        }
      }
    }
    //console.log('this.dicomViewersRefs: ', this.dicomViewersRefs)  
    this.props.setLayoutStore(row, col)
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
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool(tool)
  }

  toolChange = () => {
    const toolState = 1-this.state.toolState
    this.setState({toolState: toolState}, () => {
      this.changeTool.changeTool(this.props.tool, toolState)
    })
  }

  toolRemove = (index) => {
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool('removetool', index)
  }

  toggleImageEdit = () => {
    this.setState({openImageEdit: !this.state.openImageEdit})
  }
 
  layoutGridClick = (index) => {
    if (isMobile && index === this.props.activeDcmIndex) return
    //console.log('layoutGridClick: ', index)    
    this.props.setActiveDcmIndex(index)
    const dcmViewer = this.getDcmViewerRef(index)
    this.props.setActiveMeasurements(dcmViewer.measurements)
    this.props.setActiveDcm({image: dcmViewer.image, element: dcmViewer.dicomImage, isDicom: dcmViewer.isDicom})
  }
 
  layoutGridTouch = (index) => {
    if (!isMobile && index === this.props.activeDcmIndex) return
    //console.log('layoutGridTouch: ', index)
    this.props.setActiveDcmIndex(index)
    const dcmViewer = this.getDcmViewerRef(index)
    this.props.setActiveMeasurements(dcmViewer.measurements)
    this.props.setActiveDcm({image: dcmViewer.image, element: dcmViewer.dicomImage, isDicom: dcmViewer.isDicom})   
  }

  buildLayoutGrid = () => {
    let dicomviewers = []
    for(let i=0; i < this.props.layout[0]; i++) {
      for(let j=0; j < this.props.layout[1]; j++) {
        const styleLayoutGrid = {
          border: this.props.layout[0] === 1 && this.props.layout[1] === 1 ? 'solid 1px #000000' : 'solid 1px #444444',
        }
        const index = i*4+j
        dicomviewers.push(
          <div 
            key={index} 
            style={styleLayoutGrid} 
            onClick={() => this.layoutGridClick(index)} 
            onTouchStart={() => this.layoutGridTouch(index)}
          >
            {this.getDcmViewer(index)}
          </div>        
        )
      }
    }

    return (
      <div
        id="dicomviewer-grid"
        style={{
          display: 'grid',
          gridTemplateRows: `repeat(${this.props.layout[0]}, ${100 / this.props.layout[0]}%)`,
          gridTemplateColumns: `repeat(${this.props.layout[1]}, ${100 / this.props.layout[1]}%)`,
          height: '100%',
          width: '100%',
        }}
      >
        {dicomviewers}
      </div>
    )
  }

  getFileName = (dcmViewer) => {
    if (dcmViewer.localfile !== null) {
      return dcmViewer.localfile.name
    } else {
      return dcmViewer.localurl.substring(dcmViewer.localurl.lastIndexOf('/')+1)
    }
  }

  appBarTitle = (classes, isOpen, dcmViewer) => {
    if (isMobile && !isTablet) {
      if (isOpen) 
        return null
      else 
        return (
          <Typography variant="overline" className={classes.title}>
            <strong>U</strong>niversal <strong>D</strong>icom <strong>V</strong>iewer
          </Typography>          
        )
    } else {
      if (isOpen) 
        return (
          <Typography variant="overline" className={classes.title}>
            {this.getFileName(dcmViewer)}
          </Typography>
        )
      else
        return (
          <Typography variant="overline" className={classes.title}>
            <strong>U</strong>niversal <strong>D</strong>icom <strong>V</strong>iewer
          </Typography>
        )
    }
  }

  render() {
    //console.log('App render: ')

    const { classes } = this.props

    const isOpen = this.props.isOpen[this.props.activeDcmIndex]

    const openImageEdit = this.state.openImageEdit
    const visibleMainMenu = this.state.visibleMainMenu
    const visibleHeader = this.state.visibleHeader
    const visibleSettings = this.state.visibleSettings
    const visibleAbout = this.state.visibleAbout
    const visibleMeasure = this.state.visibleMeasure
    const visibleToolbox = this.state.visibleToolbox
    const visibleLayout = Boolean(this.state.anchorElLayout)

    let iconToolColor = this.state.toolState === 1 ? '#FFFFFF' : '#999999'

    const dcmViewer = this.getActiveDcmViewer()

    //console.log('this.dicomViewersRefs: ', this.dicomViewersRefs)

    return (
      <div>
        <AppBar className={classes.appBar} position='static' elevation={0}>
          <Toolbar variant="dense">
            <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu" onClick={this.toggleMainMenu}>
              <MenuIcon />
            </IconButton>
            { this.appBarTitle(classes, isOpen, dcmViewer) }
            
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
            { isOpen && dcmViewer.numberOfFrames > 1 &&  isOpen ? (
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
            { isOpen ? (
              <IconButton color="inherit" onClick={this.toggleToolbox}>
                <Icon path={mdiToolbox} size={'1.5rem'} color={iconColor} />
              </IconButton>
              ) : null
            }              
            { isOpen ? (
              <IconButton color="inherit" onClick={this.toggleMeasure}>
                <Icon path={mdiFileCad} size={'1.5rem'} color={iconColor} />
              </IconButton>
              ) : null
            }  
            { isOpen && dcmViewer.isDicom ? (
              <IconButton color="inherit" onClick={this.toggleHeader}>
                <Icon path={mdiFileDocument} size={'1.5rem'} color={iconColor} />
              </IconButton>
              ) : null
            }  
          </Toolbar>
        </AppBar>

        <Drawer 
          variant="persistent"
          open={visibleMainMenu} 
          style={{position:'relative', zIndex: 1}}
          onClose={this.toggleMainMenu}
        >
          <div className={classes.toolbar}>
            <List dense={true}>
              <ListItem button onClick={() => this.showAppBar()}>
                <ListItemIcon><MenuIcon /></ListItemIcon>
                <ListItemText primary='Tool Bar' />
              </ListItem>              
              <ListItem button onClick={() => this.showFileOpen()}>
                <ListItemIcon><Icon path={mdiFolder} size={'1.5rem'} color={iconColor} /></ListItemIcon>
                <ListItemText primary='Open File ...' />
              </ListItem>
              <ListItem button onClick={() => this.showOpenUrl()}>
                <ListItemIcon><Icon path={mdiWeb} size={'1.5rem'} color={iconColor} /></ListItemIcon>
                <ListItemText primary='Open URL ...' />
              </ListItem>
              <ListItem button onClick={() => this.clear()}>
                <ListItemIcon><Icon path={mdiDelete} size={'1.5rem'} color={iconColor} /></ListItemIcon>
                <ListItemText primary='Clear' />
              </ListItem>  
              <ListItem button onClick={this.handleLayout}>
                <ListItemIcon><Icon path={mdiViewGridPlusOutline} size={'1.5rem'} color={iconColor} /></ListItemIcon>
                <ListItemText primary='Layout' />              
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
              <ListItem button onClick={() => this.toggleImageEdit()} disabled={!isOpen}>
                <ListItemIcon><Icon path={mdiImageEdit} size={'1.5rem'} color={iconColor} /></ListItemIcon>
                <ListItemText primary='Edit' />
                {openImageEdit ? <ExpandLess /> : <ExpandMore />}
              </ListItem>          
              <Collapse in={openImageEdit} timeout="auto" unmountOnExit>
                <List  dense={true} component="div">
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('Invert')}>
                    <ListItemIcon><Icon path={mdiInvertColors} size={'1.5rem'} color={iconColor} /></ListItemIcon>
                    <ListItemText primary="Invert" />
                  </ListItem>
                </List>
              </Collapse>
            </List>
          </div>
        </Drawer>       

        <Drawer
          variant="persistent"
          anchor='right'
          open={visibleHeader}
          onClose={this.toggleHeader}
        >
          { visibleHeader ? <DicomHeader dcmViewer={dcmViewer} classes={classes} color={iconColor} /> : null } 
        </Drawer>

        <Drawer
          variant="persistent"
          anchor='right'
          open={visibleMeasure}
          onClose={this.toggleMeasure}
        >
          <div style={{marginTop: '48px'}}>
            <Toolbar variant="dense">
              <Typography variant="subtitle1" className={classes.title}>
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
            <div>  
              { isOpen ? <Measurements dcmViewer={dcmViewer} toolRemove={this.toolRemove} classes={classes} /> : null } 
            </div>
          </div>
        </Drawer>  

        <Drawer
          variant="persistent"
          anchor='right'
          open={visibleToolbox}
          onClose={this.toggleToolbox}
        >
          <div style={{marginTop: '48px'}}>
            <div>  
              { isOpen ? <Histogram key={this.getFileName(dcmViewer)} /> : null } 
            </div>
          </div>
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

        <Popover
          id={'id-layout'}
          open={visibleLayout}
          anchorEl={this.state.anchorElLayout}
          onClose={this.closeLayout}
          anchorOrigin={{
            vertical: 'center',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'center',
            horizontal: 'left',
          }}
        >
          <LayoutTool 
            row={this.props.layout[0]-1} 
            col={this.props.layout[1]-1}
            onChange={this.changeLayout}
          />  
        </Popover>        

        <div style={{height: 'calc(100vh - 48px)'}}>
          {this.buildLayoutGrid()}  
        </div>

        <div>
          <input
            type="file"
            id="my_file"
            style={{ display: "none" }}
            ref={this.fileOpen}
            onChange={e => this.handleOpenFile(e.target.files)}
          />
        </div>
    
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    isOpen: state.isOpen,
    tool: state.tool,
    activeDcmIndex: state.activeDcmIndex,
    measurements: state.measurements,
    layout: state.layout
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    toolStore: (tool) => dispatch(dcmTool(tool)),
    isOpenStore: (value) => dispatch(dcmIsOpen(value)),
    setActiveDcm: (dcm) => dispatch(activeDcm(dcm)),
    setActiveDcmIndex: (index) => dispatch(activeDcmIndex(index)),
    setActiveMeasurements: (measurements) => dispatch(activeMeasurements(measurements)),
    setLayoutStore: (row, col) => dispatch(setLayout(row, col)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(App))
