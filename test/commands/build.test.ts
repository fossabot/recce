// import { expect, test } from '@oclif/test'
import { test } from '@oclif/test'
import { resolve } from 'path'

describe('build', () => {
  before(() => {
    process.chdir(resolve('test/fixtures/hello-world'))
  })
  // test
  //   .stdout()
  //   .command(['build'])
  //   .it('runs build', ctx => {
  //     expect(ctx.error).to.equal(undefined)
  //     // expect(ctx.stdout).to.contain('hello world')
  //   })

  test
    .stdout()
    .command(['build', '-p', resolve('test/fixtures/invalid')])
    .catch(/The specified path does not exist/)
    .it('throws on invalid context')

  test
    .stdout()
    .command(['build', '-p', resolve('test/fixtures/hello-world'), '-m', 'cjs'])
    .catch(/Specify at least one entry for CommonJS and UMD builds/)
    .it('throws on target cjs and no entry')

  test
    .stdout()
    .command(['build', '-p', resolve('test/fixtures/hello-world'), '-m', 'umd'])
    .catch(/Specify at least one entry for CommonJS and UMD builds/)
    .it('throws on target umd and no entry')

  test
    .stdout()
    .command(['build', '-p', resolve('test/fixtures/hello-world')])
    .it('build -p [directory]')

  // One entry

  test
    .stdout()
    .command(['build', '-p', resolve('test/fixtures/hello-world')])
    .it('build -p [directory] -e src/hello.ts')

  test
    .stdout()
    .command([
      'build',
      '-p',
      resolve('test/fixtures/hello-world'),
      '-m',
      'cjs',
      '-e',
      'src/hello.ts'
    ])
    .it('build -p [directory] -m cjs -e src/hello.ts')

  test
    .stdout()
    .command([
      'build',
      '-p',
      resolve('test/fixtures/hello-world'),
      '-m',
      'umd',
      '-e',
      'src/hello.ts'
    ])
    .it('build -p [directory] -m umd -e src/hello.ts')

  test
    .stdout()
    .command([
      'build',
      '-p',
      resolve('test/fixtures/hello-world'),
      '-m',
      'cjs',
      '-m',
      'umd',
      '-e',
      'src/hello.ts'
    ])
    .it('build -p [directory] -m cjs -m umd -e src/hello.ts')

  // Two entries

  test
    .stdout()
    .command([
      'build',
      '-p',
      resolve('test/fixtures/hello-world'),
      '-m',
      'cjs',
      '-e',
      'src/hello.ts',
      '-e',
      'src/world.ts'
    ])
    .it('build -p [directory] -m cjs -e src/hello.ts -e src/world.ts')

  test
    .stdout()
    .command([
      'build',
      '-p',
      resolve('test/fixtures/hello-world'),
      '-m',
      'umd',
      '-e',
      'src/hello.ts',
      '-e',
      'src/world.ts'
    ])
    .it('build -p [directory] -m umd -e src/hello.ts -e src/world.ts')

  test
    .stdout()
    .command([
      'build',
      '-p',
      resolve('test/fixtures/hello-world'),
      '-m',
      'cjs',
      '-m',
      'umd',
      '-e',
      'src/hello.ts',
      '-e',
      'src/world.ts'
    ])
    .it('build -p [directory] -m cjs -m umd -e src/hello.ts -e src/world.ts')
})
