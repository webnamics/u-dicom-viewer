import React, { PureComponent } from 'react'
import Icon from '@mdi/react'
import IconButton from '@material-ui/core/IconButton'

import { 
    mdiPlay,
    mdiPause,
    mdiSkipBackward,
    mdiSkipForward,
    mdiSkipNext,
    mdiSkipPrevious,
  } from '@mdi/js'

const iconColor = '#FFFFFF'

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
            play = <IconButton onClick={this.play}>
                        <Icon path={mdiPlay} size={'1.5rem'} color={iconColor} />
                   </IconButton>          
        } else {
            play = <IconButton onClick={this.pause}>
                        <Icon path={mdiPause} size={'1.5rem'} color={iconColor} />
                   </IconButton>  
        }
        return (
            <div style={{ width:240, margin:'0 auto' }}>
                <IconButton onClick={this.firstframe}>
                    <Icon path={mdiSkipBackward} size={'1.5rem'} color={iconColor} />
                </IconButton>
                <IconButton onClick={this.previousframe}>
                    <Icon path={mdiSkipPrevious} size={'1.5rem'} color={iconColor} />
                </IconButton>
                {play}
                <IconButton onClick={this.nextframe}>
                    <Icon path={mdiSkipNext} size={'1.5rem'} color={iconColor} />
                </IconButton>
                <IconButton onClick={this.lastframe}>
                    <Icon path={mdiSkipForward} size={'1.5rem'} color={iconColor} />
                </IconButton>
            </div>
        )
    }
}

export default CinePlayer
