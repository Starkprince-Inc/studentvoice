locals {
  prefix  = lower("${var.project}-${var.environment}")
  compact = substr(replace(local.prefix, "-", ""), 0, 16)
  tags = {
    project        = var.project
    environment    = var.environment
    data_geography = "India"
    managed_by     = "terraform"
  }
}

resource "azurerm_resource_group" "primary" {
  name     = "rg-${local.prefix}-centralindia"
  location = var.primary_location
  tags     = local.tags
}

resource "azurerm_resource_group" "dr" {
  name     = "rg-${local.prefix}-southindia-dr"
  location = var.dr_location
  tags     = local.tags
}

resource "azurerm_virtual_network" "primary" {
  name                = "vnet-${local.prefix}"
  location            = azurerm_resource_group.primary.location
  resource_group_name = azurerm_resource_group.primary.name
  address_space       = ["10.42.0.0/16"]
  tags                = local.tags
}

resource "azurerm_subnet" "apps" {
  name                 = "snet-container-apps"
  resource_group_name  = azurerm_resource_group.primary.name
  virtual_network_name = azurerm_virtual_network.primary.name
  address_prefixes     = ["10.42.0.0/23"]

  delegation {
    name = "container-apps"
    service_delegation {
      name    = "Microsoft.App/environments"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

resource "azurerm_subnet" "private_endpoints" {
  name                              = "snet-private-endpoints"
  resource_group_name               = azurerm_resource_group.primary.name
  virtual_network_name              = azurerm_virtual_network.primary.name
  address_prefixes                  = ["10.42.4.0/24"]
  private_endpoint_network_policies = "Disabled"
}

resource "azurerm_subnet" "postgres" {
  name                 = "snet-postgres"
  resource_group_name  = azurerm_resource_group.primary.name
  virtual_network_name = azurerm_virtual_network.primary.name
  address_prefixes     = ["10.42.6.0/24"]

  delegation {
    name = "postgres"
    service_delegation {
      name    = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

resource "azurerm_log_analytics_workspace" "main" {
  name                = "log-${local.prefix}"
  location            = azurerm_resource_group.primary.location
  resource_group_name = azurerm_resource_group.primary.name
  sku                 = "PerGB2018"
  retention_in_days   = 90
  tags                = local.tags
}

resource "azurerm_application_insights" "main" {
  name                = "appi-${local.prefix}"
  location            = azurerm_resource_group.primary.location
  resource_group_name = azurerm_resource_group.primary.name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"
  tags                = local.tags
}

resource "azurerm_user_assigned_identity" "workload" {
  name                = "id-${local.prefix}-workload"
  location            = azurerm_resource_group.primary.location
  resource_group_name = azurerm_resource_group.primary.name
  tags                = local.tags
}

resource "azurerm_user_assigned_identity" "storage_cmk" {
  name                = "id-${local.prefix}-storage-cmk"
  location            = azurerm_resource_group.primary.location
  resource_group_name = azurerm_resource_group.primary.name
  tags                = local.tags
}

resource "azurerm_key_vault" "main" {
  name                          = "kv-${local.compact}-${substr(md5(data.azurerm_client_config.current.tenant_id), 0, 5)}"
  location                      = azurerm_resource_group.primary.location
  resource_group_name           = azurerm_resource_group.primary.name
  tenant_id                     = data.azurerm_client_config.current.tenant_id
  sku_name                      = "premium"
  rbac_authorization_enabled    = true
  purge_protection_enabled      = true
  soft_delete_retention_days    = 90
  public_network_access_enabled = false
  tags                          = local.tags
}

resource "azurerm_role_assignment" "terraform_key_admin" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Crypto Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}

resource "azurerm_role_assignment" "storage_crypto" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Crypto Service Encryption User"
  principal_id         = azurerm_user_assigned_identity.storage_cmk.principal_id
}

resource "azurerm_key_vault_key" "storage" {
  name         = "evidence-storage"
  key_vault_id = azurerm_key_vault.main.id
  key_type     = "RSA-HSM"
  key_size     = 3072
  key_opts     = ["decrypt", "encrypt", "sign", "unwrapKey", "verify", "wrapKey"]
  depends_on   = [azurerm_role_assignment.terraform_key_admin]

  rotation_policy {
    automatic {
      time_before_expiry = "P30D"
    }
    expire_after         = "P365D"
    notify_before_expiry = "P45D"
  }
}

resource "azurerm_storage_account" "evidence" {
  name                              = "st${local.compact}${substr(md5(azurerm_resource_group.primary.id), 0, 6)}"
  resource_group_name               = azurerm_resource_group.primary.name
  location                          = azurerm_resource_group.primary.location
  account_tier                      = "Standard"
  account_replication_type          = "GRS"
  account_kind                      = "StorageV2"
  min_tls_version                   = "TLS1_2"
  public_network_access_enabled     = false
  shared_access_key_enabled         = false
  infrastructure_encryption_enabled = true

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.storage_cmk.id]
  }

  blob_properties {
    versioning_enabled  = true
    change_feed_enabled = true
    delete_retention_policy {
      days = 30
    }
    container_delete_retention_policy {
      days = 30
    }
  }
  tags = local.tags
}

resource "azurerm_storage_account_customer_managed_key" "evidence" {
  storage_account_id        = azurerm_storage_account.evidence.id
  key_vault_id              = azurerm_key_vault.main.id
  key_name                  = azurerm_key_vault_key.storage.name
  user_assigned_identity_id = azurerm_user_assigned_identity.storage_cmk.id
}

resource "azurerm_storage_container" "originals" {
  name                  = "evidence-originals"
  storage_account_id    = azurerm_storage_account.evidence.id
  container_access_type = "private"
}

resource "azurerm_storage_container" "quarantine" {
  name                  = "evidence-quarantine"
  storage_account_id    = azurerm_storage_account.evidence.id
  container_access_type = "private"
}

resource "azurerm_storage_container" "derivatives" {
  name                  = "public-derivatives"
  storage_account_id    = azurerm_storage_account.evidence.id
  container_access_type = "private"
}

resource "azurerm_storage_container" "audit" {
  name                  = "sealed-audit"
  storage_account_id    = azurerm_storage_account.evidence.id
  container_access_type = "private"
}

resource "azurerm_storage_container_immutability_policy" "originals" {
  storage_container_resource_manager_id = azurerm_storage_container.originals.id
  immutability_period_in_days           = 2555
  protected_append_writes_all_enabled   = false
  locked                                = true
}

resource "azurerm_storage_container_immutability_policy" "audit" {
  storage_container_resource_manager_id = azurerm_storage_container.audit.id
  immutability_period_in_days           = 2555
  protected_append_writes_all_enabled   = true
  locked                                = true
}

resource "azurerm_role_assignment" "workload_blob" {
  scope                = azurerm_storage_account.evidence.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_user_assigned_identity.workload.principal_id
}

resource "azurerm_private_dns_zone" "postgres" {
  name                = "${local.prefix}.postgres.database.azure.com"
  resource_group_name = azurerm_resource_group.primary.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "postgres" {
  name                  = "postgres-vnet-link"
  private_dns_zone_name = azurerm_private_dns_zone.postgres.name
  resource_group_name   = azurerm_resource_group.primary.name
  virtual_network_id    = azurerm_virtual_network.primary.id
}

resource "azurerm_postgresql_flexible_server" "main" {
  name                         = "psql-${local.prefix}"
  resource_group_name          = azurerm_resource_group.primary.name
  location                     = azurerm_resource_group.primary.location
  version                      = "16"
  delegated_subnet_id          = azurerm_subnet.postgres.id
  private_dns_zone_id          = azurerm_private_dns_zone.postgres.id
  sku_name                     = "GP_Standard_D4s_v3"
  storage_mb                   = 131072
  backup_retention_days        = 35
  geo_redundant_backup_enabled = true
  zone                         = "1"

  high_availability {
    mode                      = "ZoneRedundant"
    standby_availability_zone = "2"
  }
  authentication {
    active_directory_auth_enabled = true
    password_auth_enabled         = false
    tenant_id                     = data.azurerm_client_config.current.tenant_id
  }
  depends_on = [azurerm_private_dns_zone_virtual_network_link.postgres]
  tags       = local.tags
}

resource "azurerm_postgresql_flexible_server_active_directory_administrator" "main" {
  server_name         = azurerm_postgresql_flexible_server.main.name
  resource_group_name = azurerm_resource_group.primary.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  object_id           = var.entra_admin_object_id
  principal_name      = var.entra_admin_name
  principal_type      = "ServicePrincipal"
}

resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = "studentvoice"
  server_id = azurerm_postgresql_flexible_server.main.id
  collation = "en_US.utf8"
  charset   = "UTF8"
}

resource "azurerm_postgresql_flexible_server_configuration" "extensions" {
  name      = "azure.extensions"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "VECTOR,PGCRYPTO,UUID-OSSP"
}

resource "azurerm_servicebus_namespace" "main" {
  name                          = "sb-${local.prefix}"
  location                      = azurerm_resource_group.primary.location
  resource_group_name           = azurerm_resource_group.primary.name
  sku                           = "Premium"
  capacity                      = 1
  premium_messaging_partitions  = 1
  public_network_access_enabled = false
  minimum_tls_version           = "1.2"
  local_auth_enabled            = false
  tags                          = local.tags
}

resource "azurerm_servicebus_queue" "media" {
  name                                    = "media-analysis"
  namespace_id                            = azurerm_servicebus_namespace.main.id
  requires_duplicate_detection            = true
  duplicate_detection_history_time_window = "PT30M"
  dead_lettering_on_message_expiration    = true
  max_delivery_count                      = 5
  lock_duration                           = "PT5M"
}

resource "azurerm_servicebus_queue" "audit" {
  name                                    = "audit-sealing"
  namespace_id                            = azurerm_servicebus_namespace.main.id
  requires_duplicate_detection            = true
  duplicate_detection_history_time_window = "PT30M"
  dead_lettering_on_message_expiration    = true
  max_delivery_count                      = 10
}

resource "azurerm_role_assignment" "workload_bus" {
  scope                = azurerm_servicebus_namespace.main.id
  role_definition_name = "Azure Service Bus Data Owner"
  principal_id         = azurerm_user_assigned_identity.workload.principal_id
}

resource "azurerm_container_registry" "main" {
  name                          = "acr${local.compact}${substr(md5(azurerm_resource_group.primary.id), 0, 5)}"
  resource_group_name           = azurerm_resource_group.primary.name
  location                      = azurerm_resource_group.primary.location
  sku                           = "Premium"
  admin_enabled                 = false
  public_network_access_enabled = false
  zone_redundancy_enabled       = true
  tags                          = local.tags
}

resource "azurerm_role_assignment" "acr_pull" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.workload.principal_id
}

resource "azurerm_container_app_environment" "main" {
  name                       = "cae-${local.prefix}"
  location                   = azurerm_resource_group.primary.location
  resource_group_name        = azurerm_resource_group.primary.name
  infrastructure_subnet_id   = azurerm_subnet.apps.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  tags                       = local.tags
}

resource "azurerm_container_app" "api" {
  name                         = "ca-${local.prefix}-api"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.primary.name
  revision_mode                = "Single"

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.workload.id]
  }
  registry {
    server   = azurerm_container_registry.main.login_server
    identity = azurerm_user_assigned_identity.workload.id
  }
  ingress {
    external_enabled = false
    target_port      = 8000
    transport        = "http"
    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }
  template {
    min_replicas = 2
    max_replicas = 10
    container {
      name   = "api"
      image  = var.api_image
      cpu    = 1
      memory = "2Gi"
      env {
        name  = "STUDENTVOICE_ENVIRONMENT"
        value = "production"
      }
      env {
        name  = "STUDENTVOICE_DATABASE_URL"
        value = "postgresql+psycopg://${azurerm_user_assigned_identity.workload.client_id}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/studentvoice?sslmode=require"
      }
      env {
        name  = "APPLICATIONINSIGHTS_CONNECTION_STRING"
        value = azurerm_application_insights.main.connection_string
      }
    }
  }
  tags = local.tags
}

resource "azurerm_container_app" "web" {
  name                         = "ca-${local.prefix}-web"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.primary.name
  revision_mode                = "Single"

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.workload.id]
  }
  registry {
    server   = azurerm_container_registry.main.login_server
    identity = azurerm_user_assigned_identity.workload.id
  }
  ingress {
    external_enabled = true
    target_port      = 3000
    transport        = "auto"
    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }
  template {
    min_replicas = 2
    max_replicas = 10
    container {
      name   = "web"
      image  = var.web_image
      cpu    = 0.5
      memory = "1Gi"
      env {
        name  = "API_BASE_URL"
        value = "https://${azurerm_container_app.api.ingress[0].fqdn}"
      }
    }
  }
  tags = local.tags
}

resource "azurerm_container_app_job" "worker" {
  name                         = "caj-${local.prefix}-worker"
  location                     = azurerm_resource_group.primary.location
  resource_group_name          = azurerm_resource_group.primary.name
  container_app_environment_id = azurerm_container_app_environment.main.id
  replica_timeout_in_seconds   = 7200
  replica_retry_limit          = 3

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.workload.id]
  }
  registry {
    server   = azurerm_container_registry.main.login_server
    identity = azurerm_user_assigned_identity.workload.id
  }
  manual_trigger_config {
    parallelism              = 1
    replica_completion_count = 1
  }
  template {
    container {
      name   = "worker"
      image  = var.worker_image
      cpu    = 2
      memory = "4Gi"
      env {
        name  = "AZURE_CLIENT_ID"
        value = azurerm_user_assigned_identity.workload.client_id
      }
    }
  }
  tags = local.tags
}

resource "azurerm_monitor_action_group" "security" {
  name                = "ag-${local.prefix}-security"
  resource_group_name = azurerm_resource_group.primary.name
  short_name          = "svsecurity"
  email_receiver {
    name                    = "security"
    email_address           = var.alert_email
    use_common_alert_schema = true
  }
  tags = local.tags
}
