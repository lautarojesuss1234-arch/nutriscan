# Notas de verificación local

La aplicación cargó correctamente en `http://127.0.0.1:4173/index.html`. La vista **Escáner** muestra el diseño oscuro, la barra de pestañas, el estado **Sin API**, el bloqueo visual que solicita configurar la API Key, el área de carga/cámara y el botón **Analizar con IA** deshabilitado cuando no hay API Key ni imagen.

La vista **Ajustes** se renderizó correctamente. Se verificaron el campo de API Key, el botón para mostrar/ocultar la clave, las acciones de guardar/eliminar y los objetivos diarios predeterminados: 2200 kcal, 120 g de proteínas, 250 g de carbohidratos y 70 g de grasas.

La vista **Historial** también cargó correctamente con selector de fecha, semana rápida, anillo de calorías, barras de macros y lista vacía cuando no hay registros. Se realizó una prueba temporal en `localStorage` agregando una comida de 520 kcal; el dashboard calculó correctamente el resumen de 1 comida, 520 kcal, 32 g de proteínas, 58 g de carbohidratos y 18 g de grasas. Luego se restauró el almacenamiento local al estado previo.

## Verificación de actualización Gemini y reseña IA

La interfaz local servida en `http://127.0.0.1:4174/index.html` carga correctamente y muestra el texto **Escáner con Gemini 3.5 Flash**. Se ejecutó una prueba controlada en consola con un resultado simulado que incluye `model_used: gemini-3.5-flash` y `review`. La app guardó la comida en `localStorage`, activó la vista Historial y la reseña quedó visible en la lista de comidas guardadas. El chip del resultado mostró `82% · 3.5-flash` durante la prueba previa al guardado.
