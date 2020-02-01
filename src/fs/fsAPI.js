import fs from './fs'

// List all files and folders within given diretory 
export function fsAPIgetItemByPath(path) {
  let components = path.split('/')
  const name = components.pop()
  const parent = components.join('/')
  fs.files.where({parent: parent, name: name}).first((item) => {
    return item
  })
}
