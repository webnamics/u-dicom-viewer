import { EPSILON } from './constants'

export const areEqual = (one, other, epsilon = EPSILON) => Math.abs(one - other) < epsilon
export const isNearlyZero = (v) => Math.abs(v) < EPSILON
export const toDegrees = radians => (radians * 180) / Math.PI
export const toRadians = degrees => (degrees * Math.PI) / 180
export const sum = arr => arr.reduce((acc, value) => acc + value, 0)
export const withoutElementAtIndex = (arr, index) => [ ...arr.slice(0, index), ...arr.slice(index + 1) ]


