type InkGradientTypes =
    | 'cristal'
    | 'teen'
    | 'mind'
    | 'morning'
    | 'vice'
    | 'passion'
    | 'fruit'
    | 'instagram'
    | 'atlas'
    | 'retro'
    | 'summer'
    | 'pastel'
    | 'rainbow';
type InkBoxBorder =
    | 'single'
    | 'double'
    | 'round'
    | 'bold'
    | 'singleDouble'
    | 'doubleSingle'
    | 'classic';

export const gradient: InkGradientTypes = 'passion';
export const gradientStart: string = '#f43b47';
export const gradientEnd: string = '#453a94';

/**
 * Should be releated to `gradient`, colors found here;
 * https://github.com/bokub/gradient-string/blob/master/index.js
 */
export const borderType: InkBoxBorder = 'round';