interface BoxBounds {
    columns: number;
    rows: number;
}

export function ellipsis_textbox(text: string, bounds: BoxBounds): string {
    const lines = text.split('\n');
    const cap_width = lines
        .flatMap((line) => {
            if (line.length < bounds.columns) {
                return [line];
            } else {
                const buffer: string[] = [];
                let line_buffer: string[] = [];
                let line_buffer_length: number = 0;
                const words = line.split(' ');
                for (const word of words) {
                    if (word.length + line_buffer_length > bounds.columns) {
                        buffer.push(line_buffer.join(' '));
                        line_buffer = [];
                        line_buffer_length = 0;
                    }
                    line_buffer.push(word);
                    line_buffer_length += word.length + 1;
                }
                if (line_buffer_length > 0) {
                    buffer.push(line_buffer.join(' '))
                }
                return buffer;
            }
        });

    let cap_rows = []
    if (cap_width.length > bounds.rows) {
        cap_rows = cap_width.slice(0, bounds.rows - 2);
        cap_rows.push('');
        cap_rows.push('--- More content ---');
    }  else {
        cap_rows = cap_width;
    }

    return cap_rows
        .join('\n');
}

export function ellipsis(text: string, length: number): string {
    if (text.length > length) {
        return text.substr(0, length - 3) + "...";
    }
    return text;
}