import React from 'react'
import { ListItem } from 'react-md'

const HeaderItem = ({name, value}) => {
    
    const pStyle = {
        fontSize: '12px',
        textAlign: 'left'
    }

    return (
        <ListItem
            primaryText={name}
            secondaryText={value}
            threeLines={value.length > 30}
            secondaryTextStyle={pStyle}
        />
    )
}
  
export default HeaderItem
