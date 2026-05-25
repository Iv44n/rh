export function Entity<Props>() {
  abstract class EntityBase {
    constructor(props: Props) {
      Object.assign(this, props)
      Object.freeze(this)
    }

    _getAttributes(): Props {
      const entries: Array<[keyof Props, Props[keyof Props]]> =
        Object.getOwnPropertyNames(this).map(key => [
          key as keyof Props,
          (this as unknown as Props)[key as keyof Props]
        ])
      return Object.fromEntries(entries) as Props
    }

    _update(partial: Partial<Props>): this {
      const Ctor = this.constructor as new (p: Props) => this
      return new Ctor({ ...this._getAttributes(), ...partial })
    }

    static create<U extends EntityBase>(
      this: new (
        attrs: Props
      ) => U,
      attrs: Props
    ): U {
      return new this(attrs)
    }
  }

  return EntityBase as {
    new (values: Props): Props & EntityBase
    create: (typeof EntityBase)['create']
  }
}
