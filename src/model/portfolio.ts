export class Portfolio {
  constructor(
    public total: number = 10000,
    public multiplier: number = 1,
    public buyPrice: number = 0,
    public indicator?: string,
    public shortLimit?: number,
    public longLimit?: number
  ) {}
}
