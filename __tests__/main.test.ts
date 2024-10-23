/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * , thSpecificallye inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from '@actions/core'
import nock from 'nock'
import * as main from '../src/main'

// Mock the action's main function
const runMock = jest.spyOn(main, 'run')

// Mock the GitHub Actions core library
let debugMock: jest.SpiedFunction<typeof core.debug>
let errorMock: jest.SpiedFunction<typeof core.error>
let getInputMock: jest.SpiedFunction<typeof core.getInput>
let setFailedMock: jest.SpiedFunction<typeof core.setFailed>
let setOutputMock: jest.SpiedFunction<typeof core.setOutput>

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    debugMock = jest.spyOn(core, 'debug').mockImplementation()
    errorMock = jest.spyOn(core, 'error').mockImplementation()
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
    setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
    process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'githubSampleAccessToken'
    process.env.ACTIONS_ID_TOKEN_REQUEST_URL =
      'https://github.example.com/api/token'

    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation(name => {
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
  })

  afterAll(() => {
    nock.restore()
  })

  it('sets the token output', async () => {
    const scopeGithub = nock('https://github.example.com', {
      reqheaders: {
        authorization: 'Bearer githubSampleAccessToken'
      }
    })
      .get('/api/token&audience=jfrog')
      .reply(200, {
        value: 'exampleIdentityToken'
      })

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

    await main.run()
    scopeGithub.done()
    scopeJfrog.done()

    expect(runMock).toHaveReturned()
    expect(scopeGithub.isDone()).toBe(true)
    expect(scopeJfrog.isDone()).toBe(true)

    // Verify that all of the core library functions were called correctly
    expect(debugMock).toHaveBeenNthCalledWith(
      1,
      'ID token url is https://github.example.com/api/token&audience=jfrog'
    )
    expect(debugMock).toHaveBeenNthCalledWith(
      2,
      'URL: https://jfrog.example.com, Provider: github, Audience: jfrog'
    )
    expect(setOutputMock).toHaveBeenNthCalledWith(
      1,
      'token',
      expect.stringMatching('exampleAccessToken')
    )
    expect(errorMock).not.toHaveBeenCalled()
  })

  it('results in an error', async () => {
    const scopeGithub = nock('https://github.example.com', {
      reqheaders: {
        authorization: 'Bearer githubSampleAccessToken'
      }
    })
      .get('/api/token&audience=jfrog')
      .reply(200, {
        value: 'exampleIdentityToken'
      })

    const scopeJfrog = nock('https://jfrog.example.com')
      .post('/access/api/v1/oidc/token', {
        grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
        subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
        subject_token: 'exampleIdentityToken',
        provider_name: 'github'
      })
      .reply(401)

    await main.run()
    scopeGithub.done()
    scopeJfrog.done()

    expect(runMock).toHaveReturned()
    expect(scopeGithub.isDone()).toBe(true)
    expect(scopeJfrog.isDone()).toBe(true)

    // Verify that all of the core library functions were called correctly
    expect(debugMock).toHaveBeenNthCalledWith(
      1,
      'ID token url is https://github.example.com/api/token&audience=jfrog'
    )
    expect(debugMock).toHaveBeenNthCalledWith(
      2,
      'URL: https://jfrog.example.com, Provider: github, Audience: jfrog'
    )
    expect(setFailedMock).toHaveBeenCalledWith('Failed request: (401)')
    expect(errorMock).not.toHaveBeenCalled()
  })
})
