import React from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import Link from '@material-ui/core/Link'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import Typography from '@material-ui/core/Typography'
import packageJson from '../../package.json'

const AboutDlg = ({ onClose }) => {

    const urlRepository = "https://github.com/webnamics/u-dicom-viewer/"

    const linkRepository = (
        <Typography variant='body2'>
            <Link 
                href={urlRepository} 
                target='_blank'
                style={{ color: '#999999' }}
            >
                https://github.com/webnamics/u-dicom-viewer
            </Link>
        </Typography>
    )

    const version = (
        <Typography variant='body2' style={{ color: '#999999' }}>
            {packageJson.version}
        </Typography>        
    )

    return (
      <div>
        <Dialog onClose={onClose} open={true}>
            <DialogTitle onClose={onClose} disableTypography={true}>
                <Typography variant='h6'>
                    About <strong>U</strong> <strong>D</strong>icom <strong>V</strong>iewer
                </Typography>
            </DialogTitle>
            <DialogContent>
                <List>
                    <ListItem>
                        <ListItemText 
                            primary='Repository URL:' 
                            secondary={linkRepository} 
                        />
                    </ListItem>    
                    <ListItem>
                        <ListItemText 
                            primary='Version:' 
                            secondary={version} 
                        />
                    </ListItem>                        
                </List>        
            </DialogContent>
            <DialogActions>
                <Button autoFocus onClick={onClose}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
      </div>
    )
}

export default AboutDlg
