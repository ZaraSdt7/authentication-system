import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import { NestCommonConfigs } from './common/common.configs.eslint.mjs'
import { NestIgnoreConfigs } from './ignore.eslint.mjs'
import { NestTestConfigs } from './test.eslint.mjs'
import { NestTsConfigs } from './typescript-configs/typescript.eslint.mjs'

export const NestConfigs = [
    NestIgnoreConfigs,
    NestCommonConfigs,
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    NestTsConfigs,
    NestTestConfigs,
]
