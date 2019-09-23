import React, { PureComponent } from 'react'
import { Button } from 'react-md'

class CinePlayer extends PureComponent {
    firstframe = () => {
        this.props.runCinePlayer('firstframe') 
    }

    previousframe = () => {
        this.props.runCinePlayer('previousframe') 
    }

    play = () => {
        this.props.runCinePlayer('play') 
    }

    pause = () => {
        this.props.runCinePlayer('pause') 
    }

    nextframe = () => {
        this.props.runCinePlayer('nextframe') 
    }

    lastframe = () => {
        this.props.runCinePlayer('lastframe') 
    }

    render() {
        let play = null
        if (!this.props.inPlay) {
            play = <Button icon onClick={this.play} >play_arrow</Button>
        } else {
            play = <Button icon onClick={this.pause} >pause</Button>
        }
        return (
            <div style={{ width:240, margin:'0 auto' }}>
                <Button icon onClick={this.firstframe} >skip_previous</Button>
                <Button icon onClick={this.previousframe} >fast_rewind</Button>
                {play}
                <Button icon onClick={this.nextframe} >fast_forward</Button>
                <Button icon onClick={this.lastframe} >skip_next</Button>
            </div>
        )
    }
}

export default CinePlayer
