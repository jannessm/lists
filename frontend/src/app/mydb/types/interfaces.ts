import { Observable } from "rxjs";

export interface MyReactivityFactory {
    fromObservable<Data, InitData>(
        obs: Observable<Data>,
        initialValue: InitData,
        // rxDatabase: RxDatabase<any, any, any, Reactivity>
    ): any;
}