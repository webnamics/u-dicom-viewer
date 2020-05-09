import React, { PureComponent } from 'react'
import {connect} from 'react-redux'
import { withStyles } from '@material-ui/core/styles'
import DicomViewer from './DicomViewer'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'
import 'react-perfect-scrollbar/dist/css/styles.css'
import PerfectScrollbar from 'react-perfect-scrollbar'
import {
    seriesStore,
    filesStore,
    explorer,
    explorerActivePatientIndex,
    explorerActiveStudyIndex,
    explorerActiveSeriesIndex,
  } from '../actions'

import {
    groupBy,
} from '../functions'

const style = {
    width: '200px', 
    padding: '8px 8px 8px 8px', 
    marginTop: '40px',
}

const styleScrollbar = {
    height: 'calc(100vh - 48px)',
}

const styleDicomViewerStack = {
    width: '182px', 
    marginTop: '10px',
    marginLeft: '7px',
}

const styleDicomViewer = { 
    padding: '4px 4px 4px 4px', 
}

const styles = theme => ({
    formControl: {
        margin: theme.spacing(1),
        minWidth: 180,
    },
    selectEmpty: {
        marginTop: theme.spacing(2),
    },
    selectText: {
        fontSize: '0.85em',
    },    
    menuItemText: {
        fontSize: '0.85em',
    },
})

class Explorer extends PureComponent {
    constructor(props) {
        super(props)

        this.dicomViewersRefs = []
        this.dicomViewers = []
        for(let i=0; i < 16; i++) {
          this.dicomViewers.push(this.setDcmViewer(i))
        }
      }

    state = {
        patientName: this.props.explorer.patient.keys[0],
        studies: [],
        study: '',
        series: [],
        seriesActiveIndex: 0,
    }

    setDcmViewer = (index) => {
        return (
          <div style={styleDicomViewer}>  
            <DicomViewer 
                dcmRef={(ref) => {this.dicomViewersRefs[index] = ref}}
                index={index}
                runTool={ref => (this.runTool = ref)} 
                changeTool={ref => (this.changeTool = ref)}
                onLoadedImage={this.onLoadedImage}
                overlay={true}
                visible={true} 
                use='preview'
            />   
          </div> 
        )
    }
    
    onLoadedImage = () => {
        //console.log('Explorer - onLoadedImage: ')
    }

    getDcmViewerRef = (index) => {
        return this.dicomViewersRefs[index]
    }

    getDcmViewer = (index) => {
        return this.dicomViewers[index]
    }

    buildPreviewStack = (rows) => {
        this.dicomviewers = []
        for(let i=0; i < rows; i++) {
            this.dicomviewers.push(
              <div 
                key={i} 
                onClick={() => this.previewStackClick(i)} 
                onTouchStart={() => this.previewStackTouch(i)}
              >
                {this.getDcmViewer(i)}
              </div>        
            )
        }
        
        return (
          <div
            id="dicomviewer-grid"
            style={{
              display: 'grid',
              gridTemplateRows: `repeat(${rows}, ${100 / rows}%)`,
              gridTemplateColumns: `repeat(${1}, ${100}%)`,
              height: '100%',
              width: '100%',
            }}
          >
            {this.dicomviewers}
          </div>
        )
    }

    componentDidMount() {
        //console.log('Explorer - componentDidMount: ')

        const patientIndex = this.props.explorerActivePatientIndex
        const studyIndex = this.props.explorerActiveStudyIndex
        const patientName = this.props.explorer.patient.keys[patientIndex]
        
        this.setState({patientName: patientName}, () => {
            this.filesListForPatient = this.props.allFiles.filter((a) => {
                return a.patient.patientName === patientName}
            )
            //console.log('filesListForPatient: ', this.filesListForPatient)
            
            this.studyList = groupBy(this.filesListForPatient, a => a.study.studyDateTime)
            let studyKeys = [...this.studyList.keys()]
            if (this.studyList.get(studyKeys[0])[0].study.studyDate === undefined) {
                this.studyList = groupBy(this.filesListForPatient, a => a.study.studyDescription)
                studyKeys = [...this.studyList.keys()]
            }
            this.study = {
              list: this.studyList,
              keys: studyKeys
            }

            //console.log('this.studyList: ', this.studyList.get(studyKeys[0]))
            //console.log('study: ', this.study)

            this.seriesList = groupBy(this.studyList.get(studyKeys[0]), a => a.series.seriesNumber) // this.filesListForPatient
            const seriesKeys = [...this.seriesList.keys()]
            
            //console.log('seriesList: ', this.seriesList)
            //console.log('seriesKeys: ', seriesKeys)

            this.series = {
                seriesList: this.seriesList,
                seriesKeys: seriesKeys
            }
            this.files = this.series.seriesList.get(seriesKeys[0])
            this.props.setSeriesStore(this.series)

            this.setState({study: this.study.keys[studyIndex], studies: studyKeys, series: seriesKeys}, () => {               

                //this.props.setSeriesStore(this.series)

                //this.files = this.series.seriesList.get(this.state.series[0])

                //this.props.setFilesStore(this.files)
                //this.props.onSelectSeries(this.seriesList.get(seriesKeys[0]))
                this.previewStackClick(0)
            })

            //this.props.setExplorerActiveSeriesIndex(0) 
            
        })

    }

    componentDidUpdate() {
        //console.log('Explorer - componentDidUpdate: ', this.state.series)
        for(let i=0; i < this.state.series.length; i++) {
            this.dicomViewersRefs[i].runTool('setfiles', this.seriesList.get(this.state.series[i]))
            this.dicomViewersRefs[i].runTool('openimage', 0)
        }
    }

    handlePatientChange = (event, value) => {
        //console.log('handlePatientChange: ', value)

        this.patientName = event.target.value
        const patientIndex = value.key

        //console.log('patientIndex: ', patientIndex)

        this.filesListForPatient = this.props.allFiles.filter((a) => {
            return a.patient.patientName === this.patientName}
        )
        //console.log('filesListForPatient: ', this.filesListForPatient)

        this.studyList = groupBy(this.filesListForPatient, a => a.study.studyDateTime)
        const studyKeys = [...this.studyList.keys()]
        this.study = {
          list: this.studyList,
          keys: studyKeys
        }
        //console.log('study: ', this.study)
        
        this.seriesList = groupBy(this.studyList.get(studyKeys[0]), a => a.series.seriesNumber) // this.filesListForPatient
        const seriesKeys = [...this.seriesList.keys()]

        this.series = {
            seriesList: this.seriesList,
            seriesKeys: seriesKeys
        }
        this.props.setSeriesStore(this.series)

        this.setState({patientName: this.patientName, study: this.study.keys[0], studies: studyKeys, series: seriesKeys}, () => {
            //for(let i=0; i < this.state.series.length; i++) {
                //const file = this.seriesList.get(this.state.series[i])[0]
                //const index = this.props.allFiles.map(e => e.name).indexOf(file.name)
            //    this.dicomViewersRefs[i].runTool('openimage', 0)
            //}
            //this.series = {
            //    seriesList: this.seriesList,
            //    seriesKeys: this.state.series
            //}

            /*const explorerData = {
                patient: patientName,
                study: this.study,
                series: series,
            }

            this.props.setExplorer(explorerData)*/

            this.props.setExplorerActivePatientIndex(patientIndex)
            //this.props.setSeriesStore(this.series)

            //this.props.setFilesStore(this.series.seriesList.get(this.state.series[0]))

            //console.log('handlePatientChange - handlePatientChange: ')
            //this.props.onSelectSeries(this.series.seriesList.get(seriesKeys[0]))
            this.previewStackClick(0)
            //console.log('this.dicomviewers: ', this.dicomviewers[0].props.onClick())
            //this.dicomviewers[0].onClick()
            //this.dicomviewers[0].props.onClick()
        })
    }

    handleStudyChange = (event, value) => {
        //console.log('handleStudyChange, event: ', event)
        //console.log('handleStudyChange, value: ', value)

        const studyIndex = value.key

        this.studyList = groupBy(this.filesListForPatient, a => a.study.studyDateTime)
        let studyKeys = [...this.studyList.keys()]
        if (this.studyList.get(studyKeys[0])[0].study.studyDate === undefined) {
            this.studyList = groupBy(this.filesListForPatient, a => a.study.studyDescription)
            studyKeys = [...this.studyList.keys()]
        }
        this.study = {
          list: this.studyList,
          keys: studyKeys
        }
        
        //console.log('this.studyList: ', this.studyList.get(studyKeys[studyIndex]))
        //console.log('study: ', this.study)

        this.seriesList = groupBy(this.studyList.get(studyKeys[studyIndex]), a => a.series.seriesNumber) // this.filesListForPatient
        const seriesKeys = [...this.seriesList.keys()]

        //console.log('seriesList: ', this.seriesList)
        //console.log('seriesKeys: ', seriesKeys)

        this.series = {
            seriesList: this.seriesList,
            seriesKeys: seriesKeys
        }
        this.props.setSeriesStore(this.series)

        //this.files = this.seriesList.get(seriesKeys[0])

        this.setState({study: this.study.keys[studyIndex], studies: studyKeys, series: seriesKeys}, () => {
            //for(let i=0; i < seriesKeys.length; i++) {
            //    console.log('i: ', i)
                //const file = this.seriesList.get(seriesKeys[i])[0]
                //console.log('file: ', file)
                //const index = this.props.allFiles.map(e => e.name).indexOf(file.name)
                //this.dicomViewersRefs[i].runTool('setfiles', this.seriesList.get(seriesKeys[i]))
                //this.dicomViewersRefs[i].runTool('openimage', 0)
            //}
            //this.props.setFilesStore(this.files) 
            //this.props.onSelectSeries(this.files) 
            //this.props.setExplorerActiveStudyIndex(studyIndex)
            //this.props.onSelectSeries(this.series.seriesList.get(seriesKeys[0]))  
            this.previewStackClick(0)
        })


    }

    previewStackClick = (index) => {
        //console.log('previewStackClick: ', index)
        //console.log('previewStackClick - this.state.seriesActiveIndex: ', this.state.seriesActiveIndex)
        //if (index === this.state.seriesActiveIndex) return
        this.props.setExplorerActiveSeriesIndex(index) 
        this.setState({seriesActiveIndex: index}, () => {
            this.props.onSelectSeries(this.series.seriesList.get(this.state.series[index]))
        })
    }

    previewStackTouch = (index) => {
        //if (index === this.state.seriesActiveIndex) return
        this.props.setExplorerActiveSeriesIndex(index)
        this.setState({seriesActiveIndex: index}, () => {
            this.props.onSelectSeries(this.series.seriesList.get(this.state.series[index]))
        })
    }

    render() {   
        const { classes } = this.props
    
        //console.log('Explorer render:')

        return (
            <PerfectScrollbar> 
                <div style={styleScrollbar}>
                    <div style={style}>
                        <FormControl className={classes.formControl}>
                            <InputLabel id="patient-label">Patient</InputLabel>
                            <Select
                                className={classes.selectText}
                                labelId="patient-select-label"
                                id="patient-select"
                                value={this.state.patientName}
                                onChange={this.handlePatientChange}
                            >
                                {this.props.explorer.patient.keys.map((patient, index) => (
                                    <MenuItem className={classes.menuItemText} value={patient} key={index}>{patient}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl className={classes.formControl}>
                            <InputLabel id="study-label">Study</InputLabel>
                            <Select
                                className={classes.selectText}
                                labelId="study-select-label"
                                id="study-select"
                                value={this.state.study}
                                onChange={this.handleStudyChange}
                            >
                                {this.state.studies.map((study, index) => (
                                    // `${studyDate} - ${studyTime}`
                                    <MenuItem className={classes.menuItemText} value={study} key={index}>{study}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        <div style={styleDicomViewerStack}>
                            {
                                this.buildPreviewStack(this.state.series.length)
                            }
                        </div>
                    </div>
            </div>
          </PerfectScrollbar> 
        )
    }
}

const mapStateToProps = (state) => {
    return {
      allFiles: state.allFiles,
      explorerActivePatientIndex: state.explorerActivePatientIndex,
      explorerActiveStudyIndex: state.explorerActiveStudyIndex,
      explorerActiveSeriesIndex: state.explorerActiveSeriesIndex,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        setFilesStore: (files) => dispatch(filesStore(files)),
        setExplorer: (data) => dispatch(explorer(data)),
        setExplorerActivePatientIndex: (index) => dispatch(explorerActivePatientIndex(index)),
        setExplorerActiveStudyIndex: (index) => dispatch(explorerActiveStudyIndex(index)),
        setExplorerActiveSeriesIndex: (index) => dispatch(explorerActiveSeriesIndex(index)),
        setSeriesStore: (series) => dispatch(seriesStore(series)),
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Explorer))
