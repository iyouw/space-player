export class OrderMap<T, Tkey> {
  private _items: Array<T>;
  private _map: Map<Tkey, T>;

  public constructor() {
    this._items = new Array<T>();
    this._map = new Map<Tkey, T>();
  }

  public get length(): number {
    return this._items.length;
  }

  public set(key: Tkey, item: T): void {
    if (this._map.has(key)) return;
    this._items.push(item);
    this._map.set(key, item);
  }

  public get(key: Tkey): T | undefined {
    return this._map.get(key);
  }

  public has(key: Tkey): boolean {
    return this._map.has(key);
  }

  public remove(key: Tkey): void {
    if (!this.has(key)) return;
    const item = this.get(key);
    this._items = this._items.filter((x) => x !== item);
    this._map.delete(key);
  }

  public values(): Array<T> {
    return this._items;
  }

  public firstOrDefault(): T | undefined {
    return this._items[0];
  }
}
