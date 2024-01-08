# Getting Started

## Prerequisites

1. Cloudflare Account with Workers Paid Plan.
2. `wrangler` CLI installed and configured.

## Installation

1. Fork this repository and clone it to your local machine.

2. Create a Cloudflare R2 Bucket and D1 Database and update the `wrangler.toml` with appropriate values.

3. Run all the migrations in the [migrations](./migrations) folder against the D1 Database.

4. Run `wrangler publish` to create the Worker.

5. For each of the following environment variables, create a secret using `wrangler secret put` command.

| Key | Value |
| --- | ----- |
| `INIT_PASSWORD` | Token for creating the first user |
| `TOKEN_SALT` | Secure value which is used to salt API tokens |

6. Make a POST request to the `/api/init` endpoint using Bearer Auth with the `INIT_PASSWORD` as the token and a JSON body of `{"username": "", "password": ""}. This will create the first admin user. **The init endpoint can only be used while there is no other users**.

7. Make a POST request to the `/api/token` endpoint using Basic Auth with the username and password of the user you just created. This will return a token which can be used to authenticate future requests.

8. Make a POST request to the `/api/user` endpoint using Bearer Auth with the token you just received and a JSON body of `{"username": "", "password": ""}`. This will create a new user.

9. You can now configure your Terraform projects to use this API to store state files. See the [example](./example)  and the [http backend docs](https://developer.hashicorp.com/terraform/language/settings/backends/http) for more details.
