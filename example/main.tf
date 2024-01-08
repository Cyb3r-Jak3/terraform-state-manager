terraform {
  backend "http" {
    address        = "http://localhost:8787/state/tfstate-example"
    lock_address   = "http://localhost:8787/state/tfstate-example/lock"
    lock_method    = "PUT"
    unlock_address = "http://localhost:8787/state/tfstate-example/lock"
    unlock_method  = "DELETE"
    username       = "admin"
    password       = "admin"
  }

  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "3.3.2"
    }
  }
}


resource "random_pet" "server" {

}

resource "random_pet" "server2" {

}


output "pet" {
  value = random_pet.server.id
}

resource "random_password" "server" {
  length = 15
}

output "pwd" {
  value     = random_password.server.result
  sensitive = true
}
