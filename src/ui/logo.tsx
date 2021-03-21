import React from 'react';
import {Box} from "ink";
import Gradient from "ink-gradient";
import BigText from "ink-big-text";
import * as style from './style';

function Logo() {
    return (
        <Box justifyContent="center">
            <Gradient name={style.gradient}>
                <BigText text="GitNext" />
            </Gradient>
        </Box>
    );
}

export  default Logo;