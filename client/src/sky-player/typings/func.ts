// action
export type Action<T> = (arg: T) => void;
export type Action2<T1, T2> = (arg1: T1, arg2: T2) => void;
export type Action3<T1, T2, T3> = (arg1: T1, arg2: T2, arg3: T3) => void;
// predicate
export type Predicate<T> = (arg: T) => boolean;

// function
export type Func<T, TReturn> = (arg: T) => TReturn;
export type Func2<T1, T2, TReturn> = (arg1: T1, arg2: T2) => TReturn;
export type Func3<T1, T2, T3, TReturn> = (
  arg1: T1,
  arg2: T2,
  arg3: T3
) => TReturn;

// handler
export type Handler<T> = Action<T>;
