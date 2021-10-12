import {deleteTmpFiles, yamlFile} from "../test/helpers";
import {load_and_validate_raw} from "./config-loader";
import {ConfigV1} from "./config-types";
import {isLeft, isRight, Validation} from "./validation";
import {Errors} from "./config-validator";

afterAll(deleteTmpFiles);

describe('config-loader', () => {
    it('should not validate empty file', () => {
        const config_file = yamlFile``;
        const validated: any = load_and_validate_raw(config_file);
        expect(isLeft(validated)).toBeTruthy();
        expect(validated.left).toHaveLength(1);
        expect(validated.left).toContain("Yaml must contains a 'sources' property.")
    });

    it('should not validate config without sources', () => {
        const config_file = yamlFile`
          sources: "hei"
        `;
        const validated: any = load_and_validate_raw(config_file);
        expect(isLeft(validated)).toBeTruthy();
        expect(validated.left).toHaveLength(1);
        expect(validated.left).toContain("'sources' must be an array of non-zero length.")
    });

    it('should accept and migrate beta-config', () => {
        const config_file = yamlFile`
          sources:
            - username: name
              ignore:
                - repo: repo
                - username: othername
            - organization: organization
              include:
                - team: team
                - repo: repo
              ignore:
                - username: othername
                - repo: repo
        `;
        const validated: any = load_and_validate_raw(config_file);
        expect(isRight(validated)).toBeTruthy();
        expect(validated.right.version).toBe("1.0");
        expect(validated.right.config.ignore).toHaveLength(0);
        expect(validated.right.config.renderer).toBe('terminal');
        expect(validated.right.config.backbone).toBe('eventemitter');
        expect(validated.right.config.daemon).toBe(false);
    });

    it('should accept and migrate v1-config', () => {
        const config_file = yamlFile`
          version: 1.0
          sources:
            - username: name
              ignore:
                - repo: repo
                - username: othername
            - organization: organization
              include:
                - team: team
                - repo: repo
              ignore:
                - username: othername
                - repo: repo
          config:
            ignore:
              - username: othername
              - repo: repo
            renderer: terminal
            backbone: eventemitter
            daemon: false
        `;
        const validated: any = load_and_validate_raw(config_file);
        expect(isRight(validated)).toBeTruthy();
    });

    describe('common source config', () => {
        it('should verify that just username or organization is present', () => {
            const config_file = yamlFile`
              sources: 
                - username: name
                  organization: test
            `;
            const validated: any = load_and_validate_raw(config_file);
            expect(isLeft(validated)).toBeTruthy();
            expect(validated.left).toHaveLength(1);
            expect(validated.left).toContain("'sources[0]' had both 'username' and 'organization' property. Just one is permitted at root level")
        });

        it('should verify that one of username or organization is present', () => {
            const config_file = yamlFile`
              sources: 
                - not_username: name
                  not_organization: test
            `;
            const validated: any = load_and_validate_raw(config_file);
            expect(isLeft(validated)).toBeTruthy();
            expect(validated.left).toHaveLength(1);
            expect(validated.left).toContain("'sources[0]' did not include 'username' or 'organization' property. One of these are required")
        });
    });

    describe('user config', () => {
        it('should accept missing ignore field', () => {
            const config_file = yamlFile`
              sources:
                - username: myname
            `;
            const validated: any = load_and_validate_raw(config_file);
            expect(isRight(validated)).toBeTruthy();
            expect(validated.right.sources).toHaveLength(1);
            expect(validated.right.sources[0].username).toBe('myname');
        });
        it('should validate ignore-list', () => {
            const config_file = yamlFile`
              sources:
                - username: myname
                  ignore: asd
            `;
            const validated: any = load_and_validate_raw(config_file);
            expect(isLeft(validated)).toBeTruthy();
            expect(validated.left).toHaveLength(1);
            expect(validated.left).toContain("'sources[0].ignore' is required to be 'undefined' or an 'Array'")
        });
    });

    describe('organization config', () => {
        it('should accept missing ignore field', () => {
            const config_file = yamlFile`
              sources:
                - organization: myorg
                  include: 
                    - repo: myrepo
            `;
            const validated: any = load_and_validate_raw(config_file);
            expect(isRight(validated)).toBeTruthy();
            expect(validated.right.sources).toHaveLength(1);
            expect(validated.right.sources[0].organization).toBe('myorg');
            expect(validated.right.sources[0].include[0].repo).toBe('myrepo');
        });

        it('should validate ignore-list', () => {
            const config_file = yamlFile`
              sources:
                - organization: myorg
                  include:
                    - repo: name
                  ignore: asd
            `;
            const validated: any = load_and_validate_raw(config_file);
            expect(isLeft(validated)).toBeTruthy();
            expect(validated.left).toHaveLength(1);
            expect(validated.left).toContain("'sources[0].ignore' is required to be 'undefined' or an 'Array'")
        });

        it('should verify that include-field is present', () => {
            const config_file = yamlFile`
              sources:
                - organization: myorg
            `;
            const validated: any = load_and_validate_raw(config_file);
            expect(isLeft(validated)).toBeTruthy();
            expect(validated.left).toHaveLength(1);
            expect(validated.left).toContain("'sources[0].include' must be an Array of non-zero length")
        });

        it('should verify just repo or team is present in include-list', () => {
            const config_file = yamlFile`
              sources:
                - organization: myorg
                  include:
                    - repo: myrepo
                      team: myteam
            `;
            const validated: any = load_and_validate_raw(config_file);
            expect(isLeft(validated)).toBeTruthy();
            expect(validated.left).toHaveLength(1);
            expect(validated.left).toContain("'sources[0].include[0]' had more than 1 key; 'repo, team'. Expected just one of: 'team', 'repo'")
        });

        it('should verify that one of repo or team is present in include-list', () => {
            const config_file = yamlFile`
              sources:
                - organization: myorg
                  include:
                    - not_repo: myrepo
                      not_team: myteam
            `;
            const validated: any = load_and_validate_raw(config_file);
            expect(isLeft(validated)).toBeTruthy();
            expect(validated.left).toHaveLength(1);
            expect(validated.left).toContain("'sources[0].include[0]' had more than 1 key; 'not_repo, not_team'. Expected just one of: 'team', 'repo'")
        });
    });

    describe('ignore config', () => {
        it('should verify just repo or username is present in ignore-list', () => {
            const config_file = yamlFile`
              sources:
                - username: myname
                  ignore:
                    - repo: myrepo
                      team: myteam
            `;
            const validated: any = load_and_validate_raw(config_file);
            expect(isLeft(validated)).toBeTruthy();
            expect(validated.left).toHaveLength(1);
            expect(validated.left).toContain("'sources[0].ignore[0]' had more than 1 key; 'repo, team'. Expected just one of: 'repo', 'username'")
        });

        it('should verify that one of repo or username is present in ignore-list', () => {
            const config_file = yamlFile`
              sources:
                - username: myname
                  ignore:
                    - not_repo: myrepo
                      not_team: myteam
            `;
            const validated: any = load_and_validate_raw(config_file);
            expect(isLeft(validated)).toBeTruthy();
            expect(validated.left).toHaveLength(1);
            expect(validated.left).toContain("'sources[0].ignore[0]' had more than 1 key; 'not_repo, not_team'. Expected just one of: 'repo', 'username'")
        });
    });

    describe('global config', () => {
        it('should validate global ignore config', () => {
            const config_file = yamlFile`
              version: 1.0
              sources:
                - username: myname
              config:
                ignore:
                  - repos: repos
            `;
            const validated: any = load_and_validate_raw(config_file);
            expect(isLeft(validated)).toBeTruthy();
            expect(validated.left).toHaveLength(1);
            expect(validated.left).toContain("'config.ignore[0]' had no matching keys; 'repos'. Expected one of: 'repo', 'username'")
        });

        describe('renderer', () => {
            it('should just accept known renderer options', () => {
                const config_file = yamlFile`
                  version: 1.0
                  sources:
                    - username: myname
                  config:
                    renderer: not-a-renderer
                `;
                const validated: any = load_and_validate_raw(config_file);
                expect(isLeft(validated)).toBeTruthy();
                expect(validated.left).toHaveLength(1);
                expect(validated.left).toContain("'config.renderer' is required to be one of: terminal, web")
            });

            it('should validate known options', () => {
                const terminal_config = yamlFile`
                  version: 1.0
                  sources:
                    - username: myname
                  config:
                    renderer: terminal
                `;
                const web_config = yamlFile`
                  version: 1.0
                  sources:
                    - username: myname
                  config:
                    renderer: web
                `;
                const terminalConfig: any = load_and_validate_raw(terminal_config);
                const webConfig: any = load_and_validate_raw(web_config);
                expect(isRight(terminalConfig)).toBeTruthy();
                expect(isRight(webConfig)).toBeTruthy();
                expect(terminalConfig.right.config.renderer).toBe('terminal');
                expect(webConfig.right.config.renderer).toBe('web');
            });
        });

        describe('backbone', () => {
            it('should just accept known backbone options', () => {
                const config_file = yamlFile`
                  version: 1.0
                  sources:
                    - username: myname
                  config:
                    backbone: not-a-backbone
                `;
                const validated: any = load_and_validate_raw(config_file);
                expect(isLeft(validated)).toBeTruthy();
                expect(validated.left).toHaveLength(1);
                expect(validated.left).toContain("'config.backbone' is required to be one of: ws, eventemitter")
            });

            it('should validate known options', () => {
                const ws_config = yamlFile`
                  version: 1.0
                  sources:
                    - username: myname
                  config:
                    backbone: ws
                `;
                const eventemitter_file = yamlFile`
                  version: 1.0
                  sources:
                    - username: myname
                  config:
                    backbone: eventemitter
                `;
                const validatedWS: any = load_and_validate_raw(ws_config);
                const validatedEE: any = load_and_validate_raw(eventemitter_file);
                expect(isRight(validatedWS)).toBeTruthy();
                expect(isRight(validatedEE)).toBeTruthy();
                expect(validatedWS.right.config.backbone).toBe('ws');
                expect(validatedEE.right.config.backbone).toBe('eventemitter');
            });
        });

        describe('renderer/backbone/daemon combinations', () => {
            const combination = (renderer: string, backbone: string, daemon: string) => yamlFile`
              version: 1.0
              sources:
                - username: myname
              config:
                renderer: ${renderer}
                backbone: ${backbone}
                daemon: ${daemon}
`;

            it('should allow these ws combinations', () => {
                const daemonizedWeb = combination('web', 'ws', 'true');
                const nonDaemonizedWeb = combination('web', 'ws', 'false');
                const daemonizedTerminal = combination('terminal', 'ws', 'true');
                const nonDaemonizedTerminal = combination('terminal', 'ws', 'false');

                expect(isRight(load_and_validate_raw(daemonizedWeb))).toBeTruthy();
                expect(isRight(load_and_validate_raw(nonDaemonizedWeb))).toBeTruthy();
                expect(isRight(load_and_validate_raw(daemonizedTerminal))).toBeTruthy();
                expect(isRight(load_and_validate_raw(nonDaemonizedTerminal))).toBeTruthy();
            });

            it('should allow these eventemitter combinations', () => {
                const nonDaemonizedTerminal = combination('terminal', 'eventemitter', 'false');
                const validation = load_and_validate_raw(nonDaemonizedTerminal);

                expect(isRight(validation)).toBeTruthy();
            });

            it('should prevent daemonizing of eventemitter-config', () => {
                const daemonizedEventEmitter = combination('terminal', 'eventemitter', 'true');
                const validation: any = load_and_validate_raw(daemonizedEventEmitter);

                expect(isLeft(validation)).toBeTruthy();
                expect(validation.left).toHaveLength(1);
                expect(validation.left).toContain("'config.daemon' cannot be true when using 'eventemitter' backbone");
            });

            it('should prevent web-renderer when using eventemitter backbone', () => {
                const daemonizedEventEmitter = combination('web', 'eventemitter', 'false');
                const validation: any = load_and_validate_raw(daemonizedEventEmitter);

                expect(isLeft(validation)).toBeTruthy();
                expect(validation.left).toHaveLength(1);
                expect(validation.left).toContain("'config.renderer' cannot be 'web' when using 'eventemitter' backbone");
            });
        });
    });

    it('should validate basic user config', () => {
        const config_file = yamlFile`
          sources:
            - username: __self__
              ignore:
                - repo: self/repo
                - username: username
        `;
        const validated: Validation<Errors, ConfigV1> = load_and_validate_raw(config_file);
        expect(isRight(validated)).toBeTruthy();
    });

    it('should validate basic organization config', () => {
        const config_file = yamlFile`
          sources:
            - organization: myorg
              include:
                - repo: myrepo
                - team: myteam
              ignore:
                - repo: oldrepo
                - username: username
          config:
            backbone: ws
            renderer: web
            daemon: true
            ignore:
              - repo: username
              - username: username
        `;
        const validated: Validation<Errors, ConfigV1> = load_and_validate_raw(config_file);
        expect(isRight(validated)).toBeTruthy();
    });

    it('should support multiple sources', () => {
        const config_file = yamlFile`
          sources:
            - username: __self__
              ignore:
                - repo: self/repo
                - username: username
            - organization: myorg
              include:
                - repo: myrepo
                - team: myteam
              ignore:
                - repo: oldrepo
                - username: username
        `;
        const validated: any = load_and_validate_raw(config_file);
        expect(isRight(validated)).toBeTruthy();
        expect(validated.right.sources).toHaveLength(2);
    });

    it('should support multiple errors from multiple sources', () => {
        const config_file = yamlFile`
          sources:
            - username: __self__
              ignore:
                - repos: self/repo
                - usernam: username
            - organization: myorg
              include:
                - repos: myrepo
                - team: myteam
              ignore:
                - repo: oldrepo
                - usernam: username
        `;
        const validated: any = load_and_validate_raw(config_file);
        expect(isLeft(validated)).toBeTruthy();
        expect(validated.left).toHaveLength(4);
        expect(validated.left).toMatchObject([
            "'sources[0].ignore[0]' had no matching keys; 'repos'. Expected one of: 'repo', 'username'",
            "'sources[0].ignore[1]' had no matching keys; 'usernam'. Expected one of: 'repo', 'username'",
            "'sources[1].include[0]' had no matching keys; 'repos'. Expected one of: 'team', 'repo'",
            "'sources[1].ignore[1]' had no matching keys; 'usernam'. Expected one of: 'repo', 'username'"
            ]
        );
    });
});