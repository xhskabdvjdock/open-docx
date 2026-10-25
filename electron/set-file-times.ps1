param(
  [Parameter(Mandatory=$true)][string]$Path,
  [string]$CreationTime = '',
  [string]$ModificationTime = '',
  [string]$AccessTime = ''
)
$ErrorActionPreference = 'Stop'
$item = Get-Item -LiteralPath $Path
$culture = [Globalization.CultureInfo]::InvariantCulture
if ($CreationTime) { $item.CreationTime = [datetime]::Parse($CreationTime, $culture) }
if ($ModificationTime) { $item.LastWriteTime = [datetime]::Parse($ModificationTime, $culture) }
if ($AccessTime) { $item.LastAccessTime = [datetime]::Parse($AccessTime, $culture) }
