param(
  [string]$InputPath = "",
  [int]$Count = 10,
  [string]$OutputPath = "public\data\lotto-results.json"
)

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-CellText {
  param($Cell, [string[]]$SharedStrings)
  $valueNode = $Cell.GetElementsByTagName("v")[0]
  if (-not $valueNode) { return $null }
  $value = $valueNode.InnerText
  if ($Cell.GetAttribute("t") -eq "s") {
    return $SharedStrings[[int]$value]
  }
  return $value
}

if ([string]::IsNullOrWhiteSpace($InputPath)) {
  $InputPath = (Get-ChildItem -Path "C:\Workspace\02.Lotto" -Filter "*.xlsx" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
}

$resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path
$resolvedOutput = Join-Path (Get-Location) $OutputPath
$zip = [System.IO.Compression.ZipFile]::OpenRead($resolvedInput)

try {
  $sharedEntry = $zip.GetEntry("xl/sharedStrings.xml")
  $sheetEntry = $zip.GetEntry("xl/worksheets/sheet1.xml")

  $sharedReader = [System.IO.StreamReader]::new($sharedEntry.Open())
  [xml]$sharedXml = $sharedReader.ReadToEnd()
  $sharedReader.Close()

  $sharedStrings = @()
  foreach ($item in $sharedXml.sst.si) {
    $sharedStrings += ($item.t | ForEach-Object { $_."#text" }) -join ""
  }

  $sheetReader = [System.IO.StreamReader]::new($sheetEntry.Open())
  [xml]$sheetXml = $sheetReader.ReadToEnd()
  $sheetReader.Close()

  $firstDraw = [datetime]"2002-12-07"
  $results = @()

  foreach ($row in $sheetXml.worksheet.sheetData.row) {
    if ([int]$row.r -eq 1) { continue }
    $cells = @{}
    foreach ($cell in $row.c) {
      $column = ([regex]::Match($cell.r, "^[A-Z]+")).Value
      $cells[$column] = Get-CellText $cell $sharedStrings
    }

    if (-not $cells.ContainsKey("B")) { continue }
    $round = [int][double]$cells["B"]
    $numbers = @("C", "D", "E", "F", "G", "H") | ForEach-Object { [int][double]$cells[$_] }
    $bonus = [int][double]$cells["I"]
    $date = $firstDraw.AddDays(7 * ($round - 1)).ToString("yyyy-MM-dd")

    $results += [pscustomobject]@{
      round = $round
      date = $date
      numbers = $numbers
      bonus = $bonus
    }

    if ($results.Count -ge $Count) { break }
  }

  $payload = [pscustomobject]@{
    updatedAt = (Get-Date).ToUniversalTime().ToString("o")
    source = "local-xlsx"
    results = $results
  }

  New-Item -ItemType Directory -Path (Split-Path -Parent $resolvedOutput) -Force | Out-Null
  $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
  [System.IO.File]::WriteAllText($resolvedOutput, (($payload | ConvertTo-Json -Depth 5) + [Environment]::NewLine), $utf8NoBom)
  Write-Host "Wrote $($results.Count) lotto results to $resolvedOutput"
  if ($results.Count -gt 0) {
    Write-Host "Latest round: $($results[0].round) ($($results[0].date))"
  }
}
finally {
  $zip.Dispose()
}
