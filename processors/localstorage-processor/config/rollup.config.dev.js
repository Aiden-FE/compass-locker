import json from '@rollup/plugin-json' // json加载
import ts from "rollup-plugin-ts";
import {builtinModules} from "module";

import pkg from '../package.json'

export default [
    {
        input: './src/main.ts',
        watch: {
            include: ['src/**'],
        },
        external: [...builtinModules],
        plugins: [
            json(),
            ts(),
        ],
        output: [{ file: pkg.main, format: 'es', sourcemap: true }],
    },
]
