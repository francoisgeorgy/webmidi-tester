

/**
 * const padZero = (str: string, len: number, char: string = '0') => {
 * @param str
 * @param len
 * @param char
 * @returns {string}
 */
export function padZero(str, len, char = '0') {
    let s = '';
    let n = (len || 2) - str.length;
    while (s.length < n) s += char;
    return s + str;
}

export function b(v) {
    // noinspection JSCheckFunctionSignatures
    return (v === null || v === undefined) ? "" : padZero(v.toString(2).toUpperCase(), 8);
};

export function h(v) {
    // noinspection JSCheckFunctionSignatures
    return (v === null || v === undefined) ? "" : padZero(v.toString(16).toUpperCase(), 2);
};

export function d(v) {
    // noinspection JSCheckFunctionSignatures
    return (v === null || v === undefined) ? "" : padZero(v.toString(10).toUpperCase(), 3);
};

// hex string
// @ts-ignore
export function hs(data) {
    return (data === null || data === undefined) ? "" : (Array.from(data).map(n => h(n))).join(" ");
}    // Array.from() is necessary to get a non-typed array

export function hsbr(data, cols= 8, sepcol = '<br>', sep = '&nbsp;') {
    if (data === null || data === undefined) return "";
    // @ts-ignore
    const a = Array.from(data).map(n => h(n));  // Array.from() is necessary to get a non-typed array
    return a.reduce((acc, v, i) => {
        if (i === 0) {
            return v;
        } else if (i % cols) {
            return acc + sep + v;
        } else {
            return acc + sepcol + v;
        }
    }, '');
}

// dec string
/*
const ds = data => (data === null || data === undefined) ? "" : (Array.from(data).map(n => d(n))).join(" ");    // Array.from() is necessary to get a non-typed array

const dsbr = (data, cols= 8, sepcol = '<br>', sep = '&nbsp;') => {
    if (data === null || data === undefined) return "";
    const a = Array.from(data).map(n => d(n));  // Array.from() is necessary to get a non-typed array
    return a.reduce((acc, v, i) => {
        if (i === 0) {
            return v;
        } else if (i % cols) {
            return acc + sep + v;
        } else {
            return acc + sepcol + v;
        }
    }, '');
}
*/

// hex string compact
// @ts-ignore
export function hsc(data) {
    return (data === null || data === undefined) ? "" : (Array.from(data).map(n => h(n))).join('');    // Array.from() is necessary to get a non-typed array
}

export function fromHexString(str, sep) {
    let s = sep ? str.replace(sep, '') : str;
    if ((s.length % 2) > 0) {
        // TODO: throw an exception
        // if (global.dev) console.warn(`fromHexString: invalid hex string: ${s}`);
        return null;
    }
    let a = new Uint8Array(s.length / 2);
    for (let i=0; i < (s.length / 2); i++) {
        a[i] = parseInt(s.substr(i * 2, 2), 16);
    }
    return a;
}

