import { request } from 'https';
import { parse } from 'url';

const apiUrl = 'https://api.github.com/graphql';
const url = parse(apiUrl);

export async function query(
    token: string,
    query: string,
    variables: { [key: string]: string}
): Promise<object> {
    const payload = { query, variables };
    const payload_string = JSON.stringify(payload);

    return new Promise((resolve, reject) => {
        const req_opt = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            protocol: url.protocol,
            headers: {
                'Content-Type': "application/json",
                'Content-Length': payload_string.length,
                'Authorization': `bearer ${token}`,
                'User-Agent': "GitHub GraphQL Client"
            },
        };
        const req = request(req_opt, (res) => {
            const chunks: string[] = [];
            res.on('data', (chunk) => chunks.push(chunk.toString('utf8')));
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    return reject(res.statusMessage);
                }
                const response = chunks.join('');
                let json = undefined;
                try {
                    json = JSON.parse(response);
                } catch (e) {
                    return reject('Response not parsable as json');
                }
                if (json.error) {
                    return reject(json.error);
                }
                if (!json.data) {
                    console.log('PAYLOAD', payload_string);
                    console.log('ERRRRR', JSON.stringify(json, null, 2));
                    return reject('Unknown GraphQL error, missing data.');
                }
                return resolve(json);
            })
        });
        req.on('error', (err) => reject(err));
        req.write(payload_string);
        req.end();
    });
}