import React, { Fragment, PureComponent } from 'react'
import {connect} from 'react-redux'
import { withStyles } from '@material-ui/core/styles'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import Collapse from '@material-ui/core/Collapse'
import * as dicomParser from 'dicom-parser'
import ExpandLessIcon from '@material-ui/icons/ExpandLess'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import 'react-perfect-scrollbar/dist/css/styles.css'
import PerfectScrollbar from 'react-perfect-scrollbar'
import fs from '../fs/fs'
import {
  dicomDateToLocale,
  dicomTimeToStr,
  getSettingsDicomdirView,
} from '../functions'
import {
  fsFileStore,
} from '../actions'

const styles = theme => ({
  study: { 
    paddingLeft: theme.spacing(3) 
  },
  series: { 
    paddingLeft: theme.spacing(5) 
  },
  images: { 
    paddingLeft: theme.spacing(7) 
  },  
  listItemText:{
    fontSize:'0.80em',
  }
})

const styleScrollbar = {
  height: 'calc(100vh - 48px)',
}

const ExpandIcon = ({ expanded }) => expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />

class Dicomdir extends PureComponent {
    constructor(props) {
      super(props)
      this.output = null
    }

    state = {
      data: [],
      expanded: [],
    }

    componentDidMount() {
        if (this.props.dicomdir.origin === 'local')
          this.openDicomdir(this.props.dicomdir.dicomdir)   
        else 
          this.openDicomdirFs(this.props.dicomdir.dicomdir)               
    }

    buildData = (id = null) => {
      let output = this.output
      if (id !== null) {
        output[id].expanded = !output[id].expanded
      }
      let images = []
      let series = []
      let study = []
      let patient = []
      output.slice().reverse().forEach((obj, i) => {
        if (obj.key === 'image') {
          images.unshift({id: obj.id, key: obj.key, path: obj.path, value: obj.value})
        } else if (obj.key === 'series') {
          series.unshift({id: obj.id, key: obj.key, number: obj.number, value: obj.value, expanded: obj.expanded, children: images})
          images = []
        } else if (obj.key === 'study') {
          //console.log('study obj: ', obj)
          study.unshift({id: obj.id, key: obj.key, value: obj.value, expanded: obj.expanded, children: series})
          series = []
        } else if (obj.key === 'patient') {
          patient.unshift({id: obj.id, key: obj.key, value: obj.value, expanded: obj.expanded, children: study})
          study = []
        }
      })
      this.setState({data: patient})
    }

    buildOutput = (dataset) => {
      //console.log('dataset: ', dataset)
      let data = dataset.elements.x00041220.items
      let output = []
      if (data) {
          data.forEach((e, index) => {
            const id = index.toString()
            if (e.dataSet.string('x00041430') === 'PATIENT') {
                //console.log("Patient Name - "+e.dataSet.string('x00100010'))
                output.push({id: id, key: 'patient', value: e.dataSet.string('x00100010'), expanded: true})
            } else if (e.dataSet.string('x00041430') === 'STUDY') {
                //console.log("Study - "+e.dataSet.string('x00081030'))
                const value = `${dicomDateToLocale(e.dataSet.string('x00080020'))} - ${dicomTimeToStr(e.dataSet.string('x00080030'))}`
                output.push({id: id, key: 'study', value: value, expanded: true})
            } else if (e.dataSet.string('x00041430') === 'SERIES') {
                //console.log("Series number - "+e.dataSet.string('x00200011'))
                output.push({id: id, key: 'series', number: e.dataSet.string('x00200011'), value: e.dataSet.string('x00080060'), expanded: true})
            } else if (e.dataSet.string('x00041430') === 'IMAGE') {
                //console.log("Image - "+e.dataSet.string('x00041500'))
                output.push({id: id, key: 'image', path: e.dataSet.string('x00041500').replace(/\\/g, '/'), value: e.dataSet.string('x00041500').split('\\').pop(), expanded: true})
            }              
          })
      }
      //console.log('output: ', output)
      return output
    }

    openDicomdir = (file) => {
        var reader = new FileReader()
        reader.onload = (file) => {
          let arrayBuffer = reader.result
          let byteArray = new Uint8Array(arrayBuffer)
          // Invoke the paresDicom function and get back a DataSet object with the contents
          let dataset = null
          let output = []
          try {
              dataset = dicomParser.parseDicom(byteArray)
              output = this.buildOutput(dataset)
          } catch(err) {
              if (typeof err.dataSet != 'undefined') {
                  output = this.buildOutput(err.dataSet)
              }
          }
          this.output = output
          this.buildData()
        }

        reader.readAsArrayBuffer(file)
    }

    openDicomdirFs = (fsItem) => {
      let byteArray = new Uint8Array(fsItem.data)
      let dataset = null
      let output = []
      try {
        dataset = dicomParser.parseDicom(byteArray)
        output = this.buildOutput(dataset)
      } catch(err) {
        if (typeof err.dataSet != 'undefined') {
          output = this.buildOutput(err.dataSet)
        }
      }
      this.output = output
      this.buildData()
    }

    onClick = (id) => {
      const obj = this.output.find(x => x.id === id)
      if (obj.key === 'image') {
        if (this.props.dicomdir.origin === 'local') { // load it from local
          const file = this.props.dicomdir.files.find(x => x.name === obj.value)
          this.props.onOpenFile(file)
        } else { // load it from sandboxed file system
          let components = obj.path.split('/')
          const name = components.pop()
          components.unshift(this.props.fsCurrentDir)
          const parent = components.join('/')
          fs.files.where({parent: parent, name: name}).first((item) => {
            this.props.setFsFileStore(item)
            this.props.onOpenFs(item)
          })
        }
      } else {
        this.buildData(id)
      }
    }

    studyText = (study) => {
      //console.log('study: ', study)
      return study.value
    }

    render() {   
      const { classes } = this.props

      let styleComponent = null
      if (getSettingsDicomdirView() === 'bottom') {
          styleComponent = {marginTop: '0px', height: '275px'}
      } else {
          styleComponent = {marginTop: '48px', width: '350px'}
      }

      return (
        <PerfectScrollbar>
        <div style={styleScrollbar}>  
        <div style={styleComponent}>
          
          <List>
            {this.state.data.map(({ ...patient }, index) => (
              <Fragment key={index}>
                <ListItem button onClick={() => this.onClick(patient.id)}>
                  <ListItemText primary={patient.value} secondary={patient.key} classes={{primary:classes.listItemText, secondary:classes.listItemText}} />
                  <ExpandIcon expanded={patient.expanded} />
                </ListItem>
                <Collapse in={patient.expanded}>
                  {patient.children.map(study => (
                    <Fragment key={study.id}>
                      <ListItem key={study.id} button dense onClick={() => this.onClick(study.id)} className={classes.study}>
                        <ListItemText primary={this.studyText(study)} secondary={study.key} classes={{primary:classes.listItemText, secondary:classes.listItemText}} />
                        <ExpandIcon expanded={study.expanded} />
                      </ListItem>
                      <Collapse in={study.expanded}>
                        {study.children.map(series => (
                          <Fragment key={series.id}>
                            <ListItem key={series.id} button dense onClick={() => this.onClick(series.id)} className={classes.series}>
                              <ListItemText primary={`${series.value} (${series.number})`} secondary={series.key} classes={{primary:classes.listItemText, secondary:classes.listItemText}} />
                              <ExpandIcon expanded={study.expanded} />
                            </ListItem>
                            <Collapse in={series.expanded}>
                              {series.children.map(images => (
                                <ListItem key={images.id} button dense onClick={() => this.onClick(images.id)} className={classes.images}>
                                  <ListItemText primary={images.value} secondary={images.key} classes={{primary:classes.listItemText, secondary:classes.listItemText}} />
                                </ListItem>
                              ))}
                            </Collapse>
                          </Fragment>
                        ))}
                      </Collapse>
                    </Fragment>
                  ))}
                </Collapse>
              </Fragment>
            ))}
          </List>
        </div>
        </div>
        </PerfectScrollbar>
      )
    }
}   

const mapStateToProps = (state) => {
    return {
      dicomdir: state.dicomdir,
      fsCurrentDir: state.fsCurrentDir,
    }
}

const mapDispatchToProps = (dispatch) => {
  return {
    setFsFileStore: (file) => dispatch(fsFileStore(file))
  }
}
  
export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Dicomdir))
