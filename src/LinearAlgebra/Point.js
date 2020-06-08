import Vector from '../LinearAlgebra/Vector'
import Matrix from '../LinearAlgebra/Matrix'

export default class Point {
    
    constructor(...components) {
      this.components = components
    }
    
    static get zero() {
        return new Point(0, 0, 0)
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

    abs() {
        return new Point(
            ...this.components.map(component => Math.abs(component))
        )
    }

    toVector() {
        return new Vector(...this.components)
    }

    toMatrix() {
        return new Matrix(...this.components.map(component => [component]))
    } 

    distance(b) {
        return Math.sqrt(this.components.reduce((acc, component, i) => acc + Math.pow(this.components[i]-b.components[i], 2), 0))
    }

    // return a Point = Point + Vector
    add({ components }) {
        return new Point(
            ...components.map((component, index) => this.components[index] + component)
        )
    }

    // return a Vector = Point - Point 
    sub({ components }) {
        return new Vector(
            ...components.map((component, index) => this.components[index] - component)
        )
    }

}

