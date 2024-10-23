# JFrog OIDC GitHub Action

This GitHub Action sets up OIDC based authentication with a JFrog installation.
The token can be used as a Bearer token for authentication by the Jfrog CLI,
curl or other tooling. Basic authentication is not possible as there is no
username.

## Preparation

In JFrog configure:

- an [OIDC integration][1]
  - URL for GitHub is fixed at `https://token.actions.githubusercontent.com`
- an [identity mapping][2]
  - remember the claims JSON should include the `iss` claim and at least
    `repository_owner`, or `repository`. See [Security hardening with OpenID
    Connect][3]

In GitHub Actions, set secrets or variables representing the audience, provider
and URL.

## Usage

Use the action as follows:

```yaml
permissions:
  contents: read
  id-token: write
steps:
  - name: Checkout
    id: checkout
    uses: actions/checkout@v4

  - name: JFrog Access Token
    id: jfrog
    uses: bdellegrazie/gha-jfrog-oidc@v1
    with:
      audience: ${{ secrets.JFROG_OIDC_AUDIENCE }}
      provider: ${{ secrets.JFROG_OIDC_PROVIDER }}
      url: ${{ secrets.JFROG_OIDC_URL }}

  - name: Retrieve Artifact
    id: retrieve
    run: |
      curl -fsSL\
       --max-time 60\
       --header 'authorization: Bearer ${{ steps.jfrog.outputs.token }}'\
       "${JFROG_OIDC_URL}/artifactory/<path_to_artifact>"
```

<!-- References -->

[1]:
  https://jfrog.com/help/r/jfrog-platform-administration-documentation/configure-an-oidc-integration
[2]:
  https://jfrog.com/help/r/jfrog-platform-administration-documentation/configure-identity-mappings
[3]:
  https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect
