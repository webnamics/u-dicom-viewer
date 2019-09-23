import React, { PureComponent } from 'react'
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup'
//import { withRouter } from 'react-router'
//import { Link, Route, Switch } from 'react-router-dom'
import { Button, Drawer, Toolbar } from 'react-md'
import { FontIcon } from 'react-md'
//import { SVGIcon } from 'react-md'
import {connect} from 'react-redux'
import DicomViewer from './components/dicomviewer'
import HeaderItem from './components/HeaderItem'
import Settings from './components/Settings'
import OpenUrl from './components/OpenUrl'
import { SETTINGS_DCMHEADER } from './constants/settings'
import { toCsv } from './functions'
import {deviceDetect} from 'react-device-detect'
//import OpenUrlDlg from './components/OpenUrlDlg'
import {dcmTool} from './actions/index'
//import { GiArrowCursor } from 'react-icons/gi'
import Icon from '@mdi/react'
import { mdiCursorDefault, mdiFileDocument } from '@mdi/js'

import './App.css';

const iconColor = '#BDBDBD'
let iconTool = null

class App extends PureComponent {

  constructor(props) {
    super(props);
    this.file = null;
    this.fileOpen = React.createRef();
    this.showFileOpen = this.showFileOpen.bind(this);
    
  }

  menuListItems = [
    {
      key: 'openfile',
      primaryText: 'Open File ...',
      leftIcon: <FontIcon>folder</FontIcon>,
      onClick: () => {this.showFileOpen()},
    }, {
      key: 'openurl',
      primaryText: 'Open URL ...',
      leftIcon: <FontIcon>cloud</FontIcon>,
      onClick: () => {this.showOpenUrl()},
    }, {
      key: 'clear',
      primaryText: 'Clear',
      leftIcon: <FontIcon>clear</FontIcon>,
      onClick: () => {
        console.log('menu item clear ')
        this.runTool.runTool('clear')
      },
    }, { 
      key: 'divider', 
      divider: true 
    }, {
      key: 'notool',
      primaryText: 'No tool',
      leftIcon: <Icon path={mdiCursorDefault} size={'1.5rem'} color={iconColor} />,
      onClick: () => {
        iconTool = null
        this.toolExecute('notool')
      },
    }, {       
      key: 'wwwc',
      primaryText: 'WW/WC',
      leftIcon: <FontIcon>open_with</FontIcon>,
      onClick: () => {
        iconTool = 'open_with'
        this.toolExecute('wwwc')
      },
    }, {     
      key: 'pan',
      primaryText: 'Pan',
      leftIcon: <FontIcon>pan_tool</FontIcon>,
      onClick: () => {
        iconTool = 'pan_tool'
        this.toolExecute('pan')
      },
    }, {
      key: 'zoom',
      primaryText: 'Zoom',
      leftIcon: <FontIcon>search</FontIcon>,
      onClick: () => {
        iconTool = 'search'
        this.toolExecute('zoom')
      },
    }, {
      key: 'magnify',
      primaryText: 'Magnify',
      leftIcon: <FontIcon>image_search</FontIcon>,
      onClick: () => {
        iconTool = 'image_search'
        this.toolExecute('magnify')
      },
    }, {      
      key: 'length',
      primaryText: 'Length',
      leftIcon: <FontIcon>straighten</FontIcon>,
      onClick: () => {
        iconTool = 'straighten'
        this.toolExecute('length')
      },
    }, {
      key: 'probe',
      primaryText: 'Probe',
      leftIcon: <FontIcon>trip_origin</FontIcon>,
      onClick: () => {
        iconTool = 'trip_origin'
        this.toolExecute('probe')
      },
    }, {
      key: 'angle',
      primaryText: 'Angle',
      leftIcon: <FontIcon>share</FontIcon>,
      onClick: () => {
        iconTool = 'share'
        this.toolExecute('angle')
      },
    }, {
      key: 'ellipticalroi',
      primaryText: 'Elliptical Roi',
      leftIcon: <FontIcon>vignette</FontIcon>,
      onClick: () => {
        iconTool = 'vignette'
        this.toolExecute('ellipticalroi')
      },
    }, {
      key: 'rectangleroi',
      primaryText: 'Rectangle Roi',
      leftIcon: <FontIcon>branding_watermark</FontIcon>,
      onClick: () => {
        iconTool = 'branding_watermark'
        this.toolExecute('rectangleroi')
      },
    }, /*{      
      key: 'freehandroi',
      primaryText: 'Freehand',
      leftIcon: <FontIcon>gesture</FontIcon>,
      onClick: () => {
        iconTool = 'gesture'
        this.toolExecute('freehandroi')
      },
    }*/
  ]

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
    visibleMain: false,
    visibleHeader: false,
    visibleSettings: false,
    visibleToolbar: true,
    visibleOpenUrl: false,
    toolState: 1,
  }

  showFileOpen() {
    this.fileOpen.current.click()
  }

  handleChange = (filesSelected) => {
    const file = filesSelected[0];
	  console.log('handleChange, file: ', file);
    //this.props.onClick(this.file);
    //this.loadImage(this.file);
    this.runTool.runTool('openfile', file)
  }

  componentDidMount() {
    // Need to set the renderNode since the drawer uses an overlay
    this.dialog = document.getElementById('drawer-routing-example-dialog')
    console.log('deviceDetect: ', deviceDetect())
  }

  showDrawer = () => {
    this.setState({ visibleMain: true })
  }

  hideDrawer = () => {
    this.setState({ visibleMain: false })
  }

  handleVisibility = (visibleMain) => {
    this.setState({ visibleMain })
  }

  showHeader = () => {
    this.setState({ visibleHeader: true, position: 'right' });
  }

  hideHeader = () => {
    this.setState({ visibleHeader: false });
  }

  handleVisibilityHeader = (visibleHeader) => {
    this.setState({ visibleHeader });
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


  showSettings = () => {
    this.setState({ visibleDcm: false, visibleMain: false, visibleSettings: true, visibleToolbar: false, position: 'right' });
  }

  hideSettings = () => {
    this.setState({ visibleDcm: true, visibleSettings: false, visibleToolbar: true });
  }

  handleVisibilitySettings = (visibleSettings) => {
    this.setState({ visibleSettings });
  }


  showOpenUrl = () => {
    this.setState({ visibleDcm: false, visibleMain: false, visibleOpenUrl: true, visibleToolbar: false })
    //this.runTool.runTool('openurl', 'https://raw.githubusercontent.com/cornerstonejs/cornerstoneWADOImageLoader/master/testImages/CT2_J2KR')
  }

  hideOpenUrl = (openDlg, url) => {
    this.setState({ visibleDcm: true, visibleOpenUrl: false, visibleToolbar: true },
      (openDlg) => {
        return(openDlg ? this.runTool.runTool('openurl', url) : null)
      })
  }

/*  
  showOpenUrlDlg = () => {
    this.setState({ visibleOpenUrlDlg: true })
  }

  hideOpenUrlDlg = () => {
    this.setState({ visibleOpenUrlDlg: false })
  }
*/

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
    console.log('menu tool: ', tool)
    if (tool === 'notool') {
      this.setState({toolState: null})
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

  render() {
    const visibleDcm = this.state.visibleDcm
    const visibleMain = this.state.visibleMain
    const visibleHeader = this.state.visibleHeader
    const visibleSettings = this.state.visibleSettings
    const visibleToolbar = this.state.visibleToolbar
    const visibleOpenUrl = this.state.visibleOpenUrl
    //const visibleOpenUrlDlg = this.state.visibleOpenUrlDlg

    const titleHeader = 'Dicom Header'
    const closeBtn = <Button icon onClick={this.hideHeader}>{'close'}</Button>

    //const numberOfFrames = this.props.numberOfFrames
    //console.log('numberOfFrames: ', numberOfFrames)

    const toolState = this.state.toolState === 1

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
        <Toolbar 
          fixed 
          style={{ display: visibleToolbar === true ? '' : 'none'}}
          nav={<Button icon onClick={this.showDrawer}>menu</Button>} 
          actions={[
            this.props.tool !== null ? <Button icon primary={toolState} secondary={!toolState} onClick={this.toolChange}>{iconTool}</Button>: null,
            this.props.numberOfFrames > 1 ? <Button icon onClick={this.cinePlayer}>videocam</Button>: null,
            this.props.isOpen ? <Button icon primary onClick={this.resetImage}>refresh</Button> : null,
            this.props.isOpen ? <Button icon primary onClick={this.saveShot}>photo_camera</Button> : null,
            this.props.isOpen ? <Button icon primary onClick={this.showHeader}><Icon path={mdiFileDocument} size={'1.5rem'} color={iconColor} /></Button> : null,
          ]}
        />
        <CSSTransitionGroup
          component="div"
          transitionName="md-cross-fade"
          transitionEnterTimeout={300}
          transitionLeave={false}
          className="md-toolbar-relative md-grid"
        >
        </CSSTransitionGroup>
        <Drawer
          type={Drawer.DrawerTypes.TEMPORARY}
          visible={visibleMain}
          onVisibilityChange={this.handleVisibility}
          header={(
            <Toolbar title="U Dicom Viewer" 
              actions={[
                <Button icon onClick={this.showSettings}>settings_applications</Button>,
              ]}
            />
          )}
          renderNode={this.dialog}
          navItems={this.menuListItems} 
        />

        <Drawer
          type={Drawer.DrawerTypes.TEMPORARY}
          visible={visibleHeader}
          position='right'
          onVisibilityChange={this.handleVisibilityHeader}
          renderNode={this.dialog}
          navItems={this.props.header.map((item, index) => <HeaderItem name={item.name} value={item.value} key={index} />)} 
          header={(
            <Toolbar
              nav={closeBtn}
              actions={[
                <Button icon onClick={this.saveHeader}>save_alt</Button>,
              ]}
              title={titleHeader}
              className="md-divider-border md-divider-border--bottom"
            />
          )}
        />
        
        {visibleSettings ? <Settings onClose={this.hideSettings}/>: null}
        {visibleOpenUrl ? <OpenUrl onClose={this.hideOpenUrl}/>: null}

        <DicomViewer runTool={ref => (this.runTool = ref)} changeTool={ref => (this.changeTool = ref)} visible={visibleDcm} />
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
    header: state.header
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    toolStore: (tool) => dispatch(dcmTool(tool)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
