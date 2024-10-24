/**
 * Unit tests for src/wait.ts
 */

import * as httpm from '@actions/http-client'
import { describe, expect } from '@jest/globals'
import nock from 'nock'
import { jfrogTokenExchange } from '../src/jfrog'

class NoErrorThrownError extends Error {}

const getError = async <TError>(call: () => unknown): Promise<TError> => {
  try {
    await call()

    throw new NoErrorThrownError()
  } catch (error: unknown) {
    return error as TError
  }
}

describe('jfrog.ts', () => {
  const _http = new httpm.HttpClient('test')

  afterAll(() => {
    nock.cleanAll()
  })

  describe('oidc success exchange', () => {
    it('returns access token', async () => {
      const scope = nock('https://jfrog.example.com')
        .post('/access/api/v1/oidc/token', {
          grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
          subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
          subject_token: 'exampleIdentityToken',
          provider_name: 'github'
        })
        .reply(httpm.HttpCodes.OK, {
          access_token: 'exampleAccessToken'
        })
      const [statusCode, token] = await jfrogTokenExchange(
        _http,
        'https://jfrog.example.com',
        'github',
        'exampleIdentityToken'
      )
      scope.done()

      expect(scope.isDone()).toBe(true)
      expect(statusCode).toEqual(httpm.HttpCodes.OK)
      expect(token).toEqual('exampleAccessToken')
    })
  })

  describe('oidc failed exchange', () => {
    it('rejects', async () => {
      const scope = nock('https://jfrog.example.com')
        .post('/access/api/v1/oidc/token', {
          grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
          subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
          subject_token: 'exampleIdentityToken',
          provider_name: 'github'
        })
        .reply(401, '') // Unauthorized

      const error = await getError(async () => {
        await jfrogTokenExchange(
          _http,
          'https://jfrog.example.com',
          'github',
          'exampleIdentityToken'
        )
      })
      scope.done()
      expect(scope.isDone()).toBe(true)
      expect(error).not.toBeInstanceOf(NoErrorThrownError)
      expect(error).toBeInstanceOf(httpm.HttpClientError)
    })
  })

  describe('oidc invalid exchange', () => {
    it('returns undefined access token', async () => {
      const scope = nock('https://jfrog.example.com')
        .post('/access/api/v1/oidc/token', {
          grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
          subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
          subject_token: 'exampleIdentityToken',
          provider_name: 'github'
        })
        .reply(200, '')
      const [statusCode, token] = await jfrogTokenExchange(
        _http,
        'https://jfrog.example.com',
        'github',
        'exampleIdentityToken'
      )
      scope.done()

      expect(scope.isDone()).toBe(true)
      expect(statusCode).toEqual(200)
      expect(token).toBeUndefined()
    })
  })
})
