import React from 'react';
import {Box, Text} from 'ink';
import * as style from "./style";

export interface Attribute {
    title: string;
    content: string;
    marginBottom?: number;
}

function Attribute(props: { attribute: Attribute, marginLeft: number }) {
    const marginLeft = (props.marginLeft + 1) - props.attribute.title.length;
    return (
        <Box marginBottom={props.attribute.marginBottom}>
            <Text color={style.gradientStart}>{props.attribute.title}:</Text>
            <Box marginLeft={marginLeft}>
                <Text>{props.attribute.content}</Text>
            </Box>
        </Box>
    );
}

interface Props {
    attributes: Array<Attribute | React.ReactElement>;
}

function AttributeList(props: Props) {
    const longest_title = props.attributes
        .map((attribute) => {
            if (React.isValidElement(attribute)) {
                return 0;
            } else {
                return attribute.title.length;
            }
        })
        .reduce((a, b) => Math.max(a, b), 0);

    const elements = props.attributes.map((attribute) => {
        if (React.isValidElement(attribute)) {
            return attribute
        } else {
            return <Attribute
                key={attribute.title}
                attribute={attribute}
                marginLeft={longest_title}
            />;
        }
    });
    return (
        <>
            {elements}
        </>
    );
}

export default AttributeList;