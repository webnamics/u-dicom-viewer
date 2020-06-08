import { isNearlyZero } from './utils'

export default class Vector {
    
    constructor(...components) {
      this.components = components
    }

    static get zero() {
        return new Vector(0, 0, 0)
    }
    
    get x() {
        return this.components[0]
    }
    
    set x(n) {
        this.components[0] = n
    }

    get y() {
        return this.components[1]
    } 

    set y(n) {
        this.components[1] = n
    } 

    get z() {
        return this.components[2]
    } 

    set z(n) {
        this.components[2] = n
    } 

    length() {
        return Math.hypot(...this.components)
    }

    isZero() {
        return this.components.reduce((acc, _, index) => acc && isNearlyZero(this.components[index]), true)
    }

    abs() {
        return new Vector(
            ...this.components.map(component => Math.abs(component))
        )
    }

    round() {
        return new Vector(
            ...this.components.map(component => Math.round(component))
        )
    }

    nearestAxis() {
        const b = Vector.zero
        const xabs = Math.abs(this.components[0])
        const yabs = Math.abs(this.components[1])
        const zabs = Math.abs(this.components[2])

        if (xabs >= yabs && xabs >= zabs) b.x = (this.components[0] > 0.0) ? 1.0 : -1.0
        else if (yabs >= zabs) b.y = (this.components[1] > 0.0) ? 1.0 : -1.0
        else b.z = (this.components[2] > 0.0) ? 1.0 : -1.0

        return b
    }

    toArray() {
        return this.components
    }

    mul(number) {
        return new Vector(
            ...this.components.map(component => component * number)
        )
    }

    add({ components }) {
        return new Vector(
            ...components.map((component, index) => this.components[index] + component)
        )
    }

    sub({ components }) {
        return new Vector(
            ...components.map((component, index) => this.components[index] - component)
        )
    }

    crossProduct({ components }) {
        if (this.components.length !== 3) return // 3D vectors only
        return new Vector(
            this.components[1] * components[2] - this.components[2] * components[1],
            this.components[2] * components[0] - this.components[0] * components[2],
            this.components[0] * components[1] - this.components[1] * components[0]
        )
    }

    dotProduct({ components }) {
        return components.reduce((acc, component, index) => acc + component * this.components[index], 0)
    }
    
}

