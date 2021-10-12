export type Left<T> = { readonly _tag: 'left';  left: T; };
export type Right<T> = { readonly _tag: 'right';  right: T; };
export type Validation<ERROR, DATA> = Left<ERROR> | Right<DATA>
export const left = <T>(value: T) => ({ _tag: 'left', left: value }) as Left<T>;
export const right = <T>(value: T) => ({ _tag: 'right', right: value }) as Right<T>;

export function isLeft<ERROR, DATA>(validation: Validation<ERROR, DATA>): validation is Left<ERROR> {
    return validation._tag === 'left';
}
export function isRight<ERROR, DATA>(validation: Validation<ERROR, DATA>): validation is Right<DATA> {
    return validation._tag === 'right';
}