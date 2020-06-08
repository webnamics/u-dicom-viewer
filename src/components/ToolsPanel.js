import React, { PureComponent } from 'react'
import Icon from '@mdi/react'
import IconButton from '@material-ui/core/IconButton'
import Tooltip from '@material-ui/core/Tooltip'

import { 
    mdiAngleAcute,
    mdiArrowAll,
    mdiArrowSplitHorizontal,
    mdiCheckboxIntermediate,
    mdiCursorDefault, 
    mdiCursorPointer,
    mdiEllipse,
    mdiEyedropper,
    mdiGesture,
    mdiMagnify,
    mdiRectangle,
    mdiRuler,
    mdiVectorLink,
  } from '@mdi/js'

const styleTable = {
  borderCollapse: 'collapse',
  width: '120px',
  height: '120px',
}

const styleTableTd = {
  width: '40px',
  height: '40px',
  padding: '3px',
  //border: 'solid 1px black',
}

const iconSize = '1.2rem'
const iconColor = '#FFFFFF'
const activeColor = 'rgba(0, 255, 0, 1.0)'

class ToolsPanel extends PureComponent {
    constructor(props) {
      super(props)
      this.tableRef = React.createRef()
    }

    componentDidMount() {
      
    }

    colorIcon = (tool) => {
        return this.props.toolActive === tool ? activeColor : iconColor
    }
    
    render() {  
      return (
        <div>            
            <table style={styleTable} ref={this.tableRef}>
                <tbody>
                <tr>
                    <td style={styleTableTd}>
                        <Tooltip title="No Tool">
                            <IconButton color="inherit" onClick={() => this.props.toolExecute('notool')}>
                                <Icon path={mdiCursorDefault} size={iconSize} color={this.colorIcon('notool')} />
                            </IconButton>
                        </Tooltip>
                    </td>
                    <td style={styleTableTd}>
                        <Tooltip title="Reference Lines">
                            <IconButton color="inherit" onClick={() => this.props.toolExecute('referencelines')}>
                                <Icon path={mdiArrowSplitHorizontal} size={iconSize} color={this.props.referenceLines ? activeColor : iconColor} />
                            </IconButton>
                        </Tooltip>
                    </td>
                    <td style={styleTableTd}>
                        <Tooltip title="Link Series">
                            <IconButton color="inherit" onClick={() => this.props.toolExecute('serieslink')}>
                                <Icon path={mdiVectorLink} size={iconSize} color={this.props.seriesLink ? activeColor : iconColor} />
                            </IconButton>
                        </Tooltip>
                    </td>                    
                </tr>   
                <tr>
                    <td style={styleTableTd}>
                        <Tooltip title="WW/WC">
                            <IconButton color="inherit" onClick={() => this.props.toolExecute('Wwwc')}>
                                <Icon path={mdiArrowAll} size={iconSize} color={this.colorIcon('Wwwc')} />
                            </IconButton>
                        </Tooltip>
                    </td>    
                    <td style={styleTableTd}>
                        <Tooltip title="Pan">
                            <IconButton color="inherit" onClick={() => this.props.toolExecute('Pan')}>
                                <Icon path={mdiCursorPointer} size={iconSize} color={this.colorIcon('Pan')} />
                            </IconButton>
                        </Tooltip>
                    </td>
                    <td style={styleTableTd}>
                        <Tooltip title="Zoom">
                            <IconButton color="inherit" onClick={() => this.props.toolExecute('Zoom')}>
                                <Icon path={mdiMagnify} size={iconSize} color={this.colorIcon('Zoom')} />
                            </IconButton>
                        </Tooltip>
                    </td>                                    
                </tr>                   
                <tr>
                    <td style={styleTableTd}>
                        <Tooltip title="Magnify">
                            <IconButton color="inherit" onClick={() => this.props.toolExecute('Magnify')}>
                                <Icon path={mdiCheckboxIntermediate} size={iconSize} color={this.colorIcon('Magnify')} />
                            </IconButton>
                        </Tooltip>
                    </td>   
                    <td style={styleTableTd}>
                        <Tooltip title="Length">
                            <IconButton color="inherit" onClick={() => this.props.toolExecute('Length')}>
                                <Icon path={mdiRuler} size={iconSize} color={this.colorIcon('Length')} />
                            </IconButton>
                        </Tooltip>
                    </td>
                    <td style={styleTableTd}>
                        <Tooltip title="Probe">
                            <IconButton color="inherit" onClick={() => this.props.toolExecute('Probe')}>
                                <Icon path={mdiEyedropper} size={iconSize} color={this.colorIcon('Probe')} />
                            </IconButton>
                        </Tooltip>
                    </td>                    
                </tr> 
                <tr>
                    <td style={styleTableTd}>
                        <Tooltip title="Angle">
                            <IconButton color="inherit" onClick={() => this.props.toolExecute('Angle')}>
                                <Icon path={mdiAngleAcute} size={iconSize} color={this.colorIcon('Angle')} />
                            </IconButton>
                        </Tooltip>
                    </td>   
                    <td style={styleTableTd}>
                        <Tooltip title="Elliptical Roi">
                            <IconButton color="inherit" onClick={() => this.props.toolExecute('EllipticalRoi')}>
                                <Icon path={mdiEllipse} size={iconSize} color={this.colorIcon('EllipticalRoi')} />
                            </IconButton>
                        </Tooltip>
                    </td>
                    <td style={styleTableTd}>
                        <Tooltip title="Rectangle Roi">
                            <IconButton color="inherit" onClick={() => this.props.toolExecute('RectangleRoi')}>
                                <Icon path={mdiRectangle} size={iconSize} color={this.colorIcon('RectangleRoi')} />
                            </IconButton>
                        </Tooltip>
                    </td>                    
                </tr> 
                <tr>
                    <td style={styleTableTd}>
                        <Tooltip title="Freehand Roi">
                            <IconButton color="inherit" onClick={() => this.props.toolExecute('FreehandRoi')}>
                                <Icon path={mdiGesture} size={iconSize} color={this.colorIcon('FreehandRoi')} />
                            </IconButton>
                        </Tooltip>
                    </td>  
                </tr>                                                               
                </tbody>
            </table>
        </div>     
      )
    }

}

export default ToolsPanel
