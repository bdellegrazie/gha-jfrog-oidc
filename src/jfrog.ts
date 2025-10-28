import * as httpm from '@actions/http-client'

export interface JfrogOidcResult {
  access_token: string
}

export async function jfrogTokenExchange(
  _http: httpm.HttpClient,
  url: string,
  provider: string,
  id_token: string
): Promise<[number, string?]> {
  const res = await _http.postJson<JfrogOidcResult>(`${url}/access/api/v1/oidc/token`, {
    grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
    subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
    subject_token: id_token,
    provider_name: provider
  })

  return [res.statusCode, res.result?.access_token]
}
