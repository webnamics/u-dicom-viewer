import React from 'react'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'

const HeaderItem = ({name, value}) => {
    return (
        <ListItem dense={true}>
            <ListItemText primary={name} secondary={value} />
        </ListItem>  
    )
}
  
export default HeaderItem
