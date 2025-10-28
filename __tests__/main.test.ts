/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 */

import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import nock from 'nock'

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule('@actions/core', () => core)

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const { run } = await import('../src/main.js')

describe('main.ts', () => {
  beforeEach(() => {
    // Set the action's inputs as return values from core.getInput()
    core.getInput.mockImplementation((name) => {
      switch (name) {
        case 'audience':
          return 'jfrog'
        case 'provider':
          return 'github'
        case 'url':
          return 'https://jfrog.example.com'
        default:
          return ''
      }
    })

    core.getIDToken.mockImplementation(async (aud) => {
      switch (aud) {
        case 'jfrog':
          return 'exampleIdentityToken'
        default:
          return ''
      }
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  beforeAll(() => {
    if (!nock.isActive()) nock.activate()
    nock.disableNetConnect()
    nock.enableNetConnect('127.0.0.1')
  })
  afterAll(() => {
    nock.restore()
  })

  it('sets the token output', async () => {
    const scopeJfrog = nock('https://jfrog.example.com')
      .post('/access/api/v1/oidc/token', {
        grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
        subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
        subject_token: 'exampleIdentityToken',
        provider_name: 'github'
      })
      .reply(200, {
        access_token: 'exampleAccessToken'
      })

    await run()
    scopeJfrog.done()

    expect(scopeJfrog.isDone()).toBe(true)

    // Verify that all of the core library functions were called correctly
    expect(core.error).not.toHaveBeenCalled()
    expect(core.setSecret).toHaveBeenCalledWith('exampleAccessToken')
    expect(core.debug).toHaveBeenNthCalledWith(1, 'URL: https://jfrog.example.com, Provider: github, Audience: jfrog')
    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'token', expect.stringMatching('exampleAccessToken'))
  })

  it('results in an error', async () => {
    const scopeJfrog = nock('https://jfrog.example.com')
      .post('/access/api/v1/oidc/token', {
        grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
        subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
        subject_token: 'exampleIdentityToken',
        provider_name: 'github'
      })
      .reply(401)

    await run()
    scopeJfrog.done()

    expect(scopeJfrog.isDone()).toBe(true)

    // Verify that all of the core library functions were called correctly
    expect(core.debug).toHaveBeenNthCalledWith(1, 'URL: https://jfrog.example.com, Provider: github, Audience: jfrog')
    expect(core.setFailed).toHaveBeenCalledWith('Failed request: (401)')
    expect(core.error).not.toHaveBeenCalled()
  })
})
