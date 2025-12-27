export abstract class Identifier<T> {
  protected readonly value: T;

  protected constructor(value: T) {
    this.value = value;
  }

  get(): T {
    return this.value;
  }

  equals(other?: Identifier<T>): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
