export class Percentage {
  taken: boolean;
  quantity: number;
  fibRatio = 0.618;
  constructor(public percent: number) {
    switch (percent) {
      case 1.05:
        this.fibRatio = 0.382;
        break;
      default:
        this.fibRatio = 0.5;
        break;
    }
  }
}
