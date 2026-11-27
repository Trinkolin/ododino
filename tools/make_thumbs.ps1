# Vignettes des fiches pour l'onglet « Découvrir » : content/<fiche>/thumb.jpg, 480 × 320, recadrée au centre.
# À relancer après avoir ajouté ou changé la photo d'une fiche (Windows, sans rien installer) :
#   powershell -ExecutionPolicy Bypass -File tools/make_thumbs.ps1
Add-Type -AssemblyName System.Drawing
$root = Join-Path $PSScriptRoot '..\content'
$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = New-Object System.Drawing.Imaging.EncoderParameters(1)
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]78)
$W = 480; $H = 320
Get-ChildItem $root -Directory | ForEach-Object {
  $src = Join-Path $_.FullName 'photo.jpg'
  if (-not (Test-Path $src)) { return }
  $img = [System.Drawing.Image]::FromFile($src)
  try {
    $scale = [Math]::Max($W / $img.Width, $H / $img.Height)
    $sw = $W / $scale; $sh = $H / $scale
    $srcR = New-Object System.Drawing.RectangleF([single](($img.Width - $sw) / 2), [single](($img.Height - $sh) / 2), [single]$sw, [single]$sh)
    $bmp = New-Object System.Drawing.Bitmap($W, $H)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = 'HighQualityBicubic'; $g.SmoothingMode = 'HighQuality'; $g.PixelOffsetMode = 'HighQuality'
    $g.DrawImage($img, (New-Object System.Drawing.RectangleF(0, 0, $W, $H)), $srcR, [System.Drawing.GraphicsUnit]::Pixel)
    $dst = Join-Path $_.FullName 'thumb.jpg'
    $bmp.Save($dst, $enc, $params)
    $g.Dispose(); $bmp.Dispose()
    '{0} : {1} Ko' -f $_.Name, [Math]::Round((Get-Item $dst).Length / 1KB)
  } finally { $img.Dispose() }
}
