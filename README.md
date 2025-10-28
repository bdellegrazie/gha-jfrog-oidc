# JFrog OIDC GitHub Action

[![GitHub Super-Linter](https://github.com/bdellegrazie/gha-jfrog-oidc/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/bdellegrazie/gha-jfrog-oidc/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/bdellegrazie/gha-jfrog-oidc/actions/workflows/check-dist.yml/badge.svg)](https://github.com/bdellegrazie/gha-jfrog-oidc/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/bdellegrazie/gha-jfrog-oidc/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/bdellegrazie/gha-jfrog-oidc/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

This GitHub Action sets up OIDC based authentication with a JFrog installation. The token can be used as a Bearer token
for authentication by the Jfrog CLI, cURL or other tooling. Basic authentication is not possible as there is no
username.

## Preparation

In JFrog configure:

- an [OIDC integration][1]
  - URL for GitHub is fixed at `https://token.actions.githubusercontent.com`
- an [identity mapping][2]
  - remember the claims JSON should include the `iss` claim and at least `repository_owner`, or `repository`. See
    [Security hardening with OpenID Connect][3]

In GitHub Actions, set secrets or variables representing the audience, provider and URL.

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

## Dependency License Management

This template includes a GitHub Actions workflow, [`licensed.yml`](./.github/workflows/licensed.yml), that uses
[Licensed](https://github.com/licensee/licensed) to check for dependencies with missing or non-compliant licenses. This
workflow is initially disabled. To enable the workflow, follow the below steps.

1. Open [`licensed.yml`](./.github/workflows/licensed.yml)
1. Uncomment the following lines:

   ```yaml
   # pull_request:
   #   branches:
   #     - main
   # push:
   #   branches:
   #     - main
   ```

1. Save and commit the changes

Once complete, this workflow will run any time a pull request is created or changes pushed directly to `main`. If the
workflow detects any dependencies with missing or non-compliant licenses, it will fail the workflow and provide details
on the issue(s) found.

### Updating Licenses

Whenever you install or update dependencies, you can use the Licensed CLI to update the licenses database. To install
Licensed, see the project's [Readme](https://github.com/licensee/licensed?tab=readme-ov-file#installation).

To update the cached licenses, run the following command:

```bash
licensed cache
```

To check the status of cached licenses, run the following command:

```bash
licensed status
```

<!-- References -->

[1]: https://jfrog.com/help/r/jfrog-platform-administration-documentation/configure-an-oidc-integration
[2]: https://jfrog.com/help/r/jfrog-platform-administration-documentation/configure-identity-mappings
[3]:
  https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect
