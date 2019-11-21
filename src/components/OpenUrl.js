import React, { PureComponent } from 'react'
//import { Button, TextField, Toolbar } from 'react-md'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Toolbar from '@material-ui/core/Toolbar'

const styleUrl = {
    position: "relative",
    width: "98%"
}

const styleText = {
    width: "90%",
    padding: "15px"
}

const styleButton = {
    position: "absolute",
    right: "0px",
    top: "12px",
}

// http://medistim.com/wp-content/uploads/2016/07/bmode.dcm
// https://raw.githubusercontent.com/cornerstonejs/cornerstoneWADOImageLoader/master/testImages/CT2_J2KR
// http://www.lodevelop.it/download/bmode.dcm

class OpenUrl extends PureComponent {
    constructor(props) {
        super(props)
        this.urlField = React.createRef()
      }

    onClick = () => {
        this.props.onClose(true, this.urlField.current.value)
    }

    render() {
        return (
            <div className="md-grid">
                <Toolbar
                    fixed
                    nav={<Button icon onClick={() => this.props.onClose(false)}>close</Button>}
                    title={'Open URL'}
                />
                <div style={styleUrl}>
                    <TextField 
                        fullWidth 
                        id="idUrl" 
                        ref={this.urlField} 
                        placeholder="URL" 
                        style={styleText} 
                        value='' />
                    <Button 
                        icon
                        style={styleButton} 
                        onClick={this.onClick}>get_app</Button>
                </div>

            </div>
        )
    }
}

export default OpenUrl
