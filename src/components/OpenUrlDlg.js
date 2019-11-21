import React, { PureComponent } from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import LinearProgress from '@material-ui/core/LinearProgress'

class OpenUrlDlg extends PureComponent {

  hide = () => {
    this.props.onClose()
  }

  cancel = () => {
    window.stop()
    this.hide()
  }

  render() {
    return (
      <div>
        <Dialog
            open={true}
            onClose={this.hide}
            aria-labelledby="alert-dialog-title"
        >
            <DialogTitle id="alert-dialog-title">{"Downloading file ..."}</DialogTitle>
            <DialogContent>
              <LinearProgress variant="determinate" value={this.props.progress} color='secondary' />
            </DialogContent>
            <DialogActions>
                <Button onClick={this.cancel}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
      </div>
    )
  }
}

export default OpenUrlDlg
