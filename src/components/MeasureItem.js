import React, { PureComponent } from 'react'
import { Button, DialogContainer, ListItem, TextField } from 'react-md'
import {connect} from 'react-redux'

const pStyle = {
    fontSize: '13px',
    textAlign: 'left'
}

const sStyle = {
    fontSize: '12px',
    textAlign: 'left'
}

class MeasureItem extends PureComponent {

    state = { 
        visibleDlgNote: false,
        visibleDlgDelete: false
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

    confirmNote = (index) => {
        this.hideDlgNote()
        let note = this.refs.noteField.value
        this.props.measure[index].note = note
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
        let item = this.props.item
        let index = this.props.index
        let pText = ''
        let sText = ''
        
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
                    <       div> SD: {item.data.cachedStats.stdDev.toFixed(2)} {item.data.unit} </div>
                        </div>
                sText = item.note
                break          
            case 'FreehandRoi':
                pText = <div>
                            <div> A: {item.data.area.toFixed(2)} mm² </div>
                            <div> M: {item.data.meanStdDev.mean.toFixed(2)} {item.data.unit} </div>
                    <       div> SD: {item.data.meanStdDev.stdDev.toFixed(2)} {item.data.unit} </div>
                        </div>
                sText = item.note
                break                                  
            default:
                break    
        }

        return (
            <div>
                <ListItem 
                    primaryText={pText}
                    secondaryText={sText}
                    threeLines
                    primaryTextStyle={pStyle}
                    secondaryTextStyle={sStyle}
                    renderChildrenOutside
                >
                    <Button icon primary onClick={() => this.onEdit(index)}>edit</Button>
                    <Button icon primary onClick={() => this.onDelete(index)}>delete</Button>
                </ListItem>
                <DialogContainer
                    id="note-dialog"
                    visible={this.state.visibleDlgNote}
                    onHide={this.hideDlgNote}
                    actions={[
                        <Button flat secondary onClick={this.hideDlgNote}>Cancel</Button>,
                        <Button flat primary onClick={() => this.confirmNote(index)}>Confirm</Button>,
                    ]}
                    title="Note for measurement"
                >
                    <TextField
                        id="note-dialog-field"
                        ref="noteField"
                        label=""
                        placeholder=""
                        defaultValue=""
                    />
                </DialogContainer>
                <DialogContainer
                    id="delete-dialog"
                    visible={this.state.visibleDlgDelete}
                    onHide={this.hideDlgDelete}
                    actions={[
                        <Button flat secondary onClick={this.hideDlgDelete}>No</Button>,
                        <Button flat primary onClick={() => this.confirmDelete(index)}>Yes</Button>,
                    ]}
                    title="Are you sure to delete the measurement?"
                />
            </div>
        )
    }
}
  
const mapStateToProps = (state) => {
    return {
        measure: state.measure
    }
}

export default connect(mapStateToProps, )(MeasureItem)
