import React, { PureComponent } from 'react'
import { withStyles } from '@material-ui/core/styles'
import {connect} from 'react-redux'
import AboutDlg from './components/AboutDlg'
import Dicomdir from './components/Dicomdir'
import DicomViewer from './components/DicomViewer'
import DicomHeader from './components/DicomHeader'
import DownloadZipDlg from './components/DownloadZipDlg'
import Explorer from './components/Explorer'
import FsUI from './components/FsUI'
import Histogram from './components/Histogram'
import LayoutTool from './components/LayoutTool'
import ToolsPanel from './components/ToolsPanel'
import Measurements from './components/Measurements'
import OpenMultipleFilesDlg from './components/OpenMultipleFilesDlg'
import Settings from './components/Settings'
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
import Icon from '@mdi/react'
import IconButton from '@material-ui/core/IconButton'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import MenuIcon from '@material-ui/icons/Menu'
import Popover from '@material-ui/core/Popover'
import Slider from '@material-ui/core/Slider'
import Snackbar from '@material-ui/core/Snackbar'
import TextField from '@material-ui/core/TextField'
import Toolbar from '@material-ui/core/Toolbar'
import Tooltip from '@material-ui/core/Tooltip'
import Typography from '@material-ui/core/Typography'
import 'react-perfect-scrollbar/dist/css/styles.css'
import PerfectScrollbar from 'react-perfect-scrollbar'

import { 
  isMobile, 
  isTablet,
} from 'react-device-detect'

import {
  clearStore,
  localFileStore,
  dcmIsOpen,
  activeDcm,
  activeDcmIndex,
  activeMeasurements,
  setLayout,
  dcmTool, 
  setDicomdir,
  setZippedFile,
  setVolume,
  filesStore,
  explorerActiveSeriesIndex,
} from './actions/index'

import { 
  log,
  getDicomPixelSpacing,
  getDicomSpacingBetweenSlice,
  getDicomSliceThickness,
  getDicomSliceLocation,
  getDicomStudyId,
  getDicomIpp,
  getDicomEchoNumber,
  getFileExtReal,
  isInputDirSupported,
  getSettingsFsView,
  getSettingsDicomdirView,
  getSettingsMprInterpolation,
  getDicomImageXOnRows,
  groupBy,
  objectIsEmpty,
} from './functions'

import { 
  mdiAngleAcute,
  mdiAnimationOutline,
  mdiArrowAll,
  mdiArrowSplitHorizontal,
  mdiAxisArrow,
  mdiCamera,
  mdiChartHistogram,
  mdiCheck,
  mdiCheckboxIntermediate,
  mdiContentSaveOutline,   
  mdiCursorDefault, 
  mdiCursorPointer,
  mdiDelete,
  mdiEllipse,
  mdiEyedropper,
  mdiFileCabinet,
  mdiFileDocument, 
  mdiFileCad, 
  mdiFolder,
  mdiFolderMultiple,
  mdiGesture,
  mdiCog,
  mdiViewGridPlusOutline,
  mdiImageEdit,
  mdiInformationOutline,
  mdiInvertColors,
  mdiMagnify,
  mdiFolderOpen,
  mdiRefresh,
  mdiRectangle,
  mdiRuler,
  //mdiToolbox,
  mdiTools,
  mdiTrashCanOutline, 
  mdiVectorLink,
  mdiVideo,
  mdiWeb,
  mdiPlay,
  mdiPause,
  mdiSkipBackward,
  mdiSkipForward,
  mdiSkipNext,
  mdiSkipPrevious,
} from '@mdi/js'

import './App.css'

//import * as cornerstoneTools from "cornerstone-tools"

log()

//localStorage.setItem("debug", "cornerstoneTools")

const drawerWidth = 240
const iconColor = '#FFFFFF'
const activeColor = 'rgba(0, 255, 0, 1.0)'

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

  listItemText: {
    fontSize: '0.85em',
    marginLeft: '-20px',
  },

})

class App extends PureComponent {

  constructor(props) {
    super(props)
    this.files = []
    this.folder = null
    this.file = null
    this.url = null
    this.explorer = null
    this.series = null
  
    this.mprData = {}
    this.mprPlane = ''
    this.echoNumber = 0
    
    this.volume = []

    this.fileOpen = React.createRef()
    this.showFileOpen = this.showFileOpen.bind(this)

    this.openDicomdir = React.createRef()
    this.showOpenDicomdir = this.showOpenDicomdir.bind(this)

    this.openFolder = React.createRef()
    this.showOpenFolder = this.showOpenFolder.bind(this)    

    this.openUrlField = React.createRef()
    
    this.dicomViewersActive = []
    this.dicomViewersActiveSameStudy = []
    this.dicomViewersActiveSamePlane = []
    this.dicomViewersRefs = []
    this.dicomViewers = []
    for(let i=0; i < 16; i++) {
      this.dicomViewers.push(this.setDcmViewer(i))
    }

    this.activeDcmViewersNum = 0

    this.referenceLines = {}
  }

  state = {
    anchorElLayout: null,   
    anchorElToolsPanel: null,   
    openMenu: false,
    openImageEdit: false,
    openTools: false,
    mprMenu: false,
    mprMode: false,
    textMessage: '',
    titleMessage: '',
    visibleMainMenu: true,
    visibleHeader: false,
    visibleSettings: false,
    visibleToolbar: true,
    visibleOpenUrl: false,
    visibleToolbox: false,
    visibleTools: false,
    visibleMeasure: false,
    visibleClearMeasureDlg: false,
    visibleAbout: false,
    visibleDicomdir: false,
    visibleFileManager: false,
    visibleZippedFileDlg: false,
    visibleDownloadZipDlg: false,
    visibleOpenMultipleFilesDlg: false,
    toolState: 1,
    toolActive: 'notool',
    sliceIndex: 0,
    sliceMax: 1,
    listOpenFilesScrolling: false,
    visibleVolumeBuilding: false,
    visibleMpr3D: false,
    visibleMprOrthogonal: false,
    visibleMprCoronal: false,
    visibleMprSagittal: false,
    visibleMprAxial: false,
    visibleExplorer: false,
    visibleMessage: false,
    visibleReferenceLines: true,
    visibleSeriesLink: true,
  }

  /*componentDidUpdate() {
    console.log('App - componentDidUpdate: ', this.props.explorerActiveSeriesIndex)

  }*/

  setDcmViewer = (index) => {
    return (
      <DicomViewer 
        dcmRef={(ref) => {this.dicomViewersRefs[index] = ref}}
        index={index}
        dicomViewersRefs={this.dicomViewersRef}
        runTool={ref => (this.runTool = ref)} 
        changeTool={ref => (this.changeTool = ref)}
        onLoadedImage={this.onLoadedImage}
        onRenderedImage={this.onRenderedImage}
        listOpenFilesPreviousFrame={this.listOpenFilesPreviousFrame}
        listOpenFilesNextFrame={this.listOpenFilesNextFrame}
        overlay={true}
        visible={true}
      />   
    )
  }

  onLoadedImage = () => {
    //console.log('App - onLoadedImage: ')

  }

  onRenderedImage = (index) => {
    //console.log('App - onRenderedImage: ', index)

    if (this.referenceLines.crossViewer !== undefined && 
        this.state.visibleReferenceLines 
        && this.isSliceChange 
        && this.referenceLines.crossViewer.layoutIndex === index) {
      this.isSliceChange = false
      this.referenceLinesShow()
    }
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

  handleOpenLocalFs = (filesSelected) => {
    //console.log('handleOpenLocalFs: ', filesSelected)
    if (filesSelected.length > 1) {
      this.files = filesSelected
      this.changeLayout(1, 1)
      this.mprPlane = ''
      this.volume = []
      this.setState({sliceIndex: 0,
                     sliceMax: 1,
                     visibleMprOrthogonal: false, 
                     visibleMprCoronal: false, 
                     visibleMprSagittal: false, 
                     visibleMprAxial: false}, () => {
                       this.setState({visibleOpenMultipleFilesDlg: true})
                     })
    } else {
      const file = filesSelected[0]
      if (file.type === 'application/x-zip-compressed' || file.type === 'application/zip') {
        this.file = file
        this.url = null
        this.setState({visibleZippedFileDlg: true})
      } else {
        this.setState({sliceIndex: 0, sliceMax: 1})
        this.props.setLocalFileStore(file)
        this.dicomViewersRefs[this.props.activeDcmIndex].runTool('clear')
        this.dicomViewersRefs[this.props.activeDcmIndex].runTool('openLocalFs', file)      
      }
    }
  }

  handleOpenSandboxFs = (fsItem) => {
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool('clear')
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool('openSandboxFs', fsItem)
  }

  handleOpenImage = (index) => {
    //console.log('handleOpenImage: ', index)
//    console.log('handleOpenImage - this.dicomViewersRefs: ', this.dicomViewersRefs)

    this.dicomViewersRefs[this.props.activeDcmIndex].sliceIndex = index // this.state.sliceIndex

    const visibleMprOrthogonal = this.state.visibleMprOrthogonal
    const visibleMprSagittal = this.state.visibleMprSagittal
    const visibleMprCoronal = this.state.visibleMprCoronal
    const visibleMprAxial = this.state.visibleMprAxial
    const plane = this.mprPlanePosition() // plane of source
    //console.log('handleOpenImage, plane: ', plane)
    //console.log('handleOpenImage, visibleMprOrthogonal: ', visibleMprOrthogonal)
    
    if (visibleMprOrthogonal) {
      if (this.props.activeDcmIndex === 0) {
        this.dicomViewersRefs[0].runTool('openimage', index)
        if (this.state.mprMode) {
          this.dicomViewersRefs[1].mprReferenceLines(index)
          this.dicomViewersRefs[2].mprReferenceLines(index)
        }
      } else if (this.props.activeDcmIndex === 1) {
        /*if (plane === 'sagittal') { // then open axial plane in second view
          this.dicomViewersRefs[1].mprRenderXZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
        } else if (plane === 'axial') { // then open coronal plane in second view
          this.dicomViewersRefs[1].mprRenderXZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
        } else { // plane is coronal, then open axial in second view
          this.dicomViewersRefs[1].mprRenderXZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
        }*/
        this.dicomViewersRefs[1].mprRenderXZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
        this.dicomViewersRefs[2].mprReferenceLines2(index) 
        this.dicomViewersRefs[0].mprReferenceLines3(index, this.mprData)

      } else if (this.props.activeDcmIndex === 2) {
        /*if (plane === 'sagittal') { // then open axial plane in third view
          this.dicomViewersRefs[2].mprRenderYZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
        } else if (plane === 'axial') { // then open coronal plane in third view
          this.dicomViewersRefs[2].mprRenderYZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
        } else { // plane is coronal, then open axial in third view
          this.dicomViewersRefs[2].mprRenderYZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
        }*/
        this.dicomViewersRefs[2].mprRenderYZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
        this.dicomViewersRefs[1].mprReferenceLines2(index)   
        this.dicomViewersRefs[0].mprReferenceLines3(index, this.mprData)  
      }

    } else { 
      if (objectIsEmpty(this.mprData)) { // works on new image
        this.dicomViewersRefs[this.props.activeDcmIndex].runTool('openimage', index)
      } else if ((plane === 'sagittal' && visibleMprSagittal) ||
          (plane === 'axial' && visibleMprAxial) ||
          (plane === 'coronal' && visibleMprCoronal))
        this.dicomViewersRefs[this.props.activeDcmIndex].runTool('openimage', index)
      else if (plane === 'sagittal' && visibleMprAxial)
        this.dicomViewersRefs[this.props.activeDcmIndex].mprRenderXZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)  
      else if (plane === 'sagittal' && visibleMprCoronal)
        this.dicomViewersRefs[this.props.activeDcmIndex].mprRenderYZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)   
      else if (plane === 'axial' && visibleMprSagittal)
        this.dicomViewersRefs[this.props.activeDcmIndex].mprRenderYZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
      else if (plane === 'axial' && visibleMprCoronal)
        this.dicomViewersRefs[this.props.activeDcmIndex].mprRenderXZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
      else if (plane === 'coronal' && visibleMprSagittal)
        this.dicomViewersRefs[this.props.activeDcmIndex].mprRenderYZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData) 
      else if (plane === 'coronal' && visibleMprAxial)
        this.dicomViewersRefs[this.props.activeDcmIndex].mprRenderXZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData) 
      else { // it's not a possible MPR, then open as normal dicom file
        this.dicomViewersRefs[this.props.activeDcmIndex].runTool('openimage', index)           
      }
    }

    this.activeDcmViewersNum = this.getActiveDcmViewers()
    //console.log('handleOpenImage - this.dicomViewersActive 1: ', this.dicomViewersActive)
    if (this.activeDcmViewersNum > 0) {
      this.getActiveDcmViewersSameStudy()
      this.getActiveDcmViewersSamePlane()
      //console.log('handleOpenImage - this.dicomViewersActive 2: ', this.dicomViewersActive)
      if (this.state.visibleReferenceLines && this.dicomViewersActive.length > 1) {        
        this.referenceLinesShow() 
      }
    }
  }
  
  handleOpenFileDicomdir = (file) => {
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool('clear')
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool('openLocalFs', file)
  }

  showOpenFolder() {
    this.openFolder.current.click()
  }

  showOpenDicomdir() {
    this.openDicomdir.current.click()
  }

  handleOpenFolder = (files) => {
    if (this.state.visibleExplorer) {
      this.setState({visibleExplorer: false}, () => {
        this.handleOpenFolderDo(files)
      })
    } else this.handleOpenFolderDo(files)
    
  }

  handleOpenFolderDo = (files) => {
    this.changeLayout(1, 1)
    this.mprPlane = ''
    this.volume = []
    this.files = []
    this.clear()

    this.folder = files[0].webkitRelativePath.split('/')[0]

    for (let i=0; i < files.length; i++) {
      this.files.push(files[i])
    }

    this.setState({sliceIndex: 0,
                    sliceMax: 1,
                    visibleMprOrthogonal: false, 
                    visibleMprCoronal: false, 
                    visibleMprSagittal: false, 
                    visibleMprAxial: false})
    this.setState({visibleOpenMultipleFilesDlg: true})        
  }  


  handleOpenDicomdir = (files) => {
    this.setState({ visibleDicomdir: false }, () => {
      let dicomdir = null
      let datafiles = []
      for (let i=0; i < files.length; i++) {
        if (files[i].webkitRelativePath.includes('DICOMDIR')) {
          dicomdir = files[i]
        } else {
          datafiles.push(files[i])
        }
      }
      if (dicomdir !== null) {
        this.props.setDicomdirStore({origin: 'local', dicomdir: dicomdir, files: datafiles})
        this.toggleDicomdir()
      } else {
        this.setState({titleMessage: 'Warning', textMessage: 'The selected folder does not contains any DICOMDIR file.'}, () => {
          this.setState({ visibleMessage: true })
        })
      }
    })
  }

  handleOpenFsDicomdir = (fsItem) => {
    this.props.setDicomdirStore({origin: 'fs', dicomdir: fsItem, files: []})
    this.toggleDicomdir()
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
    const visibleMainMenu = this.state.visibleMainMenu
    if (getSettingsFsView() === 'left') {
      this.setState({ visibleMainMenu: !visibleMainMenu, visibleFileManager: false })
    } else {
      this.setState({ visibleMainMenu: !visibleMainMenu })
    }
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


  toggleFileManager = () => {
    if (getSettingsFsView() === 'left') {
      this.setState({visibleMainMenu: false, visibleFileManager: !this.state.visibleFileManager})
    } else {
      const visible = !this.state.visibleFileManager
      this.setState({ visibleFileManager: visible })
      if (visible) 
        this.setState({ 
          visibleMeasure: false, 
          visibleHeader: false,
          visibleToolbox: false, 
          visibleDicomdir: false, 
          visibleExplorer: false
        })        
    }
  }
  
  toggleExplorer = () => {
    const visible = !this.state.visibleExplorer
    this.setState({ visibleExplorer: visible })
    if (visible) 
      this.setState({ 
        visibleMeasure: false, 
        visibleHeader: false,
        visibleToolbox: false, 
        visibleDicomdir: false, 
        visibleFileManager: false
      })    
  }

  toggleHeader = () => {
    const visible = !this.state.visibleHeader
    this.setState({ visibleHeader: visible })
    if (visible) 
      this.setState({ 
        visibleMeasure: false, 
        visibleToolbox: false, 
        visibleDicomdir: false, 
        visibleFileManager: false,
        visibleExplorer: false
      })    
  }


  toggleToolbox = () => {
    const visible = !this.state.visibleToolbox
    this.setState({ visibleToolbox: visible })
    if (visible) 
      this.setState({ 
        visibleMeasure: false, 
        visibleHeader: false, 
        visibleDicomdir: false, 
        visibleFileManager: false,
        visibleExplorer: false 
      })
  }

  saveMeasure = () => {
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool('savetools')
  }
  
  toggleMeasure = () => {
    const visible = !this.state.visibleMeasure
    this.setState({ visibleMeasure: visible })
    if (visible) 
      this.setState({ 
        visibleToolbox: false, 
        visibleHeader: false, 
        visibleDicomdir: false, 
        visibleFileManager: false,
        visibleExplorer: false
      })
  }

  hideMeasure = () => {
    this.setState({ visibleMeasure: false })
  }

  handleVisibilityMeasure = (visibleMeasure) => {
    this.setState({ visibleMeasure })
  }


  toggleDicomdir = () => {
    const visible = !this.state.visibleDicomdir
    this.setState({ visibleDicomdir: visible })
    if (visible) 
      this.setState({ 
        visibleMeasure: false, 
        visibleToolbox: false, 
        visibleHeader: false, 
        visibleFileManager: false
      })
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


  showZippedFileDlg = () => {
    this.setState({ visibleZippedFileDlg: true })
  }  

  hideZippedFileDlg = () => {
      this.setState({ visibleZippedFileDlg: false })
  }

  confirmZippedFileDlg = () => {
    this.hideZippedFileDlg()
    this.setState({ visibleFileManager: true }, () => {
      if (this.url !== null) {
        this.setState({visibleDownloadZipDlg: true})
      } else {
        this.props.setFsZippedFile(this.file)
      }
    })
  }


  showAbout = () => {
    this.setState({ visibleAbout: !this.state.visibleAbout })
  }
  
  showSettings = () => {
    this.setState({ 
      visibleMainMenu: false, 
      visibleSettings: true, 
      visibleToolbar: false, 
      position: 'right' 
    })
  }

  hideSettings = () => {
    this.setState({ 
      visibleMainMenu: true, 
      visibleSettings: false, 
      visibleToolbar: true,
      visibleFileManager: false,
      visibleDicomdir: false, 
    })
  }

  handleVisibilitySettings = (visibleSettings) => {
    this.setState({ visibleSettings })
  }

  hideDownloadZipDlg = () => {
    this.setState({ visibleDownloadZipDlg: false })
  }

  hideOpenMultipleFilesDlg = () => {
    this.setState({ visibleOpenMultipleFilesDlg: false })
    this.openMultipleFilesCompleted()
  }

  openMultipleFilesCompleted = () => {
    if (this.props.files !== null) {
      this.changeLayout(1, 1)

      this.dicomViewersRefs[this.props.activeDcmIndex].runTool('openimage', 0)

      const sliceMax = this.props.files.length

      this.setState({sliceMax: sliceMax}, () => {
 
      })

      // check if there are studies and series, if so then prepare Explorer
      
      const patientList = groupBy(this.props.files, a => a.patient.patientName)
      const patientKeys = [...patientList.keys()]
      const patient = {
        list: patientList,
        keys: patientKeys
      }

      this.explorer = {
        folder: this.folder,
        patient: patient,
      }

      if (sliceMax > 1)
        this.setState({visibleExplorer: true, visibleFileManager: false})
    } 
  }

  showOpenUrl = () => {
    this.setState({ visibleOpenUrl: true })
  }

  hideOpenUrl = (openDlg) => {
    this.setState({ visibleOpenUrl: false },
      () => {
        if (openDlg) {
          this.hideMainMenu()
          this.file = null
          this.url = this.openUrlField.value
          if (getFileExtReal(this.url) === 'zip') {
            this.setState({visibleZippedFileDlg: true})
          } else {
            return this.dicomViewersRefs[this.props.activeDcmIndex].runTool('openurl', this.openUrlField.value)
          }
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
    this.layoutGridClick(0)
    for(let i=0; i < this.props.isOpen.length; i++)
      if (this.props.isOpen[i]) this.dicomViewersRefs[i].runTool('clear')
    setTimeout(() => {
      this.setState({openImageEdit: false, 
                    openTools: false, 
                    mprMenu: false, 
                    visibleToolbox: false, 
                    visibleMeasure: false, 
                    visibleHeader: false, 
                    visibleDicomdir: false}, () => { 
                    })
      this.changeLayout(1, 1)
      this.props.setFilesStore(null)
      this.props.setDicomdirStore(null)
      //this.props.clearingStore()      
    }, 100) 
  }

  //#region Layout handler
  handleLayout = (event) => {
    this.setState({anchorElLayout: event.currentTarget})
  }
  
  closeLayout = () => {
    this.setState({anchorElLayout: null})
  }

  changeLayout = (row, col) => {
    //console.log(`changeLayout, row: ${row} - col: ${col}`)
    // if reduce the grid clear the unused views
    if (row < this.props.layout[0] || col < this.props.layout[1]) {
      for(let i=0; i < 4; i++) {
        for(let j=0; j < 4; j++) {
          if ((i+1 > row) || (j+1 > col)) {
            const index = i*4+j
            this.dicomViewersRefs[index] = undefined
            if (index === this.props.activeDcmIndex) this.layoutGridClick(index-1)
          }
        }
      }
      this.activeDcmViewersNum = this.getActiveDcmViewers()
      if (this.isMultipleFiles && this.activeDcmViewersNum === 1) this.setState({mprMenu: true})
    }
    this.props.setLayoutStore(row, col)
  }

  //#endregion 

  //#region Tools panel handler
  handleToolsPanel = (event) => {
    this.setState({anchorElToolsPanel: event.currentTarget})
  }

  closeToolsPanel = () => {
    this.setState({anchorElToolsPanel: null})
  }
  //#endregion

  toolExecute = (tool) => {
    this.closeToolsPanel()
    if (tool === 'referencelines') {
      this.referenceLinesToggle()
    } else if (tool === 'serieslink') {
      this.seriesLinkToggle()
    } else {
      this.setState({toolActive: tool})
      this.props.toolStore(tool)
      this.dicomViewersRefs[this.props.activeDcmIndex].runTool(tool)
    }    
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

  toggleOpenMenu = () => {
    this.setState({openMenu: !this.state.openMenu})
  } 

  toggleImageEdit = () => {
    this.setState({openImageEdit: !this.state.openImageEdit})
  }

  toggleTools = () => {
    this.setState({openTools: !this.state.openTools})
  } 

  toggleMpr = () => {
    this.setState({mprMenu: !this.state.mprMenu})
  } 

  layoutGridClick = (index) => {
    if (isMobile && index === this.props.activeDcmIndex) return

    //console.log('layoutGridClick: ', index)

    //this.mprPlanePosition(true, index)

    const sliceMax = this.dicomViewersRefs[index].sliceMax
    const sliceIndex = this.dicomViewersRefs[index].sliceIndex
    this.setState({sliceMax: sliceMax, sliceIndex: sliceIndex})

    this.props.setActiveDcmIndex(index)

    if (this.state.visibleMprOrthogonal) {
      this.setState({sliceMax: sliceMax, sliceIndex: sliceIndex})
    }  

    const dcmViewer = this.getDcmViewerRef(index)
    //console.log('layoutGridClick - dcmViewer: ', dcmViewer)
    if (dcmViewer.image === null) return // click on empty frame

    this.props.setActiveMeasurements(dcmViewer.measurements)
    this.props.setActiveDcm(dcmViewer) // {image: dcmViewer.image, element: dcmViewer.dicomImage, isDicom: dcmViewer.isDicom}
    this.props.setExplorerActiveSeriesIndex(dcmViewer.explorerIndex) 
    //console.log('layoutGridClick - dcmViewer.explorerIndex: ', dcmViewer.explorerIndex) 

    if (this.state.visibleReferenceLines && this.dicomViewersActive.length > 1) {
      if (this.referenceLines.scoutViewer !== undefined) this.referenceLines.scoutViewer.updateImage()
      this.setState({ visibleReferenceLines: false }, () => {
        this.referenceLinesToggle()      
      })
    }
  }
 
  layoutGridTouch = (index) => {
    if (!isMobile && index === this.props.activeDcmIndex) return
     
  }

  buildLayoutGrid = () => {
    
    //this.referenceLinesHide()

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

  getStringVisiblePlane = () => {
    if (this.state.visibleMprOrthogonal) 
      return 'orthogonal'    
    else if (this.state.visibleMprSagittal) 
      return 'sagittal'
    else if (this.state.visibleMprAxial) 
      return 'axial'
    else if (this.state.visibleMprCoronal) 
      return 'coronal'
  }

  appBarTitle = (classes, isOpen, dcmViewer) => {
    if (isMobile && !isTablet) {
      if (isOpen) 
        return null
      else 
        return (
          <Typography variant="overline" className={classes.title}>
            <strong>U</strong> <strong>D</strong>icom <strong>V</strong>iewer
          </Typography>          
        )
    } else {
      if (isOpen) {
        const plane = this.getStringVisiblePlane()
        if (this.state.sliceMax > 1 && this.mprPlane !== plane && this.mprPlane !== '') {
          return (
            <Typography variant="overline" className={classes.title}>
              {'MPR '+plane}
            </Typography>
          )        
        }
        return (
          <Typography variant="overline" className={classes.title}>
            {dcmViewer.filename}
          </Typography>
        )
      } else if (this.props.dicomdir !== null) {
        return (
          <Typography variant="overline" className={classes.title}>
            {this.props.dicomdir.dicomdir.webkitRelativePath}
          </Typography>
        )
      } else
        return (
          <Typography variant="overline" className={classes.title}>
            <strong>U</strong> <strong>D</strong>icom <strong>V</strong>iewer
          </Typography>
        )
    }
  }

  // ---------------------------------------------------------------------------------------------- LINK SERIES
  // #region LINK SERIES

  seriesLinkToggle = () => {
    this.setState({ visibleSeriesLink: !this.state.visibleSeriesLink })
  }

  // ---------------------------------------------------------------------------------------------- REFERENCE LINES
  // #region REFERENCE LINES

  referenceLinesToggle = () => {
    //console.log('referenceLinesToggle: ')
    //console.log('referenceLinesToggle, mprMode: ', this.state.mprMode)
    //if (this.state.mprMode) return
    const visible = !this.state.visibleReferenceLines
    this.setState({ visibleReferenceLines: visible })
    if (visible && this.dicomViewersActive.length > 1) {
      //console.log('this.props.activeDcmIndex: ', this.props.activeDcmIndex)
      /*this.referenceLines.crossViewer = this.getDcmViewerRef(this.props.activeDcmIndex) // this is cross-sectional image
      const crossMprPlane = this.referenceLines.crossViewer.mprPlane
      this.openViewers = this.dicomViewersActive.filter(v => v.layoutIndex !== this.props.activeDcmIndex && crossMprPlane !== v.mprPlane)
      this.referenceLinesDraw()*/
      this.referenceLinesShow()
    } else {
      this.referenceLinesHide()
    }
  }

  referenceLinesShow = () => {
    //console.log('referenceLinesShow, this.props.activeDcmIndex: ', this.props.activeDcmIndex)
    if (this.state.mprMode || !this.state.visibleReferenceLines || this.dicomViewersActive.length < 2) return
    this.referenceLines.crossViewer = this.getDcmViewerRef(this.props.activeDcmIndex) // this is cross-sectional image
    const crossMprPlane = this.referenceLines.crossViewer.mprPlane
    this.openViewers = this.dicomViewersActive.filter(v => v.layoutIndex !== this.props.activeDcmIndex && crossMprPlane !== v.mprPlane)    
    //this.referenceLinesDraw()
    //console.log('referenceLinesShow, this.referenceLines.crossViewer: ', this.referenceLines.crossViewer)
    this.referenceLines.crossViewer.updateImage()
    for(let i=0; i < this.openViewers.length; i++) {
      this.openViewers[i].referenceLinesBuild(this.referenceLines.crossViewer.image) // this is scout image
    }
  }

  referenceLinesHide = () => {
    if (this.state.mprMode || this.openViewers === undefined) return
    for(let i=0; i < this.openViewers.length; i++) {
      this.openViewers[i].updateImage() // this is scout image
    }
  }
/*
  referenceLinesDraw = () => {
    if (this.state.mprMode) return
    console.log('referenceLinesDraw: ')
    console.log('referenceLinesDraw, this.referenceLines.crossViewer: ', this.referenceLines.crossViewer)
    this.referenceLines.crossViewer.updateImage()
    for(let i=0; i < this.openViewers.length; i++) {
      this.openViewers[i].referenceLinesBuild(this.referenceLines.crossViewer.image) // this is scout image
    }
  }
*/
  // #endregion 

  // ---------------------------------------------------------------------------------------------- MPR
  // #region MPR

  mprBuildVolume = () => {
    //console.log('mprBuildVolume: ', this.state.sliceIndex)
    //console.log('this.files: ', this.files)
    //console.log('this.dicomViewersRefs[0].files: ', this.dicomViewersRefs[0].files)

    // "For the specific case of dual-echo MR images select files with same EchoNumber tag of selected image.
    // see https://groups.google.com/forum/#!topic/comp.protocols.dicom/zh2TzgbjvdE    
    const echoNumber = getDicomEchoNumber(this.dicomViewersRefs[this.props.activeDcmIndex].image)

    if (this.volume.length > 0 && echoNumber === this.echoNumber) return

    this.t0 = performance.now()

    const files = this.dicomViewersRefs[0].files.filter((a) => {
      return a.series.echoNumber === echoNumber}
    )
    if (files.length < this.files.length) { // until mprMode is true temporary works on files with same EchoNumber
      this.echoNumber = echoNumber
      this.dicomViewersRefs[this.props.activeDcmIndex].runTool('setfiles', files)
    }

    const sliceIndex = this.state.sliceIndex
    const xPixelSpacing = getDicomPixelSpacing(files[sliceIndex].image, 1)
    const spacingBetweenSlice = getDicomSpacingBetweenSlice(files[sliceIndex].image)
    const sliceThickness = getDicomSliceThickness(files[sliceIndex].image)
    const length = files[sliceIndex].image.getPixelData().length
    const sliceLocation = getDicomSliceLocation(files[sliceIndex].image)

    this.volume = []

    // see https://stackoverflow.com/questions/58412358/dicom-multiplanar-image-reconstruction
    this.mprData.zDim = Math.round(files.length * spacingBetweenSlice / xPixelSpacing)

    //console.log('this.mprData.zDim: ', this.mprData.zDim)
    //console.log('spacingBetweenSlice: ', spacingBetweenSlice)
    //console.log('sliceThickness: ', sliceThickness)
    //console.log('xPixelSpacing: ', xPixelSpacing)
    //console.log('getSliceLocation: ', sliceLocation)

    // If spacing between slices is less than slice thickness, the images are not optimal for 3D reconstruction.
    // Try an alternative algorithm based on slice distance.
    let zDimMethod2 = false
    if (spacingBetweenSlice < sliceThickness && sliceLocation === undefined) {
      let max = files[sliceIndex].sliceDistance
      let min = files[sliceIndex].sliceDistance
      for(let i=0; i < files.length; i++) {
        if (files[i].sliceDistance > max)
          max = files[i].sliceDistance
        if (files[i].sliceDistance < min)
          min = files[i].sliceDistance  
      }
      this.mprData.zDim = Math.round(Math.abs(max - min) / xPixelSpacing)
      //console.log('method2, this.mprData.zDim: ', this.mprData.zDim)
      zDimMethod2 = true
    }
    //console.log('this.mprData.zDim: ', this.mprData.zDim)
    this.mprData.zStep = Math.round(this.mprData.zDim / files.length)
    //console.log('this.mprData.zStep: ', this.mprData.zStep)
    
    if (files.length === this.mprData.zDim) { // slices contiguous
      for (let i = 0, len = files.length; i < len; i++) {
        this.volume.push(files[i].image.getPixelData())
      }
      
    } else if (files.length < this.mprData.zDim) { // gap between slices
      
      let emptyPlane = new Int16Array(length).fill(0)
      for (let i = 0, len = this.mprData.zDim; i < len; i++) {
        this.volume.push(emptyPlane)
      }

      let order = []

      for (let i = 0; i < files.length; i++) {
        order.push({iFile: i, instanceNumber: files[i].instanceNumber, sliceDistance: files[i].sliceDistance, sliceLocation: files[i].sliceLocation})
      }
      //console.log('order 1: ', order) 

      if (zDimMethod2) {
        // eliminate eventually duplicates
        order = order.reduce((previous, current) => {
          let object = previous.filter(object => object.sliceDistance === current.sliceDistance)
          if (object.length === 0) {
            previous.push(current)
          }
          return previous
        }, [])

        order.sort((l, r) => {
          // return r.sliceDistance - l.sliceDistance
          return l.instanceNumber - r.instanceNumber
        })     
        //console.log('order - zDimMethod2: ', order)     

      } else {
        const reorder = (files[0].sliceDistance < files[1].sliceDistance)
        //console.log('reorder 1: ', reorder)
        // const reorder = files[sliceIndex].sliceLocation < files[1].sliceLocation
        if (reorder) {
          order.sort((l, r) => {
            return r.sliceDistance - l.sliceDistance
            //return r.sliceLocation - l.sliceLocation
            // return r.instanceNumber - l.instanceNumber
          })    
          //console.log('order - no zDimMethod2, 1: ', order)
        } else {
          const isOnRows = getDicomImageXOnRows(files[sliceIndex].image)
          const reorder = Math.sign(files[0].sliceDistance) * Math.sign(files[0].sliceLocation) < 0
          //console.log('reorder 2: ', reorder)
          if (reorder) {        
            order.sort((l, r) => {
              if (isOnRows)
                return l.sliceDistance - r.sliceDistance
              else
                return r.sliceDistance - l.sliceDistance  
            })    
            //console.log('order - no zDimMethod2, 2: ', order)
          }
        }
      }
/*
      order.sort((l, r) => {
        return r.sliceDistance - l.sliceDistance
        // return l.instanceNumber - r.instanceNumber
      })  
*/
      //console.log('order 2: ', order)

      this.mprData.instanceNumberOrder = files[order[0].iFile].instanceNumber < files[order[1].iFile].instanceNumber ? 1 : -1
      this.mprData.indexMax = files.length

      let intervals = [0]
      this.volume[0] = files[order[0].iFile].image.getPixelData()
      this.volume[this.mprData.zDim-1] = files[order[order.length-1].iFile].image.getPixelData()  
      const step = (this.mprData.zDim-2) / (order.length-2)
      let i = 0
      for (let k = 1; k <= order.length-2; k++) {  
          i = Math.ceil(i+step)
          //console.log(`i: ${i},  k: ${k},  order[k].iFile: ${order[k].iFile}`)
          this.volume[i] = files[order[k].iFile].image.getPixelData() // order[k-1].iFile
          intervals.push(i)
      }
      intervals.push(this.mprData.zDim-1)

      const interpolationMethod = getSettingsMprInterpolation()

      if (interpolationMethod === 'no') {
        // build missing planes without interpolation, simple duplicate
        for (let i = 0; i < intervals.length-1; i++)
          for (let j = intervals[i]+1; j <= intervals[i+1]-1; j++)
            this.volume[j] = this.volume[intervals[i+1]]
      } else if (interpolationMethod === 'weightedlinear') {
        // build the interpolate planes between original planes
        for (let i = 0; i < intervals.length-1; i++) {
          const step = intervals[i+1]-intervals[i]
          for (let j = intervals[i]+1; j < intervals[i+1]; j++) {
            let p = new Int16Array(length)
            const w = (j-intervals[i]) / step
            for (let k = 0; k < length-1; k++) {
              // simple linear interpolation
              // const p0 = this.volume[intervals[i]][k]
              // const p1 = this.volume[intervals[i+1]][k]
              // p[k] = (p0+p1)/2   

              // weighted linear interpolation
              const p0 = this.volume[intervals[i]][k] * (1-w)
              const p1 = this.volume[intervals[i+1]][k] * w
              p[k] = p0+p1

              // weighted bilinear interpolation
              /*if (k-1 > 0 && k+1 < length) {
                const p0 = this.volume[intervals[i]][k] * (1-w) * 0.5 + this.volume[intervals[i]][k-1] * (1-w) * 0.25 + this.volume[intervals[i]][k+1] * (1-w) * 0.25
                const p1 = this.volume[intervals[i+1]][k] * w * 0.5 + this.volume[intervals[i+1]][k-1] * w * 0.25 + this.volume[intervals[i+1]][k+1] * w * 0.25
                p[k] = p0+p1
              } else if (k-1 < 0) {
                const p0 = this.volume[intervals[i]][k] * (1-w) * 0.75 + this.volume[intervals[i]][k+1] * (1-w) * 0.25
                const p1 = this.volume[intervals[i+1]][k] * w * 0.5 + this.volume[intervals[i+1]][k+1] * w * 0.25
                p[k] = p0+p1
              } else { // k+1 > length 
                const p0 = this.volume[intervals[i]][k] * (1-w) * 0.75 + this.volume[intervals[i]][k-1] * (1-w) * 0.25
                const p1 = this.volume[intervals[i+1]][k] * w * 0.5 + this.volume[intervals[i+1]][k-1] * w * 0.25
                p[k] = p0+p1
              }*/
            }

            this.volume[j]= p
          }
        }
      }

      this.t1 = performance.now()
      console.log(`performance volume building: ${this.t1-this.t0} milliseconds`)

    } else { // overlapping slices
      this.mprData.zStep = Math.round(files.length / this.mprData.zDim)
      for (let i = 0, len = this.mprData.zDim; i < len; i++) {
        const k = i*this.mprData.zStep
        this.volume.push(files[k].image.getPixelData())
      }  
    }

    const index = Math.round(files.length / 2)
    this.setState({sliceIndex: index}, () => {
      if (this.state.visibleMprOrthogonal) {
        this.changeToOrthogonalView()

      } else if (this.state.visibleMprSagittal) {
        this.changeToSagittalView()

      } else if (this.state.visibleMprCoronal) {
        this.changeToCoronalView()  

      } else { // axial
        this.changeToAxialView()
      }      
    })
          
  }

  changeToOrthogonalView = () => {  
    //console.log('changeToOrthogonalView - files: ', this.dicomViewersRefs[0].files)
    
    this.setState({sliceMax: this.dicomViewersRefs[0].files.length})

    this.changeLayout(1, 3)

    const index = Math.trunc(this.dicomViewersRefs[0].files.length / 2)

    this.setState({visibleVolumeBuilding: false, sliceIndex: index, mprMode: true}, () => {
      const plane = this.mprPlanePosition()

      if (this.dicomViewersRefs[0].volume === null)
        this.dicomViewersRefs[0].volume = this.volume

      this.dicomViewersRefs[0].runTool('openimage', index)

      if (this.dicomViewersRefs[1].volume === null)
        this.dicomViewersRefs[1].volume = this.volume
      
      this.dicomViewersRefs[1].runTool('setfiles', this.files)
      this.dicomViewersRefs[1].explorerIndex = this.dicomViewersRefs[0].explorerIndex
      this.dicomViewersRefs[1].sliceMax = this.dicomViewersRefs[0].files[index].image.columns
      const xzIndex = Math.trunc(this.dicomViewersRefs[1].sliceMax / 2)
      this.dicomViewersRefs[1].mprRenderXZPlane(this.dicomViewersRefs[0].filename, plane, xzIndex, this.mprData)  
      
      if (this.dicomViewersRefs[2].volume === null)
        this.dicomViewersRefs[2].volume = this.volume

      this.dicomViewersRefs[2].runTool('setfiles', this.files) 
      this.dicomViewersRefs[2].explorerIndex = this.dicomViewersRefs[0].explorerIndex
      this.dicomViewersRefs[2].sliceMax = this.dicomViewersRefs[0].files[index].image.columns
      const yzIndex = Math.trunc(this.dicomViewersRefs[2].sliceMax / 2) 
      this.dicomViewersRefs[2].mprRenderYZPlane(this.dicomViewersRefs[0].filename, plane, yzIndex, this.mprData)    
    })

  }

  changeToSagittalView = () => {
    //console.log('changeToSagittalView: ')

    this.changeLayout(1, 1)

    this.setState({visibleVolumeBuilding: false}, () => {
      const plane = this.mprPlanePosition()

      if (this.dicomViewersRefs[this.props.activeDcmIndex].volume === null)
        this.dicomViewersRefs[this.props.activeDcmIndex].volume = this.volume

      if (plane === 'sagittal') { 
        this.dicomViewersRefs[0].runTool('setfiles', this.files) // due to EchoNumber can be changed
        const sliceMax = this.dicomViewersRefs[0].files === null ? 1 : this.dicomViewersRefs[0].files.length
        const index = Math.trunc(sliceMax / 2)
        this.setState({sliceIndex: index, sliceMax: sliceMax, mprMode: false}, () => {
          this.dicomViewersRefs[this.props.activeDcmIndex].sliceMax = sliceMax
          this.dicomViewersRefs[this.props.activeDcmIndex].runTool('openimage', index)
        })
      } else if (plane === 'axial') {
        const sliceMax = this.dicomViewersRefs[0].files[0].image.rows // this.mprData.zDim 
        const index = Math.trunc(sliceMax / 2)
        this.setState({sliceIndex: index, sliceMax: sliceMax}, () => {
          this.dicomViewersRefs[this.props.activeDcmIndex].sliceMax = sliceMax
          this.dicomViewersRefs[this.props.activeDcmIndex].mprRenderYZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
        })   
      } else {
        const sliceMax = this.dicomViewersRefs[0].files[0].image.columns // this.mprData.zDim 
        const index = Math.trunc(sliceMax / 2)
        this.setState({sliceIndex: index, sliceMax: sliceMax}, () => {
          this.dicomViewersRefs[this.props.activeDcmIndex].sliceMax = sliceMax
          this.dicomViewersRefs[this.props.activeDcmIndex].mprRenderXZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
        }) 
      }      
    })
  }

  changeToCoronalView = () => {  
    this.changeLayout(1, 1)

    this.setState({visibleVolumeBuilding: false}, () => {
      const plane = this.mprPlanePosition()

      if (this.dicomViewersRefs[this.props.activeDcmIndex].volume === null)
        this.dicomViewersRefs[this.props.activeDcmIndex].volume = this.volume

      if (plane === 'coronal') {
        this.dicomViewersRefs[0].runTool('setfiles', this.files) // due to EchoNumber can be changed
        const sliceMax = this.dicomViewersRefs[0].files === null ? 1 : this.dicomViewersRefs[0].files.length
        const index = Math.trunc(sliceMax / 2)
        this.setState({sliceIndex: index, sliceMax: sliceMax, mprMode: false}, () => {
          this.dicomViewersRefs[this.props.activeDcmIndex].sliceMax = sliceMax
          this.dicomViewersRefs[this.props.activeDcmIndex].runTool('openimage', index)
        })       

      } else if (plane === 'axial') {
        const sliceMax = this.dicomViewersRefs[0].files[0].image.columns // this.mprData.zDim 
        const index = Math.trunc(sliceMax / 2)
        this.setState({sliceIndex: index, sliceMax: sliceMax}, () => {
          this.dicomViewersRefs[this.props.activeDcmIndex].sliceMax = sliceMax
          this.dicomViewersRefs[this.props.activeDcmIndex].mprRenderXZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
        })

      } else { // plane is sagittal
        const sliceMax = this.dicomViewersRefs[0].files[0].image.rows // this.mprData.zDim 
        const index = Math.trunc(sliceMax / 2)
        this.setState({sliceIndex: index, sliceMax: sliceMax}, () => {
          this.dicomViewersRefs[this.props.activeDcmIndex].sliceMax = sliceMax
          this.dicomViewersRefs[this.props.activeDcmIndex].mprRenderYZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
        })  
      }      
    })
  }

  changeToAxialView = () => {  
    this.changeLayout(1, 1)

    this.setState({visibleVolumeBuilding: false}, () => {
      const plane = this.mprPlanePosition()
          
      if (this.dicomViewersRefs[this.props.activeDcmIndex].volume === null)
        this.dicomViewersRefs[this.props.activeDcmIndex].volume = this.volume

      if (plane === 'axial') {
        this.dicomViewersRefs[0].runTool('setfiles', this.files) // due to EchoNumber can be changed
        const sliceMax = this.dicomViewersRefs[0].files === null ? 1 : this.dicomViewersRefs[0].files.length
        const index = Math.trunc(sliceMax / 2)
        this.setState({sliceIndex: index, sliceMax: sliceMax, mprMode: false}, () => {
          this.dicomViewersRefs[this.props.activeDcmIndex].sliceMax = sliceMax
          this.dicomViewersRefs[this.props.activeDcmIndex].runTool('openimage', index)
        })
        

      } else if (plane === 'sagittal') {
        const sliceMax = this.dicomViewersRefs[0].files[0].image.columns // this.mprData.zDim 
        const index = Math.trunc(sliceMax / 2)
        this.setState({sliceIndex: index, sliceMax: sliceMax}, () => {
          this.dicomViewersRefs[this.props.activeDcmIndex].sliceMax = sliceMax
          this.dicomViewersRefs[this.props.activeDcmIndex].mprRenderXZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
        })
        

      } else {
        const sliceMax = this.dicomViewersRefs[0].files[0].image.rows // this.mprData.zDim 
        const index = Math.trunc(sliceMax / 2)
        this.setState({sliceIndex: index, sliceMax: sliceMax}, () => {
          this.dicomViewersRefs[this.props.activeDcmIndex].sliceMax = sliceMax
          this.dicomViewersRefs[this.props.activeDcmIndex].mprRenderYZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
        })             
      }      
    })
  }

  mprPlanePosition = (force = false, index = this.props.activeDcmIndex) => {
    //console.log('App - mprPlanePosition: ', index)
    if (this.mprPlane === '' || force) {
      this.mprPlane = this.dicomViewersRefs[index].mprPlanePosition()
      if (!this.state.visibleMprOrthogonal) {
        if (this.mprPlane === 'sagittal')
          this.setState({ visibleMprOrthogonal: false, visibleMprSagittal: true, visibleMprAxial: false, visibleMprCoronal: false})
        else if (this.mprPlane === 'coronal')
          this.setState({ visibleMprOrthogonal: false, visibleMprSagittal: false, visibleMprAxial: false, visibleMprCoronal: true })  
        else 
          this.setState({ visibleMprOrthogonal: false, visibleMprSagittal: false, visibleMprAxial: true, visibleMprCoronal: false })        
      }
    }
    return this.mprPlane  
  }

  mpr3D = () => {
    
  }

  mprOrthogonal = () => {
    const visibleMprOrthogonal = this.state.visibleMprOrthogonal
    if (!visibleMprOrthogonal) {
      this.mprData.plane = {
        from: this.mprPlane,
        to: 'orthogonal'
      }
      this.setState({visibleMprOrthogonal: true, 
                    visibleMprCoronal: false, 
                    visibleMprSagittal: false, 
                    visibleMprAxial: false}, () => {
        if (this.volume.length === 0) {   
          this.setState({visibleVolumeBuilding: true}, () => {           
            setTimeout(() => {
              this.mprBuildVolume()
            }, 100)   
          })
        } else {
          this.changeToOrthogonalView()
        }
      })
    }
  }

  mprSagittal = () => {
    const visibleMprSagittal = this.state.visibleMprSagittal
    if (!visibleMprSagittal) {
      this.mprData.plane = {
        from: this.mprPlane,
        to: 'sagittal'
      }
      this.setState({visibleMprOrthogonal: false, 
                    visibleMprSagittal: true, 
                    visibleMprCoronal: false, 
                    visibleMprAxial: false}, () => {
        if (this.volume.length === 0) {   
          this.setState({visibleVolumeBuilding: true}, () => {           
            setTimeout(() => {
              this.mprBuildVolume()
            }, 100)   
          })
        } else {
          this.changeToSagittalView()
        }
      })
    }
  }
    
  mprCoronal = () => {
    const visibleMprCoronal = this.state.visibleMprCoronal
    if (!visibleMprCoronal) {
      this.mprData.plane = {
        from: this.mprPlane,
        to: 'coronal'
      }
      this.setState({visibleMprOrthogonal: false, 
                     visibleMprSagittal: false, 
                     visibleMprCoronal: true, 
                     visibleMprAxial: false}, () => {
        if (this.volume.length === 0) {   
          this.setState({visibleVolumeBuilding: true}, () => {           
            setTimeout(() => {
              this.mprBuildVolume()
            }, 100)   
          })
        } else {
          this.changeToCoronalView()
        }
      })
    }
  }

  mprAxial = () => {
    const visibleMprAxial = this.state.visibleMprAxial
    if (!visibleMprAxial) {
      this.mprData.plane = {
        from: this.mprPlane,
        to: 'axial'
      }
      this.setState({visibleMprOrthogonal: false, 
                     visibleMprSagittal: false, 
                     visibleMprCoronal: false, 
                     visibleMprAxial: true}, () => {
        if (this.volume.length === 0) {   
          this.setState({visibleVolumeBuilding: true}, () => {           
            setTimeout(() => {
              this.mprBuildVolume()
            }, 100)   
          })
        } else {
          this.changeToAxialView()
        }
      })
    }
  }

  // #endregion 
  
  // ---------------------------------------------------------------------------------------------- FILES/SLICE MANIPULATION
  //#region FILES/SLICE MANIPULATION

  listOpenFilesFirstFrame = () => {
    const index = 0
    this.setState({sliceIndex: index}, () => {
      this.isSliceChange = true
      this.handleOpenImage(index)
    })
  }

  listOpenFilesPreviousFrame = () => {
    let index = this.state.sliceIndex
    index = index === 0 ? this.state.sliceMax-1 : index-1
    this.setState({sliceIndex: index}, () => {
      this.isSliceChange = true
      this.handleOpenImage(index)
      this.syncActiveDcmViewersSamePlane(-1)
    })
  } 

  listOpenFilesNextFrame = () => {
    let index = this.state.sliceIndex
    index = index === this.state.sliceMax-1 ? 0 : index+1
    this.setState({sliceIndex: index}, () => {
      this.isSliceChange = true
      this.handleOpenImage(index)
      this.syncActiveDcmViewersSamePlane(+1)
    })
  }  

  listOpenFilesLastFrame = () => {
    const index = this.state.sliceMax-1
    this.setState({sliceIndex: index}, () => {
      this.isSliceChange = true
      this.handleOpenImage(index)
    })
  }  

  listOpenFilesScrolling = () => {  
    const scrolling = this.state.listOpenFilesScrolling
    this.setState({listOpenFilesScrolling: !scrolling}, () => {
      if (scrolling) {
        clearInterval(this.timerScrolling)
      } else {
        this.timerScrolling = setInterval(() => {
          this.listOpenFilesNextFrame()
        }, 500)
      }      
    })
  }

  handleSliceChange = (event, value) => {
    this.setState({sliceIndex: Math.floor(value)}, () => {
      let index = this.state.sliceIndex
      this.isSliceChange = true
      this.handleOpenImage(index)
    })
  }

  //#endregion

  // ---------------------------------------------------------------------------------------------- EXPLORER
  //#region EXPLORER

  explorerOnSelectSeries = (files, explorerIndex) => {
    //console.log('explorerOnSelectSeries: ', files)
    let index = this.props.activeDcmIndex
    if (this.state.mprMode) {
      index = 0
      this.setState({sliceIndex: 0,
        sliceMax: 1,
        visibleMprOrthogonal: false, 
        visibleMprCoronal: false, 
        visibleMprSagittal: false, 
        visibleMprAxial: false})
      this.props.setActiveDcmIndex(index)
      this.changeLayout(1, 1)
    }

    this.files = files
    this.mprPlane = ''
    this.mprData = {}
    this.volume = []

    this.dicomViewersRefs[index].runTool('setfiles', this.files)
    this.dicomViewersRefs[index].explorerIndex = explorerIndex

    const sliceMax = this.dicomViewersRefs[index].sliceMax
    const sliceIndex = 0 // this.dicomViewersRefs[this.props.activeDcmIndex].sliceIndex
    this.setState({sliceMax: sliceMax, sliceIndex: sliceIndex, mprMode: false}, () => {
      this.handleOpenImage(sliceIndex)
    })
  }

  //#endregion EXPLORER

  getActiveDcmViewers = () => {
    //console.log('getActiveDcmViewers', this.dicomViewersRefs)
    this.dicomViewersActive = this.dicomViewersRefs.filter(v => v !== undefined && v.image !== null)
    //console.log('dicomViewersActive: ', this.dicomViewersActive)
    return this.dicomViewersActive.length
  }  

  getActiveDcmViewersSameStudy = () => {
    //console.log('App - this.dicomViewersActiveSameStudy - this.dicomViewersRefs: ', this.dicomViewersRefs)
    const studyId = getDicomStudyId(this.dicomViewersRefs[this.props.activeDcmIndex].image)
    this.dicomViewersActiveSameStudy = this.dicomViewersRefs.filter(v => v !== undefined && getDicomStudyId(v.image) === studyId)
    //console.log('App - this.dicomViewersActiveSameStudy', this.dicomViewersActiveSameStudy)
    return this.dicomViewersActiveSameStudy.length
  }  

  getActiveDcmViewersSamePlane = () => {
    this.dicomViewersActiveSamePlane = []
    //console.log('App - getActiveDcmViewersSamePlane - this.props.activeDcmIndex: ', this.props.activeDcmIndex)
    const plane = this.dicomViewersRefs[this.props.activeDcmIndex].mprPlane
    //console.log('App - getActiveDcmViewersSamePlane - plane: ', plane)
    for(let i=0; i < this.dicomViewersActiveSameStudy.length; i++) {
      //console.log('App - getActiveDcmViewersSamePlane - i: ', i)
      //console.log('App - getActiveDcmViewersSamePlane - this.dicomViewersActiveSameStudy[i].mprPlane: ', this.dicomViewersActiveSameStudy[i].mprPlane)
      if (this.dicomViewersActiveSameStudy[i].mprPlane === plane && 
          this.dicomViewersActiveSameStudy[i].layoutIndex !== this.props.activeDcmIndex)
        this.dicomViewersActiveSamePlane.push(this.dicomViewersActiveSameStudy[i])
    }
    //console.log('App - getActiveDcmViewersSamePlane - this.dicomViewersActiveSamePlane: ', this.dicomViewersActiveSamePlane)
  }

  syncActiveDcmViewersSamePlane = (direction) => {
    if (!this.state.visibleSeriesLink) return
    //console.log('App - this.dicomViewersActiveSamePlane: ', this.dicomViewersActiveSamePlane)
    if (this.dicomViewersActiveSamePlane.length > 0) {
      const plane = this.dicomViewersRefs[this.props.activeDcmIndex].mprPlane
      const ippX = getDicomIpp(this.dicomViewersRefs[this.props.activeDcmIndex].image, 0)
      const ippY = getDicomIpp(this.dicomViewersRefs[this.props.activeDcmIndex].image, 1)
      const ippZ = getDicomIpp(this.dicomViewersRefs[this.props.activeDcmIndex].image, 2)

      //console.log('App - syncActiveDcmViewersSamePlane - plane: ', plane)
      //console.log('App - syncActiveDcmViewersSamePlane - ippX: ', ippX)
      //console.log('App - syncActiveDcmViewersSamePlane - ippY: ', ippY)
      //console.log('App - syncActiveDcmViewersSamePlane - ippZ: ', ippZ)

      let j = 0
      for(let i=0; i < this.dicomViewersActiveSamePlane.length; i++) {
        if (plane === 'sagittal')
          j = this.dicomViewersActiveSamePlane[i].findFirstSliceWithIppValue(ippX, 0)
        else if (plane === 'coronal') 
          j = this.dicomViewersActiveSamePlane[i].findFirstSliceWithIppValue(ippY, 1)
        else if (plane === 'axial') 
          j = this.dicomViewersActiveSamePlane[i].findFirstSliceWithIppValue(ippZ, 2)
        //console.log('App - syncActiveDcmViewersSamePlane - j: ', j)
        if (j >= 0) 
          this.dicomViewersActiveSamePlane[i].runTool('openimage', j)
      }
    }
  }
  

  colorIcon = (tool) => {
    return this.state.toolActive === tool ? activeColor : iconColor
  }

  render() {
    //console.log('App render: ')

    const { classes } = this.props

    const primaryClass = {primary:classes.listItemText}
    const iconSize = '1.2rem'
    const iconSizeSmall = '1.0rem'
    
    //const isMultipleView = this.props.layout[0] > 1 || this.props.layout[1] > 1
    const isOpen = this.props.isOpen[this.props.activeDcmIndex]
    const isDicomdir = this.props.dicomdir !== null
    this.isMultipleFiles = false
    if (this.dicomViewersRefs[this.props.activeDcmIndex] === undefined) {
      this.isMultipleFiles = false
    } else {
      if (this.dicomViewersRefs[this.props.activeDcmIndex].files !== null) 
        this.isMultipleFiles = this.dicomViewersRefs[this.props.activeDcmIndex].files.length > 1
      else
        this.isMultipleFiles = false
    }
    //console.log('isMultipleFiles: ', this.isMultipleFiles)
    //const isMultipleView = this.activeDcmViewersNum > 1

    const openMenu = this.state.openMenu
    const openImageEdit = this.state.openImageEdit
    const openTools = this.state.openTools
    const visibleMainMenu = this.state.visibleMainMenu
    const visibleHeader = this.state.visibleHeader
    const visibleSettings = this.state.visibleSettings
    const visibleAbout = this.state.visibleAbout
    const visibleMeasure = this.state.visibleMeasure
    const visibleToolbox = this.state.visibleToolbox
    const visibleDicomdir = this.state.visibleDicomdir
    const visibleFileManager = this.state.visibleFileManager
    const visibleClearMeasureDlg = this.state.visibleClearMeasureDlg
    const visibleZippedFileDlg = this.state.visibleZippedFileDlg 
    const visibleDownloadZipDlg = this.state.visibleDownloadZipDlg
    const visibleOpenMultipleFilesDlg = this.state.visibleOpenMultipleFilesDlg
    const visibleLayout = Boolean(this.state.anchorElLayout)
    const visibleVolumeBuilding = this.state.visibleVolumeBuilding
    //const visibleMpr3D = this.state.visibleMpr3D
    const visibleMprOrthogonal = this.state.visibleMprOrthogonal
    const visibleMprCoronal = this.state.visibleMprCoronal
    const visibleMprSagittal = this.state.visibleMprSagittal
    const visibleMprAxial = this.state.visibleMprAxial
    const visibleExplorer = this.state.visibleExplorer
    const visibleReferenceLines = this.state.visibleReferenceLines
    const visibleSeriesLink = this.state.visibleSeriesLink
    const visibleToolsPanel = Boolean(this.state.anchorElToolsPanel)
    const mprMenu = this.state.mprMenu && this.mprPlane !== '' //  && isMultipleFiles

    //let iconToolColor = this.state.toolState === 1 ? '#FFFFFF' : '#999999'

    const dcmViewer = this.getActiveDcmViewer()

    const sliceMax = this.state.sliceMax

    //console.log('dcmViewer: ', dcmViewer)
    //console.log('this.mprPlane: ', this.mprPlane)
    //console.log('mprMenu: ', mprMenu)
    //console.log('mprMode: ', this.state.mprMode)
    
    return (
      <div>
        <AppBar className={classes.appBar} position='static' elevation={0}>
          <Toolbar variant="dense">
            <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu" onClick={this.toggleMainMenu}>
              <MenuIcon />
            </IconButton>
            { this.appBarTitle(classes, isOpen, dcmViewer) }
            
            <div className={classes.grow} />
            { !isOpen && !isDicomdir ? (
              <IconButton onClick={this.showAbout}>
                <Icon path={mdiInformationOutline} size={iconSize} color={iconColor} />
              </IconButton> 
             ) : null
            }        
            {/*    
            { iconTool !== null && this.props.tool !== null &&  isOpen ? (
                <IconButton onClick={this.toolChange}>
                  <Icon path={iconTool} size={iconSize} color={iconToolColor} />
                </IconButton>
              ) : null
            }
            */}
            { isOpen && dcmViewer.numberOfFrames > 1 &&  isOpen ? (
              <Tooltip title="Cine Player">
                <IconButton onClick={this.cinePlayer}>
                  <Icon path={mdiVideo} size={iconSize} color={iconColor} />
                </IconButton> 
              </Tooltip>
              ): null
            }
            { isOpen ? (
              <Tooltip title="Reset Image">
                <IconButton onClick={this.resetImage}>
                  <Icon path={mdiRefresh} size={iconSize} color={iconColor} />
                </IconButton>
              </Tooltip>
             ) : null
            }            
            { isOpen ? (
              <Tooltip title="Tools">
                <IconButton onClick={this.handleToolsPanel}>
                  <Icon path={mdiTools} size={iconSize} color={iconColor} />
                </IconButton>
              </Tooltip>
             ) : null
            }            
            { isOpen ? (
              <Tooltip title="Save Screenshot">
                <IconButton color="inherit" onClick={this.saveShot}>
                  <Icon path={mdiCamera} size={iconSize} color={iconColor} />
                </IconButton>
              </Tooltip>
             ) : null
            }
            {/* isOpen ? (
              <Tooltip title="Toolbox">
                <IconButton color="inherit" onClick={this.toggleToolbox}>
                  <Icon path={mdiToolbox} size={iconSize} color={iconColor} />
                </IconButton>
              </Tooltip>
              ) : null
            */}              
            { isOpen ? (
              <Tooltip title="Measurements">
                <IconButton color="inherit" onClick={this.toggleMeasure}>
                  <Icon path={mdiFileCad} size={iconSize} color={iconColor} />
                </IconButton>
              </Tooltip>
              ) : null
            }  
            { isOpen && dcmViewer.isDicom ? (
              <Tooltip title="Dicom Header">
                <IconButton color="inherit" onClick={this.toggleHeader}>
                  <Icon path={mdiFileDocument} size={iconSize} color={iconColor} />
                </IconButton>
              </Tooltip>
              ) : null
            }  
            { isDicomdir ? (
              <Tooltip title="DICOMDIR">
                <IconButton color="inherit" onClick={this.toggleDicomdir}>
                  <Icon path={mdiFolderOpen} size={iconSize} color={iconColor} />
                </IconButton>
              </Tooltip>
              ) : null
            }    
            { (isOpen && this.isMultipleFiles) || visibleMprOrthogonal ? (
              <Tooltip title="Explorer">
                <IconButton color="inherit" onClick={this.toggleExplorer}>
                  <Icon path={mdiAnimationOutline} size={iconSize} color={iconColor} />
                </IconButton>
              </Tooltip>
              ) : null
            }             
            { isOpen ? (
              <Tooltip title="Sandbox File Manager">
                <IconButton color="inherit" onClick={this.toggleFileManager}>
                  <Icon path={mdiFileCabinet} size={iconSize} color={iconColor} />
                </IconButton>
              </Tooltip>
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
          <PerfectScrollbar>   
            <List dense={true}>
              <ListItem button onClick={() => this.showAppBar()}>
                <ListItemIcon><MenuIcon /></ListItemIcon>
                <ListItemText primary='Tool Bar' />
              </ListItem>    
              <ListItem button onClick={() => this.toggleFileManager()}>
                <ListItemIcon><Icon path={mdiFileCabinet} size={iconSize} color={iconColor} /></ListItemIcon>
                <ListItemText classes={primaryClass} primary='File Manager' />
              </ListItem>      
              
              <ListItem button onClick={() => this.toggleOpenMenu()}>
                <ListItemIcon><Icon path={mdiFolderMultiple} size={iconSize} color={iconColor} /></ListItemIcon>
                <ListItemText classes={primaryClass} primary='Open ...' />
                {openMenu ? <ExpandLess /> : <ExpandMore />}
              </ListItem>                    
              <Collapse in={openMenu} timeout="auto" unmountOnExit>
                <List dense={true} component="div">
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.showFileOpen()}>
                    <ListItemIcon><Icon path={mdiFolder} size={'1.0rem'} color={iconColor} /></ListItemIcon>
                    <ListItemText classes={primaryClass} 
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-20px'}}>File</Typography>
                      } />
                  </ListItem>
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.showOpenUrl()}>
                    <ListItemIcon><Icon path={mdiWeb} size={'1.0rem'} color={iconColor} /></ListItemIcon>
                    <ListItemText classes={primaryClass} 
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-20px'}}>URL</Typography>
                      } />
                  </ListItem>
                  { isInputDirSupported() && !isMobile?
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.showOpenFolder()}>
                    <ListItemIcon><Icon path={mdiFolderOpen} size={'1.0rem'} color={iconColor} /></ListItemIcon>
                    <ListItemText classes={primaryClass} 
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-20px'}}>Folder</Typography>
                      } />
                  </ListItem>    
                  : null }                     
                  { isInputDirSupported() && !isMobile?
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.showOpenDicomdir()}>
                    <ListItemIcon><Icon path={mdiFolderOpen} size={'1.0rem'} color={iconColor} /></ListItemIcon>
                    <ListItemText classes={primaryClass} 
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-20px'}}>DICOMDIR</Typography>
                      } />
                  </ListItem>    
                  : null }                                          
                </List>
              </Collapse>  

              <ListItem button onClick={() => this.clear()}>
                <ListItemIcon><Icon path={mdiDelete} size={iconSize} color={iconColor} /></ListItemIcon>
                <ListItemText classes={primaryClass} primary='Clear All' />
              </ListItem>  
              <ListItem button onClick={this.handleLayout}>
                <ListItemIcon><Icon path={mdiViewGridPlusOutline} size={iconSize} color={iconColor} /></ListItemIcon>
                <ListItemText classes={primaryClass} primary='Layout' />              
              </ListItem>   
              <ListItem button onClick={() => this.showSettings()}>
                <ListItemIcon><Icon path={mdiCog} size={iconSize} color={iconColor} /></ListItemIcon>
                <ListItemText classes={primaryClass} primary='Settings' />
              </ListItem>                
              <Divider />
              <ListItem button onClick={() => this.toggleToolbox()} disabled={!isOpen}>
                <ListItemIcon><Icon path={mdiChartHistogram} size={iconSize} color={iconColor} /></ListItemIcon>
                <ListItemText classes={primaryClass} primary='Histogram' />
              </ListItem>  
              <ListItem button onClick={() => this.toggleMpr()} disabled={!isOpen || this.mprPlane === ''}>
                <ListItemIcon><Icon path={mdiAxisArrow} size={iconSize} color={iconColor} /></ListItemIcon>
                <ListItemText classes={primaryClass} primary='MPR' />
                {mprMenu ? <ExpandLess /> : <ExpandMore />}
              </ListItem>            

              <Collapse in={mprMenu} timeout="auto" unmountOnExit>
                <List dense={true} component="div">
{/* 
                  <ListItem button style={{paddingLeft: 40}} onClick={() => this.mpr3D()}>
                    {visibleMpr3D ? <ListItemIcon style={{marginLeft: '-10px'}}><Icon path={mdiCheck} size={'1.0rem'} color={iconColor} /></ListItemIcon> : null}
                    <ListItemText 
                      style={visibleMpr3D ? {marginLeft: '-7px'} : {marginLeft: '40px'}}
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-23px'}}>3D</Typography>
                      } />
                  </ListItem>
*/}
                  <ListItem button style={{paddingLeft: 40}} onClick={() => this.mprOrthogonal()}>
                    {visibleMprOrthogonal ? <ListItemIcon style={{marginLeft: '-10px'}}><Icon path={mdiCheck} size={'1.0rem'} color={iconColor} /></ListItemIcon> : null}
                    <ListItemText 
                      style={visibleMprOrthogonal ? {marginLeft: '-7px'} : {marginLeft: '40px'}}
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-23px'}}>Orthogonal</Typography>
                      } />
                  </ListItem>
                  <ListItem button style={{paddingLeft: 40}} onClick={() => this.mprCoronal()}>
                    {visibleMprCoronal ? <ListItemIcon style={{marginLeft: '-10px'}}><Icon path={mdiCheck} size={'1.0rem'} color={iconColor} /></ListItemIcon> : null}
                    <ListItemText 
                      style={visibleMprCoronal ? {marginLeft: '-7px'} : {marginLeft: '40px'}}
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-23px'}}>Coronal</Typography>
                      } />
                  </ListItem>    
                  <ListItem button style={{paddingLeft: 40}} onClick={() => this.mprSagittal()}>
                    {visibleMprSagittal ? <ListItemIcon style={{marginLeft: '-10px'}}><Icon path={mdiCheck} size={'1.0rem'} color={iconColor} /></ListItemIcon> : null}  
                    <ListItemText 
                      style={visibleMprSagittal ? {marginLeft: '-7px'} : {marginLeft: '40px'}}
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-23px'}}>Sagittal</Typography>
                      } />
                  </ListItem>    
                  <ListItem button style={{paddingLeft: 40}} onClick={() => this.mprAxial()}>
                    {visibleMprAxial ? <ListItemIcon style={{marginLeft: '-10px'}}><Icon path={mdiCheck} size={'1.0rem'} color={iconColor} /></ListItemIcon> : null}  
                    <ListItemText 
                      style={visibleMprAxial ? {marginLeft: '-7px'} : {marginLeft: '40px'}}
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-23px'}}>Axial</Typography>
                      } />
                  </ListItem>                                               
                </List>
              </Collapse>  

              <ListItem button onClick={() => this.toggleImageEdit()} disabled={!isOpen}>
                <ListItemIcon><Icon path={mdiImageEdit} size={iconSize} color={iconColor} /></ListItemIcon>
                <ListItemText classes={primaryClass} primary='Edit' />
                {openImageEdit ? <ExpandLess /> : <ExpandMore />}
              </ListItem>          
              <Collapse in={openImageEdit} timeout="auto" unmountOnExit>
                <List dense={true} component="div">
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('Invert')}>
                    <ListItemIcon><Icon path={mdiInvertColors} size={iconSize} color={iconColor} /></ListItemIcon>
                    <ListItemText classes={primaryClass} primary="Invert" />
                  </ListItem>
                </List>
              </Collapse>   
              <ListItem button onClick={() => this.toggleTools()} disabled={!isOpen}>
                <ListItemIcon><Icon path={mdiTools} size={iconSize} color={iconColor} /></ListItemIcon>
                <ListItemText classes={primaryClass} primary='Tools' />
                {openTools ? <ExpandLess /> : <ExpandMore />}
              </ListItem>   
              <Collapse in={openTools} timeout="auto" unmountOnExit>
                <List dense={true} component="div">
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('notool')} disabled={!isOpen}>
                    <ListItemIcon><Icon path={mdiCursorDefault} size={iconSizeSmall} color={this.colorIcon('notool')} /></ListItemIcon>
                    <ListItemText classes={primaryClass} 
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-23px'}}>No Tool</Typography>
                      }
                    />
                  </ListItem>     
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('referencelines')} disabled={!isOpen}>
                    <ListItemIcon><Icon path={mdiArrowSplitHorizontal} size={iconSizeSmall} color={visibleReferenceLines ? activeColor : iconColor} /></ListItemIcon>
                    <ListItemText classes={primaryClass}
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-23px'}}>Reference Lines</Typography>
                      }
                    />
                  </ListItem>        
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('serieslink')} disabled={!isOpen}>
                    <ListItemIcon><Icon path={mdiVectorLink} size={iconSizeSmall} color={visibleSeriesLink ? activeColor : iconColor} /></ListItemIcon>
                    <ListItemText classes={primaryClass}
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-23px'}}>Link Series</Typography>
                      }
                    />
                  </ListItem>                               
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('Wwwc')} disabled={!isOpen}>
                    <ListItemIcon><Icon path={mdiArrowAll} size={iconSize} color={this.colorIcon('Wwwc')} /></ListItemIcon>
                    <ListItemText classes={primaryClass}
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-23px'}}>WW/WC</Typography>
                      }
                    />
                  </ListItem>  
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('Pan')} disabled={!isOpen}>
                    <ListItemIcon><Icon path={mdiCursorPointer} size={iconSize} color={this.colorIcon('Pan')} /></ListItemIcon>
                    <ListItemText classes={primaryClass} 
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-23px'}}>Pan</Typography>
                      } 
                    />
                  </ListItem>  
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('Zoom')} disabled={!isOpen}>
                    <ListItemIcon><Icon path={mdiMagnify} size={iconSize} color={this.colorIcon('Zoom')} /></ListItemIcon>
                    <ListItemText classes={primaryClass} 
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-23px'}}>Zoom</Typography>
                      } 
                    />
                  </ListItem>      
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('Magnify')} disabled={!isOpen}>
                    <ListItemIcon><Icon path={mdiCheckboxIntermediate} size={iconSize} color={this.colorIcon('Magnify')} /></ListItemIcon>
                    <ListItemText classes={primaryClass} 
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-23px'}}>Magnify</Typography>
                      } 
                    />
                  </ListItem>       
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('Length')} disabled={!isOpen}>
                    <ListItemIcon><Icon path={mdiRuler} size={iconSize} color={this.colorIcon('Length')} /></ListItemIcon>
                    <ListItemText classes={primaryClass} 
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-23px'}}>Length</Typography>
                      }  
                    />
                  </ListItem>        
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('Probe')} disabled={!isOpen}>
                    <ListItemIcon><Icon path={mdiEyedropper} size={iconSize} color={this.colorIcon('Probe')} /></ListItemIcon>
                    <ListItemText classes={primaryClass} 
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-23px'}}>Probe</Typography>
                      } 
                    />
                  </ListItem> 
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('Angle')} disabled={!isOpen}>
                    <ListItemIcon><Icon path={mdiAngleAcute} size={iconSize} color={this.colorIcon('Angle')} /></ListItemIcon>
                    <ListItemText classes={primaryClass} 
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-23px'}}>Angle</Typography>
                      }  
                    />
                  </ListItem>  
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('EllipticalRoi')} disabled={!isOpen}>
                    <ListItemIcon><Icon path={mdiEllipse} size={iconSize} color={this.colorIcon('EllipticalRoi')} /></ListItemIcon>
                    <ListItemText classes={primaryClass} 
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-23px'}}>Elliptical Roi</Typography>
                      } 
                    />
                  </ListItem>     
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('RectangleRoi')} disabled={!isOpen}>
                    <ListItemIcon><Icon path={mdiRectangle} size={iconSize} color={this.colorIcon('RectangleRoi')} /></ListItemIcon>
                    <ListItemText classes={primaryClass} 
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-23px'}}>Rectangle Roi</Typography>
                      } 
                    />
                  </ListItem> 
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('FreehandRoi')} disabled={!isOpen}>
                    <ListItemIcon><Icon path={mdiGesture} size={iconSize} color={this.colorIcon('FreehandRoi')} /></ListItemIcon>
                    <ListItemText classes={primaryClass} 
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-23px'}}>Freehand Roi</Typography>
                      } 
                    />
                  </ListItem> 
                </List>
              </Collapse> 

            </List>
            
            { this.isMultipleFiles || mprMenu ?
              <div>     
                <Divider />     
                <div align='center'>
                  <IconButton onClick={this.listOpenFilesFirstFrame} size='small'>
                    <Icon path={mdiSkipBackward} size={'1.0rem'} color={iconColor} />
                  </IconButton>
                  <IconButton onClick={this.listOpenFilesPreviousFrame} size='small'>
                      <Icon path={mdiSkipPrevious} size={'1.0rem'} color={iconColor} />
                  </IconButton>
                  <IconButton onClick={this.listOpenFilesScrolling} size='small'>
                    <Icon path={this.state.listOpenFilesScrolling ? mdiPause : mdiPlay} size={'1.0rem'} color={iconColor} />
                  </IconButton>
                  <IconButton onClick={this.listOpenFilesNextFrame} size='small'>
                      <Icon path={mdiSkipNext} size={'1.0rem'} color={iconColor} />
                  </IconButton>
                  <IconButton onClick={this.listOpenFilesLastFrame} size='small'>
                      <Icon path={mdiSkipForward} size={'1.0rem'} color={iconColor} />
                  </IconButton>                
                </div>  
                <div style={{textAlign: 'center'}}>
                  <Typography type="body1" style={{fontSize: '0.80em'}}>{`${this.state.sliceIndex+1} / ${sliceMax}`}</Typography>
                </div>  
                <div style={{width: '130px', margin: 'auto'}}>
                  <Slider
                    style={{marginTop: '-4px'}}
                    value={this.state.sliceIndex}
                    onChange={this.handleSliceChange}
                    color="secondary"
                    min={0}
                    max={sliceMax-1}
                    step={100/sliceMax}
                  />
                </div>
              </div> : null
            }

          </PerfectScrollbar>   
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
                <Icon path={mdiContentSaveOutline} size={iconSize} color={iconColor} />
              </IconButton>
              <IconButton color="inherit" onClick={this.clearMeasure} edge="end">
                <Icon path={mdiTrashCanOutline} size={iconSize} color={iconColor} />
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
              { isOpen ? <Histogram key={dcmViewer.filename} /> : null } 
            </div>
          </div>
        </Drawer>          

        <Drawer
          variant="persistent"
          anchor={getSettingsDicomdirView()}
          open={visibleDicomdir}
          onClose={this.toggleDicomdir}
        >
          <div>
            <div>  
              {visibleDicomdir ? <Dicomdir onOpenFile={this.handleOpenFileDicomdir} onOpenFs={this.handleOpenSandboxFs} /> : null} 
            </div>
          </div>
        </Drawer>   

        <Drawer
          variant="persistent"
          anchor={getSettingsFsView()}
          open={visibleFileManager}
          onClose={this.toggleFileManager}
        >
          <div>
            <div>
              {visibleFileManager ? 
                <FsUI 
                  onOpen={this.handleOpenSandboxFs} 
                  onOpenImage={this.handleOpenImage} 
                  onOpenMultipleFilesCompleted={this.openMultipleFilesCompleted}
                  onOpenDicomdir={this.handleOpenFsDicomdir} 
                  color={iconColor} 
                /> 
              : null}
            </div>
          </div>
        </Drawer>       

        {visibleSettings ? <Settings onClose={this.hideSettings}/> : null}

        {visibleAbout ? <AboutDlg onClose={this.showAbout}/> : null}

        {visibleDownloadZipDlg ? <DownloadZipDlg onClose={this.hideDownloadZipDlg} url={this.url} /> : null}

        {visibleOpenMultipleFilesDlg ? <OpenMultipleFilesDlg onClose={this.hideOpenMultipleFilesDlg} files={this.files} origin={'local'} /> : null}

        <Dialog
            open={visibleClearMeasureDlg}
            onClose={this.hideClearMeasureDlg}
        >
            <DialogTitle>{"Are you sure to remove all the measurements?"}</DialogTitle>
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
            open={visibleZippedFileDlg}
            onClose={this.hideZippedFileDlg}
        >
            <DialogTitle>{"This is a zipped file, would you import into sandbox file system?"}</DialogTitle>
            <DialogActions>
                <Button onClick={this.hideZippedFileDlg}>
                    Cancel
                </Button>
                <Button onClick={this.confirmZippedFileDlg} autoFocus>
                    Ok
                </Button>
            </DialogActions>
        </Dialog>

        <Dialog
            open={this.state.visibleOpenUrl}
        >
            <DialogTitle>{"Open URL"}</DialogTitle>
              <DialogContent>
                <DialogContentText>
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

        <Dialog
            open={this.state.visibleMessage}
        >
            <DialogTitle>{this.state.titleMessage}</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  {this.state.textMessage}
                </DialogContentText>
              </DialogContent>
            <DialogActions>
                <Button onClick={() => this.setState({visibleMessage: false})} >
                    Cancel
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
        
        <Popover
          id={'id-tools'}
          open={visibleToolsPanel}
          anchorEl={this.state.anchorElToolsPanel}
          onClose={this.closeToolsPanel}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
        >
          <ToolsPanel 
            toolActive={this.state.toolActive}
            referenceLines={visibleReferenceLines}
            seriesLink={visibleSeriesLink}
            toolExecute={this.toolExecute}
            onChange={this.changeLayout}
          />  
        </Popover>               

        <Snackbar
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          open={visibleVolumeBuilding}
          autoHideDuration={6000}
          message="Volume building, wait please ..."
        />

        <div style={{height: 'calc(100vh - 48px)'}}>
          {this.buildLayoutGrid()}  
        </div>

        <Drawer
          variant="persistent"
          anchor='right'
          open={visibleExplorer}
          onClose={this.toggleExplorer}
        >
          <div>
            <div>
              {visibleExplorer ? 
                <Explorer 
                  explorer={this.explorer}
                  onSelectSeries={this.explorerOnSelectSeries}
                  color={iconColor} 
                /> 
              : null}
            </div>
          </div>
        </Drawer>   

        <div>
          <input
            type="file"
            id="file_open"
            style={{ display: "none" }}
            ref={this.fileOpen}
            onChange={e => this.handleOpenLocalFs(e.target.files)}
            multiple
          />
        </div>

        <div>
          <input
            type="file"
            id="file_dicomdir"
            style={{ display: "none" }}
            ref={this.openDicomdir}
            onChange={e => this.handleOpenDicomdir(e.target.files)}
            webkitdirectory="" mozdirectory="" directory="" multiple
          />
        </div>

        <div>
          <input
            type="file"
            id="file_folder"
            style={{ display: "none" }}
            ref={this.openFolder}
            onChange={e => this.handleOpenFolder(e.target.files)}
            webkitdirectory="" mozdirectory="" directory="" multiple
          />
        </div>    

      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    localFileStore: state.localFileStore,
    //allFiles: state.allFiles,
    files: state.files,
    series: state.series,
    isOpen: state.isOpen,
    tool: state.tool,
    activeDcmIndex: state.activeDcmIndex,
    explorerActivePatientIndex: state.explorerActivePatientIndex,
    explorerActiveStudyIndex: state.explorerActiveStudyIndex,
    explorerActiveSeriesIndex: state.explorerActiveSeriesIndex,
    measurements: state.measurements,
    layout: state.layout,
    dicomdir: state.dicomdir,
    fsZippedFile: state.fsZippedFile,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    clearingStore: () => dispatch(clearStore()),
    setLocalFileStore: (file) => dispatch(localFileStore(file)),
    toolStore: (tool) => dispatch(dcmTool(tool)),
    isOpenStore: (value) => dispatch(dcmIsOpen(value)),
    setActiveDcm: (dcm) => dispatch(activeDcm(dcm)),
    setActiveDcmIndex: (index) => dispatch(activeDcmIndex(index)),
    setActiveMeasurements: (measurements) => dispatch(activeMeasurements(measurements)),
    setLayoutStore: (row, col) => dispatch(setLayout(row, col)),
    setDicomdirStore: (dicomdir) => dispatch(setDicomdir(dicomdir)),
    setFsZippedFile: (file) => dispatch(setZippedFile(file)),
    setVolumeStore: (file) => dispatch(setVolume(file)),
    setFilesStore: (files) => dispatch(filesStore(files)),
    setExplorerActiveSeriesIndex: (index) => dispatch(explorerActiveSeriesIndex(index)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(App))
