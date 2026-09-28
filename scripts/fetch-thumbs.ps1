# 인스타 썸네일(og:image) 내려받기 — 2026-09-27 생성. URL은 서명이 걸려 있어 ~1일 후 만료됨.
# 실행: 프로젝트 루트에서  powershell -ExecutionPolicy Bypass -File scripts\fetch-thumbs.ps1
$ErrorActionPreference = "Stop"
$dest = Join-Path $PSScriptRoot "..\public\cafes"
$items = @(
  @{ file = "coffee-bangatgan-bukchon.jpg"; url = "https://scontent-ssn1-1.cdninstagram.com/v/t15.5256-10/825160626_28245676048392478_3103655541313586026_n.jpg?stp=cmp1_dst-jpg_e35_s640x640_tt6&_nc_cat=111&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzMifQ%3D%3D&_nc_ohc=tCEoyh0fwXEQ7kNvwHlGa7C&_nc_oc=AdpM1JBObdqqGRcw45Q4_0snUEMGo0KZnYy0ofh_JAtSORODh10EPDbmN327MVjovbs&_nc_zt=23&_nc_ht=scontent-ssn1-1.cdninstagram.com&_nc_gid=vffnglP1qI-EPR2hJPpJrg&_nc_ss=786a8&oh=00_AQKsypit70fjzJEmqw3AP4iO2vaBEyOgxCV67uqFQ55vkQ&oe=6ABEAA49" },
  @{ file = "patio-fizz-itaewon.jpg";      url = "https://scontent-ssn1-1.cdninstagram.com/v/t51.82787-15/809209237_18462439021186676_8992797980026708676_n.jpg?stp=cmp1_dst-jpg_e35_s640x640_tt6&_nc_cat=108&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzMifQ%3D%3D&_nc_ohc=0zeVeWd1VSgQ7kNvwEaAoNi&_nc_oc=AdqefWUlMvmS-1QVnAnaEAMfulZrqpAPeh7UjmMv0SEUX-7E2XPjxwBGrZVMEBWQzS8&_nc_zt=23&_nc_ht=scontent-ssn1-1.cdninstagram.com&_nc_gid=-PH9kv8OvcfXtLJDbgJ9zg&_nc_ss=786a8&oh=00_AQIivaoafkNpjFJbAb7l-yUJt2cX9gFV3LsYh3ka6PsLYg&oe=6ABEB273" }
)
foreach ($it in $items) {
  $out = Join-Path $dest $it.file
  Invoke-WebRequest -Uri $it.url -OutFile $out -UseBasicParsing
  $len = (Get-Item $out).Length
  if ($len -lt 10000) { throw "$($it.file) 다운로드 실패(크기 $len bytes) — URL 만료일 수 있음" }
  Write-Host "OK  $($it.file)  $len bytes"
}
Write-Host "완료. 이제 npm run build 후 vercel --prod 로 배포하세요."
