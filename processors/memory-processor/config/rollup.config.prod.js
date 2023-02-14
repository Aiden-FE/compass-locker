import { nodeResolve } from '@rollup/plugin-node-resolve' // 第三方模块加载
import commonjs from '@rollup/plugin-commonjs' // cjs模块加载
import json from '@rollup/plugin-json' // json加载
import ts from "rollup-plugin-ts";
import compiler from '@ampproject/rollup-plugin-closure-compiler';
import { terser } from 'rollup-plugin-terser' // 代码压缩
import cleanup from 'rollup-plugin-cleanup';
import summary from 'rollup-plugin-summary'
import {builtinModules} from "module";
import { visualizer } from "rollup-plugin-visualizer";
import pkg from '../package.json'

const umdPlugins = [nodeResolve({ browser: true }), commonjs()];

const compressionPlugins = [
    json(),
    ts(),
    compiler(),
    terser(),
    cleanup(),
    summary({
        totalLow: 1024 * 8,
        totalHigh: 1024 * 20,
        showBrotliSize: true,
        showGzippedSize: true,
        showMinifiedSize: true,
    }),
    visualizer()
]

function entry(input, output, externalKeys = [], plugins = [...umdPlugins, ...compressionPlugins]) {
    return {
        input,
        output,
        external: [...builtinModules.concat(externalKeys)],
        plugins,
    }
}

export default [
    entry('./src/main.ts', [{ file: pkg.main, format: 'es', sourcemap: false }]),
]
