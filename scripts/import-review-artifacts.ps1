param(
  [Parameter(Mandatory = $true)][string]$Endpoint,
  [Parameter(Mandatory = $true)][string]$Token,
  [string]$ReviewDirectory = "var/review/samdish"
)

$resolvedDirectory = (Resolve-Path -LiteralPath $ReviewDirectory).Path
$manifestPath = Join-Path $resolvedDirectory "manifest.json"
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json

$client = [System.Net.Http.HttpClient]::new()
$client.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new("Bearer", $Token)
$content = [System.Net.Http.MultipartFormDataContent]::new()
$manifestBytes = [System.IO.File]::ReadAllBytes($manifestPath)
$manifestContent = [System.Net.Http.ByteArrayContent]::new($manifestBytes)
$manifestContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::new("application/json")
$content.Add($manifestContent, "manifest", "manifest.json")

foreach ($item in $manifest.items) {
  $filePath = Join-Path $resolvedDirectory $item.derivative_file
  if (-not (Test-Path -LiteralPath $filePath)) { continue }
  $bytes = [System.IO.File]::ReadAllBytes($filePath)
  $fileContent = [System.Net.Http.ByteArrayContent]::new($bytes)
  $fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::new("image/webp")
  $content.Add($fileContent, "files", [string]$item.derivative_file)
}

try {
  $response = $client.PostAsync($Endpoint, $content).GetAwaiter().GetResult()
  $body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
  if (-not $response.IsSuccessStatusCode) { throw "Import failed with HTTP $([int]$response.StatusCode): $body" }
  $body
} finally {
  $content.Dispose()
  $client.Dispose()
}
