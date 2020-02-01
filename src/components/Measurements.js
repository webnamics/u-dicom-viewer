import React, { PureComponent } from 'react'
import {connect} from 'react-redux'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogTitle from '@material-ui/core/DialogTitle'
import MeasureItem from './MeasureItem'

class Measurements extends PureComponent {

  state = { 
    visibleClearMeasureDlg: false,
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

  render() {   
    //const classes = this.props.classes

    return (
      <div>

        <div>
          { this.props.measurements !== null ?
              this.props.measurements.map((item, index) => {
                  return <MeasureItem item={item} index={index} toolRemove={this.props.toolRemove} key={index} />
              }) 
            : null }
        </div>
        
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

      </div>
    )
  }

}

const mapStateToProps = (state) => {
  return {
    measurements: state.measurements,
  }
}

export default connect(mapStateToProps)(Measurements)
