export abstract class ValueObject<T> {
    protected constructor(public readonly props: T) {}
  
    equals(other?: ValueObject<T>): boolean {
      return !!other &&
        JSON.stringify(this.props) === JSON.stringify(other.props);
    }
  }
  