import React, { PureComponent } from 'react'

const styleTable = {
  borderCollapse: 'collapse',
  width: '100px',
  height: '100px',
}

const styleTableTd = {
  width: '25px',
  height: '25px',
  border: 'solid 1px black',
}

class LayoutTool extends PureComponent {
    constructor(props) {
      super(props)
      this.tableRef = React.createRef()
      this.state = {
        row: this.props.row,
        col: this.props.col,
      }
    }

    componentDidMount() {
      this.initTable()
    }

    initTable = () => {
      let row = this.state.row
      let col = this.state.col
      let rows = this.tableRef.current.rows
      for (let i=0; i <= row; i++) {
        for(let j=0; j <= col; j++) {
          rows[i].cells[j].bgColor = '#AAAAAA'
        }
      }
    }

    cellClick = (e) => {
      let row = e.target.parentNode.rowIndex
      let col = e.target.cellIndex

      this.setState({row: row, col: col})

      let rows = this.tableRef.current.rows
      for (let i=0; i <= 3; i++) {
        for(let j=0; j <= 3; j++) {
          rows[i].cells[j].bgColor = '#444444'
        }
      }
      for (let i=0; i <= row; i++) {
        for(let j=0; j <= col; j++) {
          rows[i].cells[j].bgColor = '#AAAAAA'
        }
      }
      this.props.onChange(row+1, col+1)
    }

    renderTable() {
      const rows = ['', '', '', '']
      return (
        rows.map((row, i) => {
          return (
            <tr key={`${i}`}>
               <td style={styleTableTd} onClick={this.cellClick} />
               <td style={styleTableTd} onClick={this.cellClick} />
               <td style={styleTableTd} onClick={this.cellClick} />
               <td style={styleTableTd} onClick={this.cellClick} />
            </tr>
          )
        })
      )
   }

    render() {  
      return (
          <div>            
            <table style={styleTable} ref={this.tableRef}>
              <tbody>
                {this.renderTable()}                   
              </tbody>
            </table>
          </div>     
      )
    }

}

export default LayoutTool
