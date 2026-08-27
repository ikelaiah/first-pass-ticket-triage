<#
.SYNOPSIS
  Serves this folder over HTTP for local development.

.DESCRIPTION
  First Pass is a static site, but it uses ES modules, which
  browsers refuse to load from file:// URLs. This script is a development
  convenience for Windows machines without Python, Node or PHP installed.

  It is NOT part of the application and is not deployed anywhere. The published
  site is plain static files.

.EXAMPLE
  .\serve.ps1
  .\serve.ps1 -Port 8080
#>
[CmdletBinding()]
param(
  [int]$Port = 8000,
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.mjs'  = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.md'   = 'text/plain; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
  '.png'  = 'image/png'
  '.txt'  = 'text/plain; charset=utf-8'
}

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)

try {
  $listener.Start()
} catch {
  Write-Host "Could not listen on $prefix" -ForegroundColor Red
  Write-Host $_.Exception.Message
  Write-Host "Try a different port:  .\serve.ps1 -Port 8080"
  exit 1
}

Write-Host ""
Write-Host "  First Pass: Ticket Triage" -ForegroundColor Cyan
Write-Host "  Serving $root"
Write-Host "  $prefix" -ForegroundColor Green
Write-Host "  Tests: ${prefix}tests/tests.html"
Write-Host "  Press Ctrl+C to stop."
Write-Host ""

if (-not $NoBrowser) { Start-Process $prefix }

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $relative = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath).TrimStart('/')
    if ([string]::IsNullOrWhiteSpace($relative)) { $relative = 'index.html' }
    $relative = $relative -replace '/', '\'

    $target = Join-Path $root $relative
    $full = [System.IO.Path]::GetFullPath($target)

    # Never serve anything outside this folder.
    if (-not $full.StartsWith([System.IO.Path]::GetFullPath($root), [System.StringComparison]::OrdinalIgnoreCase)) {
      $response.StatusCode = 403
      $response.Close()
      continue
    }

    if (Test-Path -LiteralPath $full -PathType Container) {
      $full = Join-Path $full 'index.html'
    }

    if (Test-Path -LiteralPath $full -PathType Leaf) {
      $extension = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
      $type = $mime[$extension]
      if (-not $type) { $type = 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $response.ContentType = $type
      $response.Headers.Add('Cache-Control', 'no-store')
      $response.ContentLength64 = $bytes.Length
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
      $status = 200
    } else {
      $body = [System.Text.Encoding]::UTF8.GetBytes('404 - not found')
      $response.StatusCode = 404
      $response.ContentType = 'text/plain; charset=utf-8'
      $response.ContentLength64 = $body.Length
      $response.OutputStream.Write($body, 0, $body.Length)
      $status = 404
    }

    Write-Host ("  {0}  {1}" -f $status, $request.Url.AbsolutePath)
    $response.Close()
  }
} finally {
  $listener.Stop()
  $listener.Close()
  Write-Host "`n  Stopped." -ForegroundColor Yellow
}
