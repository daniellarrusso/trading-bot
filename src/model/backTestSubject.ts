import { Subject } from './subject';

export class BackTestSubject extends Subject {
    private _value: boolean;
    public get value(): boolean {
        return this._value;
    }
    public set value(v: boolean) {
        this._value = v;
        this.notifyObservers();
    }
}
