import Dexie from 'dexie'

const db = new Dexie('udvDB')

db.version(1).stores({ 
    measurement: '++id, sopinstanceuid, tool' 
})

db.open()

export default db
