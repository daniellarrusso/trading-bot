import { Observer } from './observer';

export class Subject {
    observers: Observer[] = [];

    addObserver(observer: Observer) {
        this.observers.push(observer);
    }
    notifyObservers() {
        this.observers.forEach((element) => {
            element.update();
        });
    }
}
