import React, { PureComponent } from 'react'
import { Button, DialogContainer, LinearProgress } from 'react-md'

class OpenUrlDlg extends PureComponent {

  hide = () => {
    this.props.onClose()
  }

  cancel = () => {
    window.stop()
    this.hide()
  }

  render() {
    const actions = [];
    actions.push(<Button flat onClick={this.cancel}>Cancel</Button>)
    //actions.push(<Button flat onClick={this.hide}>Ok</Button>)

    return (
      <div>
        <DialogContainer
          modal={true}
          id="simple-action-dialog"
          visible={true}
          onHide={this.hide}
          actions={actions}
          title="Downloading file ..."
        >
          <LinearProgress id="file-upload-progress" value={this.props.progress} determinate />
        </DialogContainer>
      </div>
    )
  }
}

export default OpenUrlDlg
