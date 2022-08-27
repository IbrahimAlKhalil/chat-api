#!/usr/bin/env node

import cliProgress from 'cli-progress';
import path, {dirname} from 'path';
import {fileURLToPath} from 'url';
import Docker from 'dockerode';
import {execa} from 'execa';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const docker = new Docker(
    process.platform === 'win32'
        ? 'tcp://127.0.0.1:2375'
        : '/var/run/docker.sock',
);
const prefix = 'cab';
const images = {
    postgres: 'postgres:14.5-alpine3.16',
};
const containerNames = {
    postgres: `${prefix}-postgres`,
};

async function removeContainer(name) {
    console.log(chalk.whiteBright.bold('Removing container:'), chalk.cyan(name));

    try {
        const container = docker.getContainer(name);
        await container.stop();
    } catch (e) {
        //
    }

    try {
        const container = docker.getContainer(name);
        await container.remove();
    } catch (e) {
        //
    }
}

function pullImage(tag) {
    return new Promise(async (resolve) => {
        console.log(chalk.whiteBright.bold('Pulling image:'), chalk.cyan(tag));

        const bar = new cliProgress.SingleBar(
            {},
            cliProgress.Presets.shades_classic,
        );

        bar.start();

        function onProgress(event) {
            const {progressDetail} = event;

            // Update progressbar
            if (progressDetail) {
                bar.setTotal(progressDetail.total);
                bar.update(progressDetail.current);
            }
        }

        function onFinish() {
            bar.stop();
            resolve();
            console.log(chalk.greenBright.bold('Done ✓'));
        }

        await docker.pull(tag, (error, stream) => {
            docker.modem.followProgress(stream, onFinish, onProgress);
        });
    });
}

async function pullImages() {
    const required = [];
    const availableImages = (await docker.listImages())
        .filter((image) => image.RepoTags)
        .map((image) => image.RepoTags[0]);

    for (const k in images) {
        required.push(images[k]);
    }

    // Pull images if not available
    for (const [index, value] of required.entries()) {
        if (availableImages.includes(value)) {
            if (index + 1 === required.length) {
                return;
            }

            continue;
        }

        await pullImage(value);
    }
}

function logContainer(container, prefix) {
    // Get a random color in hex
    const color = Math.floor(Math.random() * 16777215).toString(16);

    container.logs({
        follow: true,
        stdout: true,
        stderr: true,
        details: true,
    }, (err, stream) => {
        stream.on('data', (data) => {
            let line = data.toString().trim();

            // Remove /u0000 and /u0001 characters
            line = line.replace(/[\u0000-\u001f]/g, '');

            // Don't print if the line is empty
            if (line.length === 0) {
                return;
            }

            // Remove first char from line
            line = line.substring(1);

            // Print the line
            console.log(
                chalk.hex(color).bold(`[${prefix}]`),
                line,
            );
        });
    });
}

function logProcess(_process, prefix) {
    const color = Math.floor(Math.random() * 16777215).toString(16);

    // Add prefix to each line of stdout and stderr to make it easier to distinguish

    const handle = (data) => {
        const lines = data.toString().split('\n');

        while (lines.length > 1) {
            const line = lines.shift();

            // Don't print if line is empty
            if (line.length === 0) {
                continue;
            }

            console.log(chalk.hex(color).bold(`[${prefix}]`), line.trim());
        }
    };

    _process.stdout.on('data', handle);
    _process.stderr.on('data', handle);
}

async function startPostgres() {
    console.log(chalk.greenBright.bold('Starting Postgres...'));

    console.log(chalk.whiteBright.bold('Creating volume:'), chalk.cyan(containerNames.postgres));

    try {
        await docker.createVolume({
            Name: containerNames.postgres,
        });
    } catch (e) {
        console.log(chalk.redBright.bold(`Volume ${containerNames.postgres} already exists`));
    }

    console.log(chalk.whiteBright.bold('Creating container:'), chalk.cyan(containerNames.postgres));

    const url = new URL(process.env.POSTGRES_URL);

    const postgres = await docker.createContainer({
        name: containerNames.postgres,
        Image: images.postgres,
        Cmd: ["postgres", "-c", "wal_level=logical"],
        Env: [
            `POSTGRES_DB=${url.pathname.slice(1)}`,
            `POSTGRES_USER=${url.username}`,
            `POSTGRES_PASSWORD=${url.password}`,
        ],
        Hostname: containerNames.postgres,
        HostConfig: {
            PortBindings: {
                '5432/tcp': [
                    {
                        HostIp: '127.0.0.1',
                        HostPort: `${url.port}/tcp`,
                    },
                ],
                '5432/udp': [
                    {
                        HostIp: '127.0.0.1',
                        HostPort: `${url.port}/udp`,
                    },
                ],
            },
            RestartPolicy: {
                Name: 'on-failure',
            },
            Binds: [`${containerNames.postgres}:/var/lib/postgresql/data`],
        },
    });

    await postgres.start();

    console.log(chalk.blueBright.bold('Waiting for Postgres to start...'));

    // Log the container logs
    logContainer(postgres, 'Postgres');

    // Wait for postgres to start
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log(chalk.greenBright.bold('Postgres started ✓'));
}

async function startApp() {
    console.log(chalk.greenBright.bold('Starting Application...'));

    const nestPath = path.join(__dirname, './node_modules/@nestjs/cli/bin/nest.js');

    const _process = execa('node', [nestPath, 'start', '--debug', process.env.DEBUG_PORT, '--watch'], {
        stdio: 'pipe',
        env: {
            ...process.env,
            FORCE_COLOR: true,
        },
    });

    logProcess(_process, 'Application');

    console.log(chalk.greenBright.bold('Application started ✓'));
}

async function stop() {
    console.log(chalk.redBright.bold('Stopping...'));
    await removeContainer(containerNames.postgres);

    console.log(chalk.redBright.bold('Stopped ✓'));
}

async function close() {
    // Stop all the services
    await stop();

    // Finally exit
    process.exit();
}

process.stdin.resume();
process.on('exit', close);
process.on('SIGINT', close);
process.on('SIGUSR1', close);
process.on('SIGUSR2', close);
process.on('uncaughtException', close);

await pullImages().catch(console.error);
await stop();

await startPostgres();
await startApp();

console.log(chalk.greenBright.bold('All services started ✓'));
