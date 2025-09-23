# 🤝 Guía para Contribuir

¡Gracias por tu interés en contribuir al Sistema de Citas Profesional!

## 🚀 Configuración para desarrollo

### 1. Fork y clona el repositorio
```bash
# Fork el repo en GitHub, luego clona tu fork
git clone https://github.com/TU-USUARIO/citasobispado.git
cd citasobispado

# Configura el repositorio original como upstream
git remote add upstream https://github.com/ANAHANMEZA/citasobispado.git
```

### 2. Instala dependencias
```bash
npm install
```

### 3. Configura Supabase
1. Sigue las instrucciones en `CONFIGURACION_SUPABASE.md`
2. Crea tu propio proyecto de Supabase para pruebas
3. Actualiza `supabase-config.js` con tus credenciales de desarrollo

### 4. Ejecuta la aplicación
```bash
npm start
# O simplemente abre index.html en tu navegador
```

## 🌟 Cómo contribuir

### Reportar bugs
1. Verifica que el bug no esté ya reportado en [Issues](https://github.com/ANAHANMEZA/citasobispado/issues)
2. Crea un nuevo issue con:
   - Descripción clara del problema
   - Pasos para reproducirlo
   - Comportamiento esperado vs actual
   - Screenshots si es necesario

### Sugerir mejoras
1. Abre un issue con la etiqueta "enhancement"
2. Describe la funcionalidad propuesta
3. Explica por qué sería útil

### Enviar código
1. **Crea una rama** para tu feature:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```

2. **Haz tus cambios** siguiendo las mejores prácticas:
   - Código limpio y comentado
   - Nombres descriptivos para variables y funciones
   - Mantén la consistencia con el estilo existente

3. **Prueba tus cambios**:
   - Verifica que el formulario funcione
   - Prueba el panel de administración
   - Asegúrate de que no rompes funcionalidades existentes

4. **Commit tus cambios**:
   ```bash
   git add .
   git commit -m "feat: descripción clara de tu cambio"
   ```

5. **Push y crea Pull Request**:
   ```bash
   git push origin feature/nueva-funcionalidad
   ```
   Luego crea el PR en GitHub

## 📝 Estilo de código

### JavaScript
- Usa `const` y `let`, evita `var`
- Nombres descriptivos: `obtenerCitasPorFecha()` en lugar de `getCitas()`
- Comenta código complejo
- Maneja errores apropiadamente con try/catch

### HTML
- Usa HTML5 semántico
- Atributos descriptivos en español
- Estructura clara e indentación consistente

### CSS
- Usa clases descriptivas: `.cita-card` en lugar de `.card1`
- Organiza estilos por componente
- Usa CSS Grid/Flexbox para layouts
- Mantén responsive design

## 🎯 Ideas para contribuir

### Funcionalidades sugeridas
- [ ] **Notificaciones por email** automáticas
- [ ] **Recordatorios por SMS** antes de citas
- [ ] **Integración con Google Calendar**
- [ ] **Sistema de pagos** para citas de pago
- [ ] **Reportes y analytics** avanzados
- [ ] **App móvil** con React Native
- [ ] **Autenticación de administrador** más robusta
- [ ] **Temas personalizables** (colores, logos)
- [ ] **Múltiples profesionales** en un solo sistema
- [ ] **Chat en vivo** para consultas rápidas

### Mejoras técnicas
- [ ] **Tests unitarios** con Jest
- [ ] **GitHub Actions** para CI/CD
- [ ] **Docker** para desarrollo
- [ ] **TypeScript** para mejor tipado
- [ ] **PWA** (Progressive Web App)
- [ ] **Optimización de performance**
- [ ] **Accesibilidad** (WCAG compliance)

## 🐛 Debugging

### Errores comunes
1. **Citas no se guardan**: Verifica credenciales de Supabase
2. **Panel admin no carga**: Revisa console del navegador (F12)
3. **Estilos rotos**: Verifica paths de CSS
4. **JavaScript errors**: Usa console.log para debug

### Herramientas útiles
- **DevTools del navegador** (F12)
- **Supabase Dashboard** para ver datos
- **VS Code Extensions**: ES6, Live Server, Git Lens

## 📞 Contacto

- **Issues**: [GitHub Issues](https://github.com/ANAHANMEZA/citasobispado/issues)
- **Discusiones**: [GitHub Discussions](https://github.com/ANAHANMEZA/citasobispado/discussions)

## 🏆 Reconocimientos

Todos los contribuidores serán reconocidos en el README principal. ¡Gracias por hacer este proyecto mejor!

---

**¡Happy coding! 🚀**