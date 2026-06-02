# Script para reiniciar la base de datos y correr el seeder

Write-Host "1. Deteniendo contenedores y borrando datos antiguos (volúmenes)..." -ForegroundColor Cyan
docker-compose down -v

Write-Host "2. Levantando la base de datos..." -ForegroundColor Cyan
docker-compose up -d postgres

Write-Host "3. Esperando 10 segundos a que Postgres inicialice..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "4. Levantando los demás servicios (backend, etc)..." -ForegroundColor Cyan
docker-compose up -d

Write-Host "5. Esperando 15 segundos a que los servicios estén listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "6. Ejecutando el Seeder para crear Usuarios, Cursos, Evaluaciones y Foros..." -ForegroundColor Green
node .\scripts\seed_sistemas.js

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "¡TODO LISTO!" -ForegroundColor Green
Write-Host "La plataforma está limpia y con datos iniciales." -ForegroundColor White
Write-Host "Puedes ingresar en: http://localhost:5173" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Magenta
