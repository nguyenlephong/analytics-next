#!/usr/bin/env ./node_modules/.bin/ts-node-script --files
import spawn from '@npmcli/promise-spawn'

/**
 * run with custom tsconfig
 * yarn ts-node-script --files scripts/create-release-from-tags.ts
 */
void (async function main() {
  const { stdout } = await spawn('ls', [])
  console.log(stdout.toString())
})()
