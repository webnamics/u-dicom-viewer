import * as cornerstone from 'cornerstone-core'
import { import as csTools } from 'cornerstone-tools'

const getRGBPixels = csTools('util/getRGBPixels')

getRGBPixelsImage(image, x, y, width, height) {
    const storedPixelData = []
    x = Math.round(x)
    y = Math.round(y)   
    let index = 0
    let spIndex, row, column

    for (row = 0; row < height; row++) {
        for (column = 0; column < width; column++) {
            spIndex = ((row + y) * image.rows + (column + x)) * 4
            const red = this.pixelData[spIndex]
            const green = this.pixelData[spIndex + 1]
            const blue = this.pixelData[spIndex + 2]
            const alpha = this.pixelData[spIndex + 3]

            storedPixelData[index++] = red
            storedPixelData[index++] = green
            storedPixelData[index++] = blue
            storedPixelData[index++] = alpha
        }
    }

    return storedPixelData
}

export function getPixel(element, image, isDcm, x, y) {
    let sp = []
    if (isDcm) {
        if (image.color) {
            sp = getRGBPixels(element, x, y, 1, 1)
        } else {
            sp = cornerstone.getStoredPixels(element, x, y, 1, 1)
        }
    } else {
        sp = this.getRGBPixelsImage(image, x, y, 1, 1)
    }
    return sp[0]
}
