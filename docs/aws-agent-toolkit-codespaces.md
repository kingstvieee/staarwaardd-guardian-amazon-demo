# AWS Agent Toolkit: Guardian demo Codespace

This is for the isolated public demo repository only. The larger STAARWAARDD application is not part of this setup.

## Codespace preparation

Open the repository's **Code > Codespaces** menu and create a Codespace from branch `setup/aws-agent-toolkit-codespaces`. The dev container provides Node.js 22 and sets these non-secret defaults:

- `AWS_PROFILE=staarwaardd`
- `AWS_REGION=us-east-1`
- `AWS_DEFAULT_REGION=us-east-1`

The dev container does not install the AWS Agent Toolkit or authenticate automatically. Follow the official AWS installation instructions in the Codespace terminal:
https://raw.githubusercontent.com/aws/agent-toolkit-for-aws/refs/heads/main/setup-instructions/setup.md

Use the **existing AWS account** instructions, not the new-account project flow. Install AWS CLI v2 and `uv` using their official installation methods if needed.

## Interactive authentication

Complete the documented `aws login` browser sign-in with profile `staarwaardd`. Verify the signed-in AWS identity using `aws sts get-caller-identity --profile staarwaardd` before configuring the toolkit. Do not copy access keys, session tokens, or credentials into source files, GitHub comments, or chat.

Run the official Agent Toolkit setup commands from the linked instructions, selecting the coding tool used in Codespaces. When editing a generated MCP server entry, preserve the existing generated configuration and set the environment variable `AWS_MCP_PROXY_PROFILES` to `staarwaardd` for the AWS MCP proxy if required by the official guide. Do not overwrite unrelated MCP server entries or agent instructions.

## Verification and boundaries

Confirm that the toolkit can list its available skills and that AWS identity verification succeeds. A working toolkit does **not** establish Bedrock model entitlement or `bedrock:InvokeModel` authorization, and it does not authenticate the separate Vercel runtime. Do not modify Vercel Marketplace service roles or permission boundaries.

Do not submit the Amazon hackathon entry. Keep this configuration in review until tested.
