param(
  [Parameter(Mandatory = $true)][string]$Endpoint,
  [Parameter(Mandatory = $true)][string]$Token,
  [string]$ReviewDirectory = "var/review/samdish",
  [ValidateRange(1, 30)][int]$BatchSize = 4,
  [ValidateRange(0, 100000)][int]$StartOffset = 0,
  [ValidateRange(0, 100000)][int]$MaxItems = 0
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http

$resolvedDirectory = (Resolve-Path -LiteralPath $ReviewDirectory).Path
$manifestPath = Join-Path $resolvedDirectory "manifest.json"
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$lastSelected = if ($MaxItems -gt 0) { [Math]::Min($StartOffset + $MaxItems - 1, $manifest.items.Count - 1) } else { $manifest.items.Count - 1 }
$selectedItems = if ($StartOffset -le $lastSelected) { @($manifest.items[$StartOffset..$lastSelected]) } else { @() }

$client = [System.Net.Http.HttpClient]::new()
$client.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new("Bearer", $Token)
$totalImported = 0
$batchResults = @()
try {
  for ($offset = 0; $offset -lt $selectedItems.Count; $offset += $BatchSize) {
    $last = [Math]::Min($offset + $BatchSize - 1, $selectedItems.Count - 1)
    $items = @($selectedItems[$offset..$last])
    $content = [System.Net.Http.MultipartFormDataContent]::new()
    try {
      $batchManifest = @{ items = $items } | ConvertTo-Json -Depth 12 -Compress
      $manifestBytes = [System.Text.Encoding]::UTF8.GetBytes($batchManifest)
      $manifestContent = [System.Net.Http.ByteArrayContent]::new($manifestBytes)
      $manifestContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::new("application/json")
      $manifestDisposition = [System.Net.Http.Headers.ContentDispositionHeaderValue]::new("form-data")
      $manifestDisposition.Name = '"manifest"'
      $manifestDisposition.FileName = '"manifest.json"'
      $manifestContent.Headers.ContentDisposition = $manifestDisposition
      $content.Add($manifestContent)
      foreach ($item in $items) {
        $filePath = Join-Path $resolvedDirectory $item.derivative_file
        if (-not (Test-Path -LiteralPath $filePath)) { continue }
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $fileContent = [System.Net.Http.ByteArrayContent]::new($bytes)
        $fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::new("image/webp")
        $fileDisposition = [System.Net.Http.Headers.ContentDispositionHeaderValue]::new("form-data")
        $fileDisposition.Name = '"files"'
        $fileDisposition.FileName = '"' + [string]$item.derivative_file + '"'
        $fileContent.Headers.ContentDisposition = $fileDisposition
        $content.Add($fileContent)
      }
      $response = $client.PostAsync($Endpoint, $content).GetAwaiter().GetResult()
      $body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
      if (-not $response.IsSuccessStatusCode) { throw "Import failed with HTTP $([int]$response.StatusCode): $body" }
      $result = $body | ConvertFrom-Json
      $totalImported += [int]$result.imported
      $batchResults += $result
    } finally {
      $content.Dispose()
    }
  }
  @{ imported = $totalImported; batches = $batchResults.Count; selected_items = $selectedItems.Count; start_offset = $StartOffset } | ConvertTo-Json -Compress
} finally {
  $client.Dispose()
}
