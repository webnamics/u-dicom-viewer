import React, { PureComponent } from 'react'
import {connect} from 'react-redux'
import { withStyles } from '@material-ui/core/styles'
import DicomPreviewer from './DicomPreviewer'
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
            <DicomPreviewer 
                dcmRef={(ref) => {this.dicomViewersRefs[index] = ref}}
                index={index}
                runTool={ref => (this.runTool = ref)} 
                changeTool={ref => (this.changeTool = ref)}
                onLoadedImage={this.onLoadedImage}
                onRenderedImage={this.onRenderedImage}
                visible={true} 
            />   
          </div> 
        )
    }
    
    onLoadedImage = () => {
    
    }

    onRenderedImage = () => {

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
            id="dicompreviewer-grid"
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
        const seriesIndex = this.props.explorerActiveSeriesIndex
        const patientName = this.props.explorer.patient.keys[patientIndex]

        const files = this.props.files
        
        this.setState({patientName: patientName}, () => {
            this.filesListForPatient = files.filter((a) => {
                return a.patient.patientName === patientName}
            )
 
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

            const seriesList = groupBy(this.studyList.get(studyKeys[0]), a => a.series.seriesNumber) // this.filesListForPatient
            this.seriesList = new Map([...seriesList].sort())
            
            const seriesKeys = [...this.seriesList.keys()]
            seriesKeys.sort(function(a, b) { return a - b })

            this.series = {
                seriesList: this.seriesList,
                seriesKeys: seriesKeys
            }
            this.files = this.series.seriesList.get(seriesKeys[0])
            this.props.setSeriesStore(this.series)

            this.setState({study: this.study.keys[studyIndex], studies: studyKeys, series: seriesKeys}, () => {
                this.previewStackClick(seriesIndex)
            })
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

        this.filesListForPatient = this.props.allFiles.filter((a) => {
            return a.patient.patientName === this.patientName}
        )

        this.studyList = groupBy(this.filesListForPatient, a => a.study.studyDateTime)
        const studyKeys = [...this.studyList.keys()]
        this.study = {
          list: this.studyList,
          keys: studyKeys
        }

        this.seriesList = groupBy(this.studyList.get(studyKeys[0]), a => a.series.seriesNumber) // this.filesListForPatient
        const seriesKeys = [...this.seriesList.keys()]

        this.series = {
            seriesList: this.seriesList,
            seriesKeys: seriesKeys
        }
        this.props.setSeriesStore(this.series)

        this.setState({patientName: this.patientName, study: this.study.keys[0], studies: studyKeys, series: seriesKeys}, () => {
            this.props.setExplorerActivePatientIndex(patientIndex)
            this.previewStackClick(0)
        })
    }

    handleStudyChange = (event, value) => {
        //console.log('handleStudyChange, event: ', event)

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

        this.seriesList = groupBy(this.studyList.get(studyKeys[studyIndex]), a => a.series.seriesNumber)
        const seriesKeys = [...this.seriesList.keys()]

        this.series = {
            seriesList: this.seriesList,
            seriesKeys: seriesKeys
        }
        this.props.setSeriesStore(this.series)

        this.setState({study: this.study.keys[studyIndex], studies: studyKeys, series: seriesKeys}, () => {
            this.previewStackClick(0)
        })


    }

    previewStackClick = (index) => {
        //console.log('previewStackClick: ', index)
        //if (index === this.state.seriesActiveIndex) return
        this.props.setExplorerActiveSeriesIndex(index) 
        this.setState({seriesActiveIndex: index}, () => {
            this.props.onSelectSeries(this.series.seriesList.get(this.state.series[index]), index)
        })
    }

    previewStackTouch = (index) => {
        this.props.setExplorerActiveSeriesIndex(index)
        this.setState({seriesActiveIndex: index}, () => {
            this.props.onSelectSeries(this.series.seriesList.get(this.state.series[index]))
        })
    }

    clear = () => {
        for(let i=0; i < 16; i++) {
            this.dicomViewersRefs[i].runTool('clear')
        }
    }

    render() {   
        const { classes } = this.props

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
      files: state.files,
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
