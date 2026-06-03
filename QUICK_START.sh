#!/bin/bash

# 🚀 QUICK START GUIDE - COMMANDS TO RUN

echo "================================"
echo "🎓 Plataforma Adaptativa de Aprendizaje"
echo "Universidad Javeriana - PUJ AS 2026"
echo "================================"
echo ""

# PASO 1: Verificar prerequisitos
echo "📋 PASO 1: Verificando prerequisitos..."
echo ""
echo "✓ Node.js:"
node --version
echo "✓ npm:"
npm --version
echo "✓ Docker:"
docker --version
echo "✓ Docker Compose:"
docker-compose --version
echo ""

# PASO 2: Instalar dependencias
echo "📦 PASO 2: Instalando dependencias..."
echo "npm install"
echo ""

# PASO 3: Generar claves JWT
echo "🔐 PASO 3: Generando claves JWT RS256..."
echo "npm run keys:generate"
echo ""

# PASO 4: Generar config Kong
echo "⚙️  PASO 4: Configurando Kong..."
echo "npm run kong:setup"
echo ""

# PASO 5: Levantar infraestructura
echo "🐳 PASO 5: Levantando Docker Compose..."
echo "docker-compose up -d"
echo ""
echo "Esperando 30-60 segundos para que todo inicie..."
echo "Verificar con:"
echo "  docker-compose ps"
echo "  docker-compose logs -f"
echo ""

# PASO 6: Verificar servicios
echo "🏥 PASO 6: Verificando health de servicios..."
echo ""
echo "Ejecutar en otra terminal:"
echo ""
cat << 'EOF'
for port in 3000 3001 3002 3003 3004 3005 3006 3007; do
  echo -n "Port $port: "
  curl -s http://localhost:$port/health | jq -r '.service' || echo "❌ No responde"
done
EOF
echo ""

# PASO 7: Ejecutar tests E2E
echo "🧪 PASO 7: Ejecutando tests E2E..."
echo ""
echo "Opción 1: CLI Mode (rápido)"
echo "  npm run test:e2e"
echo ""
echo "Opción 2: UI Mode (interactivo)"
echo "  npm run test:e2e:ui"
echo ""
echo "Opción 3: Debug Mode"
echo "  npm run test:e2e:debug"
echo ""

# PASO 8: Ver reporte
echo "📊 PASO 8: Viendo resultados..."
echo "npx playwright show-report"
echo ""

# PASO 9: Acceder a servicios
echo "🌐 PASO 9: URLs para acceder..."
echo ""
cat << 'EOF'
Frontend:
  http://localhost:5173

Swagger UI:
  Auth Service:         http://localhost:3000/docs
  Course Service:       http://localhost:3001/docs
  Assessment Service:   http://localhost:3002/docs
  Adaptive Service:     http://localhost:3003/docs
  Progress Service:     http://localhost:3004/docs
  Collaboration Service: http://localhost:3005/docs
  Analytics Service:    http://localhost:3006/docs
  Notification Service: http://localhost:3007/docs

API Gateway (Kong):
  http://localhost:8000

RabbitMQ Management:
  http://localhost:15672 (guest/guest)

PostgreSQL:
  localhost:5432 (admin/password)

Redis:
  localhost:6379
EOF
echo ""

# PASO 10: Detener servicios
echo "🛑 PASO 10: Para detener todo..."
echo "docker-compose down"
echo ""

echo "================================"
echo "✅ SETUP COMPLETO"
echo "================================"
echo ""
echo "Lee la documentación completa:"
echo "  cat COMPLETE_PROJECT_GUIDE.md"
echo ""
echo "O el resumen ejecutivo:"
echo "  cat EXECUTIVE_SUMMARY.md"
echo ""
