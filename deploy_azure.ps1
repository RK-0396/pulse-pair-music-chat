$ErrorActionPreference = "Stop"

# Refresh Path to ensure 'az' is accessible
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

$RESOURCE_GROUP="PulsePair-RG"
$LOCATION="eastus"
$ACR_NAME="pulsepair"
$APP_SERVICE_PLAN="PulsePair-Plan"
$WEB_APP_NAME="pulse-pair"

Write-Output "======================================================"
Write-Output "Starting Azure Deployment for PulsePair"
Write-Output "======================================================"

Write-Output "`n[1/6] Creating Resource Group ($RESOURCE_GROUP)..."
az group create --name $RESOURCE_GROUP --location $LOCATION -o none

Write-Output "`n[2/6] Creating Azure Container Registry ($ACR_NAME)..."
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true -o none

Write-Output "`n[3/6] Building Docker image in Azure Container Registry (Cloud Build)..."
az acr build --registry $ACR_NAME --image pulsepair:latest . 

Write-Output "`n[4/6] Retrieving ACR credentials..."
$ACR_USERNAME = az acr credential show --name $ACR_NAME --query "username" -o tsv
$ACR_PASSWORD = az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv

Write-Output "`n[5/6] Creating App Service Plan (B1 Linux)..."
az appservice plan create --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP --sku B1 --is-linux -o none

Write-Output "`n[6/6] Creating Web App ($WEB_APP_NAME)..."
az webapp create --resource-group $RESOURCE_GROUP --plan $APP_SERVICE_PLAN --name $WEB_APP_NAME --deployment-container-image-name "$ACR_NAME.azurecr.io/pulsepair:latest" -o none

Write-Output "`nConfiguring Container Registry credentials..."
az webapp config container set --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP --docker-custom-image-name "$ACR_NAME.azurecr.io/pulsepair:latest" --docker-registry-server-url "https://$ACR_NAME.azurecr.io" --docker-registry-server-user $ACR_USERNAME --docker-registry-server-password $ACR_PASSWORD -o none

Write-Output "`nEnabling WebSockets for Socket.IO..."
az webapp config set --resource-group $RESOURCE_GROUP --name $WEB_APP_NAME --web-sockets-enabled true -o none

Write-Output "`nConfiguring Environment Variables from .env.local..."
if (Test-Path ".env.local") {
    $envContent = Get-Content .env.local | Where-Object { $_ -match "^[^#].*=.*" }
    if ($envContent) {
        az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $WEB_APP_NAME --settings $envContent -o none
    }
}

Write-Output "`n======================================================"
Write-Output "Deployment Complete! 🚀"
Write-Output "Your application is available at: https://$WEB_APP_NAME.azurewebsites.net"
Write-Output "Note: It may take 2-3 minutes for the container to start up for the first time."
Write-Output "======================================================"
