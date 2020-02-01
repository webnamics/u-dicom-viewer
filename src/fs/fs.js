import Dexie from 'dexie'

const fs = new Dexie('fsDB')

fs.version(1).stores({ 
    files: '[parent+name], parent, name, type' 
})

fs.open()

export default fs
