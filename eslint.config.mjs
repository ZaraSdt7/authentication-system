import tseslint from 'typescript-eslint'
import { NestConfigs } from './eslint/index.mjs'

export default tseslint.config(NestConfigs)
