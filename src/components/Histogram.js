import React, { PureComponent } from 'react'
//import Draggable from 'react-draggable'
//import IconButton from '@material-ui/core/IconButton'
import Slider from '@material-ui/core/Slider'
//import HighlightOffIcon from '@material-ui/icons/HighlightOff'
import {connect} from 'react-redux'
//import * as cornerstone from 'cornerstone-core'
// import { import as csTools } from 'cornerstone-tools'

// const getRGBPixels = csTools('util/getRGBPixels')

const HIST_WIDTH = 256
const HIST_HEIGHT = 128
const N_BINS = 256

const style = {
  width: '273px', 
  padding: '8px 8px 8px 8px', 
  backgroundColor: '#444444',
}

const styleSlider = {
  width: '255px',
  marginTop: '-9px',
}

const styleCanvasGradient = {
  marginTop: '-9px',
}

const styleTable = {
  borderCollapse: 'collapse',
  fontFamily: 'Courier, monospace',
  fontSize: '67%',
  width: '100%',
}

const styleTableTd = {
  tableLayout: 'fixed',
  width: '25%',
}

class Histogram extends PureComponent {
    constructor(props) {
      super(props)
      this.canvasHistogram = React.createRef()
      this.canvasGradient = React.createRef()
    }

    state = {
      activeDrags: 0,
      deltaPosition: {
        x: 0, y: 0
      },
      controlledPosition: {
        x: -400, y: 200
      },
      value: 128,
      histCount: 0,
      valueScale: 0,
      minHist: 0,
      maxHist: 0,
      mean: 0,
      stdDev: 0,
    }

    componentDidMount() {
      //console.log('Histogram - componentDidMount: ')
      //this.image = this.props.activeDcm.image
      //this.element = this.props.activeDcm.element
      //this.isDicom = this.props.activeDcm.isDicom
      //this.pixelData = this.props.activeDcm.image.getPixelData()
      const canvasH = this.canvasHistogram.current
      const ctxH = this.canvasHistogram.current.getContext("2d")
      ctxH.translate(0, canvasH.height)
      ctxH.scale(1, -1)

      this.updateCanvas()     
    }
    
    componentDidUpdate() {
      //console.log('Histogram - componentDidUpdate: ')
      if (this.props.activeDcm === null) {
        const ctxH = this.canvasHistogram.current.getContext("2d")
        ctxH.clearRect(0, 0, ctxH.canvas.width, ctxH.canvas.height)
        return
      }
      this.updateCanvas() 
    }

    getMousePos(canvas, evt) {
      const rect = canvas.getBoundingClientRect()
      return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
      }
    }

    getRGBPixelsImage(x, y, width, height) {
      const pixelData = this.props.activeDcm.image.getPixelData()
      const storedPixelData = []
      x = Math.round(x)
      y = Math.round(y)   
      let index = 0
      let spIndex, row, column
    
      for (row = 0; row < height; row++) {
        for (column = 0; column < width; column++) {
          spIndex = ((row + y) * this.props.activeDcm.image.rows + (column + x)) * 4
          const red = pixelData[spIndex]
          const green = pixelData[spIndex + 1]
          const blue = pixelData[spIndex + 2]
          const alpha = pixelData[spIndex + 3]
  
          storedPixelData[index++] = red
          storedPixelData[index++] = green
          storedPixelData[index++] = blue
          storedPixelData[index++] = alpha
        }
      }
      return storedPixelData
    }

    getPixelsImage(x, y, width, height) {
      const pixelData = this.props.activeDcm.image.getPixelData()
      const storedPixelData = []
      x = Math.round(x)
      y = Math.round(y)   
      let index = 0
      let spIndex, row, column
    
      for (row = 0; row < height; row++) {
        for (column = 0; column < width; column++) {
          spIndex = ((row + y) * this.props.activeDcm.image.rows + (column + x)) 
          storedPixelData[index++] = pixelData[spIndex]
        }
      }
      return storedPixelData
    }    

    getPixel(x, y) {
      let sp = []
      if (this.props.activeDcm.isDicom) {
        if (this.props.activeDcm.image.color) {
          //sp = getRGBPixels(this.element, x, y, 1, 1)
          //sp = cornerstone.getStoredPixels(this.element, x, y, 1, 1)
          sp = this.getRGBPixelsImage(x, y, 1, 1)
        } else {
          // sp = cornerstone.getStoredPixels(this.props.activeDcm.element, x, y, 1, 1)
          sp = this.getPixelsImage(x, y, 1, 1)
        }
      } else {
        sp = this.getRGBPixelsImage(x, y, 1, 1)
      }
      return sp[0]
    }

    updateCanvas() {
      const image = this.props.activeDcm.image
      //const element = this.props.element
      const maxPixelValue = image.maxPixelValue
      const minPixelValue = image.minPixelValue
      //const k = Math.pow(2, this.props.bitsStored)
      const minHist = minPixelValue+image.intercept
      const maxHist = maxPixelValue+image.intercept
      const lenHist = maxHist-minHist+1
      const binSize = lenHist / N_BINS
      let zero256 = Math.floor(Math.abs(minHist) / binSize)
      let stepWW = Math.round(image.windowWidth / binSize / 2)
      let stepWC = Math.round(image.windowCenter / binSize)

      this.setState({minHist: minHist})
      this.setState({maxHist: maxHist})
      this.binSize = binSize

      //console.log('activeDcm: ', this.props.activeDcm)
      //console.log('image: ', )
      //console.log('getPixelData: ', image.getPixelData())
      //console.log('columns: ', image.columns)
      //console.log('rows: ', image.rows)
      //console.log('isDicom: ', this.props.activeDcm.isDicom)
      //console.log('bitsStored: ', k)
      //console.log('minHist: ', minHist)
      //console.log('maxHist: ', maxHist)
      //console.log('lenHist: ', lenHist)
      //console.log('binSize: ', binSize)
      //console.log('zeroHist: ', zero256)
      //console.log('stepWW: ', stepWW)
      //console.log('stepWC: ', stepWC)
      //console.log('zero256-stepWW: ', zero256-stepWW)
      //console.log('zero256+stepWW: ', zero256+stepWW)   
      //console.log('image.color: ', image.color)
      //console.log('image.slope: ', image.slope)
      //console.log('image.intercept: ', image.intercept)

      let m = 0 // the mean
      // build histogram
      let hist = Array(lenHist).fill(0) 
      for (let y = 0; y < image.columns; y++) {
        for (let x = 0; x < image.rows; x++) {
          let sp = this.getPixel(x, y)
          let mo = sp * image.slope + image.intercept
          hist[mo-minHist] += 1
          m += mo
        } 
      }  

      m = m / (image.columns * image.rows)
      this.setState({mean: m})  

      //console.log('hist: ', hist)
      //console.log('mean: ', m)

      // calculate standard deviation
      let s = 0
      for (let y = 0; y < image.columns; y++)
        for (let x = 0; x < image.rows; x++) {
          let sp = this.getPixel(x, y)
          let mo = sp * image.slope + image.intercept
          s += Math.pow(mo-m, 2)
        }  
      s = Math.sqrt(s / (image.columns * image.rows))
      this.setState({stdDev: s})

      // binning the histogram 
      let hist256 = Array(N_BINS).fill(0) 
      let max = 0

      if (binSize < 1) {
        let binStep = Math.round(N_BINS / lenHist)
        let iHist = 0
        let i = 0
        while (i < N_BINS) {
          for (let j=0; j < binStep; j++) { 
            hist256[i] = iHist < lenHist ? hist[iHist] : 0
            if (max < hist256[i]) max = hist256[i]  
            i++
          }   
          iHist++     
        }

        /*for (let i=0; i < N_BINS; i+=binStep) {
          const k = Math.floor(i)
          //console.log(`i: ${k} `)
          for (let j=0; j < Math.round(binStep); j++) { 
            console.log(`i: ${k} - j: ${j} - iHist: ${iHist} - hist[iHist]: ${hist[iHist]}`)
            hist256[k+j] = hist[iHist]
          }
          iHist++
          if (max < hist256[k]) max = hist256[k] 
        }*/
      } else {
        let step = 0
        for (let i=0; i < N_BINS; i++) {
          for (let j=step; j < Math.round(step+binSize); j++) {
            if (j >= lenHist) break
            hist256[i] += hist[j]
          }
          if (max < hist256[i]) { max = hist256[i] }
          step = Math.round(step+binSize)
        }        
      }

      this.hist256 = hist256

      //console.log('hist256: ', hist256)
      //console.log('max: ', max)

      if (max / HIST_HEIGHT > 100) max = max / 5
      
      const canvasH = this.canvasHistogram.current
      const ctxH = this.canvasHistogram.current.getContext("2d")
      ctxH.clearRect(0, 0, ctxH.canvas.width, ctxH.canvas.height)

      canvasH.addEventListener('pointermove', (evt) => {
        const mousePos = this.getMousePos(canvasH, evt)
        this.setState({histCount: hist256[mousePos.x]})
        let p = Math.round(mousePos.x * this.binSize)
        this.setState({valueScale: p+minHist})
      }, true)

      //console.log('value: ', (m-minHist)/binSize)
      let value = Math.round((m-minHist)/binSize)
      this.setState({value: value})
      this.setState({valueScale: m})
      this.setState({histCount: hist256[value]})

      // draw WindowWidth area
      ctxH.beginPath()
      ctxH.fillStyle = 'rgba(210, 210, 210, 0.5)'
      ctxH.fillRect(zero256-stepWW+stepWC, 0, stepWW*2, HIST_HEIGHT)

      // draw histogram
      ctxH.beginPath()
      ctxH.strokeStyle = 'rgba(0, 0, 0, 1.0)'
      for (let i = 0; i < N_BINS; i++) {
        let h = Math.round((hist256[i]/max)*HIST_HEIGHT)
        ctxH.moveTo(i, 0)
        ctxH.lineTo(i, h)
        ctxH.stroke()
      }
      
      // draw WindowCenter cursor
      ctxH.beginPath()
      ctxH.strokeStyle = 'rgba(140, 140, 140, 0.5)'
      ctxH.moveTo(zero256+stepWC, 0)
      ctxH.lineTo(zero256+stepWC, HIST_HEIGHT)
      ctxH.lineWidth = 1
      ctxH.stroke()
          
      let lowX = zero256-stepWW+stepWC
      let highX = zero256+stepWW+stepWC

      // draw gradient scale
      const canvasG = this.canvasGradient.current
      const ctxG = canvasG.getContext("2d")

      ctxG.fillStyle = "#000000"
      ctxG.fillRect(0, 0, lowX, 10)

      let grd = ctxG.createLinearGradient(lowX, 0, highX+(lowX < 0 ? lowX : 0), 0)
      grd.addColorStop(0, "black")
      grd.addColorStop(1, "white")
      ctxG.fillStyle = grd
      ctxG.fillRect(lowX, 0, highX, 10)
    }
        
    handleChangeValue = (event, newValue) => {
      //console.log('newValue: ', newValue)
      //console.log('(newValue*this.binSize)+this.state.minHist: ', (newValue*this.binSize)+this.state.minHist)
      //console.log('this.hist256[newValue]: ', this.hist256[newValue])
      this.setState({value: newValue})
      this.setState({valueScale: (newValue*this.binSize)+this.state.minHist})
      this.setState({histCount: this.hist256[newValue]})
    }
      
    hide = () => {
      this.props.onClose()
    }

    onDrag = (e, ui) => {
      const {x, y} = this.state.deltaPosition;
      this.setState({
        deltaPosition: {
          x: x + ui.deltaX,
          y: y + ui.deltaY,
        }
      })
    }
  
    onStart = () => {
      this.setState({activeDrags: this.state.activeDrags+1})
    }
  
    onStop = () => {
      this.setState({activeDrags: this.state.activeDrags-1})
    }

    render() {
      return (
        <div style={style}>
          <div>
            <canvas 
              ref={this.canvasHistogram} 
              width={HIST_WIDTH} 
              height={HIST_HEIGHT} 
              style={{backgroundColor: "#FFFFFF", cursor:'crosshair'}} 
            />
          </div>  
          <div style={styleCanvasGradient}>
            <canvas ref={this.canvasGradient} width={HIST_WIDTH} height={10} style={{backgroundColor: "#FFFFFF"}} />
          </div>
          <div style={styleSlider}>
            <Slider
              value={this.state.value}
              onChange={this.handleChangeValue}
              aria-labelledby="continuous-slider"
              color="secondary"
              min={0}
              max={255}
            />
          </div>
          <div>
            <table style={styleTable}>
              <tbody>
                <tr>
                  <td style={styleTableTd}>min:</td>
                  <td style={styleTableTd}>{this.state.minHist}</td>
                  <td style={styleTableTd}>max:</td>
                  <td style={styleTableTd}>{this.state.maxHist}</td>
                </tr>
                <tr>
                  <td>mean:</td>
                  <td>{parseFloat(this.state.mean).toFixed(3)}</td>
                  <td>std dev:</td>
                  <td>{parseFloat(this.state.stdDev).toFixed(3)}</td>
                </tr>
                <tr>
                  <td>count:</td>
                  <td>{this.state.histCount}</td>
                  <td>value:</td>
                  <td>{parseFloat(this.state.valueScale).toFixed(3)}</td>
                </tr>
              </tbody>
            </table>
          </div>
      </div>
      )
  }
}

const mapStateToProps = (state) => {
  return {
    activeDcmIndex: state.activeDcmIndex,
    activeDcm: state.activeDcm,
  }
}

export default connect(mapStateToProps)(Histogram)
