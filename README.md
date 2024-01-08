# Terraform State Manager

Terraform State Manager (TSM) is a tool to manage terraform state files for multiple projects. It is built on top of Cloudflare Workers, using Durable Objects and D1.

See [Getting Started](./GettingStarted.md) for more details.

## Features

- [x] Create users with username and password
- [x] Create tokens for users
- [x] Auto create projects.
- [x] Store historical state files.
- [ ] API scoped to projects.
- [ ] Purge a project state files.
- [ ] OpenAPI documentation.
- [ ] Auto delete state files after a period of time.
- [ ] Maximum amount of state files per project.
