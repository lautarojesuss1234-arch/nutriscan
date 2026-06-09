# NutriScan

**NutriScan** es una PWA de seguimiento nutricional que permite tomar o subir una foto de una comida, analizarla con Gemini Flash —consultando primero los modelos habilitados para tu API Key y priorizando Gemini 2.5 Flash cuando esté disponible— y guardar el resultado en el historial diario del navegador. La app está pensada para uso personal, con diseño oscuro, mobile-first y almacenamiento local.

> La API Key no está incluida en el código fuente. Cada usuario debe configurarla desde la vista **Ajustes**, donde se guarda únicamente en `localStorage` bajo la clave `nutriscan_api_key`.

## Funciones principales

| Área | Qué hace |
| --- | --- |
| Escáner | Permite abrir cámara, subir una foto, comprimir la imagen localmente y enviarla a Gemini para estimar calorías, macronutrientes y una reseña breve de la comida. |
| Historial | Guarda comidas por fecha con la clave `nutriscan_day_YYYY-MM-DD`, incluyendo foto comprimida, hora, calorías, proteínas, carbohidratos, grasas y reseña generada por IA. |
| Dashboard comparativo | Muestra anillo de calorías, barras de macros y lista de comidas del día seleccionado. |
| Ajustes | Permite guardar o eliminar la API Key y personalizar objetivos diarios. |
| PWA | Incluye `manifest.json`, iconos y `sw.js` con versionado de recursos para instalación, uso offline básico y actualización más confiable en celulares. |

## Cómo usarla

Abre la aplicación, entra en **Ajustes** y pega tu API Key de Google AI Studio. Luego vuelve al **Escáner**, toma o sube una foto, presiona **Analizar con IA** y guarda el resultado. En **Historial** puedes cambiar el día para ver qué comiste el lunes, martes, miércoles o cualquier fecha disponible.

## Estructura del proyecto

```text
nutriscan/
├── index.html
├── styles.css
├── app.js
├── manifest.json
├── sw.js
└── icons/
    ├── icon.svg
    ├── icon-192.png
    └── icon-512.png
```

## Privacidad y límites

Los datos de comidas, fotos comprimidas, objetivos y API Key se guardan en el almacenamiento local del navegador. No hay base de datos externa ni servidor propio. Si borras los datos del navegador, cambias de dispositivo o usas otro navegador, el historial no se sincroniza automáticamente.

Las calorías y macronutrientes son estimaciones generadas por IA. Úsalas como orientación general y no como sustituto de asesoramiento médico o nutricional profesional.

## Despliegue

Este proyecto es estático y funciona correctamente en GitHub Pages. Si actualizas archivos de la PWA, cambia también el token de versión usado en `index.html`, `app.js`, `manifest.json` y `sw.js` para evitar que celulares instalados conserven una versión vieja en caché.


## Perfil y comparación diaria

La versión actual agrega una pestaña **Perfil** donde se cargan edad, sexo para fórmula, altura, peso, actividad y objetivo corporal. La app estima calorías y macros mediante Mifflin-St Jeor, guarda todo en `localStorage` y compara cada día lo consumido contra la recomendación. El escáner también acepta detalles opcionales, como relleno o método de cocción, para mejorar el análisis de comidas ambiguas.
