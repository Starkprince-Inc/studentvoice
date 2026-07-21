output "container_registry" {
  value = azurerm_container_registry.main.login_server
}

output "web_hostname" {
  value = azurerm_container_app.web.ingress[0].fqdn
}

output "api_hostname" {
  value     = azurerm_container_app.api.ingress[0].fqdn
  sensitive = true
}

output "evidence_storage_account" {
  value = azurerm_storage_account.evidence.name
}

output "postgres_fqdn" {
  value     = azurerm_postgresql_flexible_server.main.fqdn
  sensitive = true
}

output "workload_identity_client_id" {
  value = azurerm_user_assigned_identity.workload.client_id
}
