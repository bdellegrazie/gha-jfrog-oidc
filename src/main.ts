import * as core from '@actions/core'
import * as httpm from '@actions/http-client'
import { jfrogTokenExchange } from './jfrog.js'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const audience: string = core.getInput('audience', { required: true })
    const provider: string = core.getInput('provider', { required: true })
    const url: string = core.getInput('url', { required: true })

    // Get the Github Id Token (we should have write permission)
    const id_token = await core.getIDToken(audience)

    core.debug(`URL: ${url}, Provider: ${provider}, Audience: ${audience}`)
    // Get the access token from JFrog
    const _http: httpm.HttpClient = new httpm.HttpClient('jfrog-oidc-action')
    const [statusCode, token] = await jfrogTokenExchange(_http, url, provider, id_token)
    if (statusCode == (httpm.HttpCodes.OK as number)) {
      if (token) {
        core.setSecret(token)
        // Set outputs for other workflow steps to use
        core.setOutput('token', token)
      } else {
        core.setFailed(`JFrog OIDC token did not return a token, status: ${statusCode}`)
      }
    } else {
      core.setFailed(`JFrog OIDC token exchange failed, status: ${statusCode}`)
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
