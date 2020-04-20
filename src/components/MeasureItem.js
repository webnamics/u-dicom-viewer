import React, { PureComponent } from 'react'
import {connect} from 'react-redux'
import Button from '@material-ui/core/Button'
import CreateIcon from '@material-ui/icons/Create'
import DeleteIcon from '@material-ui/icons/Delete'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import IconButton from '@material-ui/core/IconButton'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import TextField from '@material-ui/core/TextField'
import Toolbar from '@material-ui/core/Toolbar'
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
    listItemText:{
        fontSize:'0.9em',
    }
})

class MeasureItem extends PureComponent {

    constructor(props) {
        super(props)
        this.noteField = React.createRef()
    
      }

    state = { 
        visibleDlgNote: false,
        visibleDlgDelete: false,
    }

    showDlgNote = () => {
        this.setState({ visibleDlgNote: true })
    }
    
    hideDlgNote = () => {
        this.setState({ visibleDlgNote: false })
    }

    showDlgDelete = () => {
        this.setState({ visibleDlgDelete: true })
    }
    
    hideDlgDelete = () => {
        this.setState({ visibleDlgDelete: false })
    }

    handleOnChangeNote = event => {
        this.setState({ note: event.target.value })
    }

    confirmNote = (index) => {
        this.hideDlgNote()
        this.props.measurements[index].note = this.noteField.value
    }   

    confirmDelete = (index) => {
        this.hideDlgDelete()
        this.props.toolRemove(index)
    }

    onEdit = () => {
        this.showDlgNote()
    }
    
    onDelete = () => {
        this.showDlgDelete()
    }
    
    render() {    
        const { classes } = this.props

        const item = this.props.item
        let index = this.props.index
        let pText = ''
        let sText = ''
        //console.log('item: ', item)
        switch (item.tool) {
            case 'Length':
                pText = `${item.data.length.toFixed(2)} ${item.data.unit}`
                sText = item.note
                break
            case 'Angle':
                pText = `${item.data.rAngle} °`
                sText = item.note
                break
            case 'EllipticalRoi':
                pText = <div>
                            <div> A: {item.data.cachedStats.area.toFixed(2)} mm² </div>
                            <div> M: {item.data.cachedStats.mean.toFixed(2)} {item.data.unit} </div>
                            <div> SD: {item.data.cachedStats.stdDev.toFixed(2)} {item.data.unit} </div>
                        </div>
                sText = item.note            
                break    
            case 'RectangleRoi':
                pText = <div>
                            <div> A: {item.data.cachedStats.area.toFixed(2)} mm² </div>
                            <div> M: {item.data.cachedStats.mean.toFixed(2)} {item.data.unit} </div>
                            <div> SD: {item.data.cachedStats.stdDev.toFixed(2)} {item.data.unit} </div>
                        </div>
                sText = item.note
                break          
            case 'FreehandRoi':
                //console.log('item: ', item.data.area)
                //if (item.data.area !== undefined) {
                pText = <div>
                            <div> A: {item.data.area.toFixed(2)} mm² </div>
                            <div> M: {item.data.meanStdDev.mean.toFixed(2)} {item.data.unit} </div>
                            <div> SD: {item.data.meanStdDev.stdDev.toFixed(2)} {item.data.unit} </div>
                        </div>
                sText = item.note
                //}
                break                                  
            default:
                break    
        }

        return (
            <div>
                <ListItem>
                    <ListItemText classes={{primary:classes.listItemText}} primary={pText} secondary={sText} />
                    <Toolbar>
                        <IconButton edge="end" onClick={() => this.onEdit(index)}>
                            <CreateIcon />
                        </IconButton>
                        <IconButton edge="end" onClick={() => this.onDelete(index)}>
                            <DeleteIcon />
                        </IconButton>
                    </Toolbar>
                </ListItem>
                
                { this.state.visibleDlgNote ?
                    <Dialog
                        open={this.state.visibleDlgNote}
                        onClose={this.hideDlgNote}
                        aria-labelledby="form-dialog-title"
                    >
                        <DialogTitle id="form-dialog-title">{"Note for measurement:"}</DialogTitle>
                        <DialogContent>
                            <TextField
                                ref="noteField"
                                autoFocus
                                margin="dense"
                                id="note"
                                fullWidth
                                defaultValue={this.props.measurements[index].note}
                                inputRef={input => (this.noteField = input)}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={this.hideDlgNote} >
                                Cancel
                            </Button>
                            <Button onClick={() => this.confirmNote(index)} autoFocus>
                                Ok
                            </Button>
                        </DialogActions>
                    </Dialog>
                : null }

                <Dialog
                    open={this.state.visibleDlgDelete}
                    onClose={this.hideDlgNote}
                    aria-labelledby="alert-dialog-title"
                >
                    <DialogTitle id="alert-dialog-title">{"Are you sure to delete the measurement?"}</DialogTitle>
                    <DialogActions>
                        <Button onClick={this.hideDlgDelete}>
                            Cancel
                        </Button>
                        <Button onClick={() => this.confirmDelete(index)} autoFocus>
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

//export default connect(mapStateToProps, )(MeasureItem)
export default connect(mapStateToProps)(withStyles(styles)(MeasureItem))
