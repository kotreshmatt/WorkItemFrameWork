export abstract class Identifier<T> {
    protected constructor(public readonly value: T) {}
  
    equals(other?: Identifier<T>): boolean {
      return !!other && this.value === other.value;
    }
  
    toString(): string {
      return String(this.value);
    }
  }
  