import { getPixel } from './getPixel'

export function invert(image, element, isDcm) {
    
    for (let y = 0; y < image.columns; y++) {
        for (let x = 0; x < image.rows; x++) {
          let sp = getPixel(image, element, isDcm, x, y)
          let mo = image.maxPixelValue - sp * image.slope + image.intercept

        } 
      }  
}