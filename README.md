# 📄 Scraper municipal (index.mjs)

Script en Node.js con Playwright (`index.mjs`) que recorre sitios municipales, paginando sus noticias en valenciano y castellano, extrae títulos/subtítulos/fechas/contenido, y guarda HTML, TXT, Markdown e índices JSON por idioma y global.

## 🚀 Qué hace
- Navega con Playwright (Chromium headless) cada portal de `sites` (alboraya, alcasser, algemesi, bÈtera, carcaixent, catarroja, l’eliana, llíria, manises, xirivella).
- Paginación con scroll infinito, respetando delays entre páginas y artículos.
- Extrae título, subtítulo, fecha y cuerpo (párrafos) por idioma; genera slug estable a partir del título.
- Guarda HTML completo, texto plano, Markdown y un índice JSON por idioma y otro global.
- Estructura de salida organizada por sitio, idioma y fecha de ejecución.

## 📁 Estructura de salida
```
crawl/{site}/
├── index.json                      # Índice global del sitio
├── {lang}/
│   ├── index.json                  # Índice por idioma
│   ├── html/{YYYY-MM-DD}/*.html    # HTML completo
│   ├── plain/{YYYY-MM-DD}/*.txt    # Texto plano
│   └── markdown/{YYYY-MM-DD}/*.md  # Markdown del contenido principal
```

## 🧰 Requisitos
- Node.js 18+.
- Dependencias: `playwright`, `turndown`, `path` (nativo), `fs` (nativo).

Instalación rápida:
```bash
npm install playwright turndown
# o si ya está playwright en lock: npm ci
```

## ▶️ Ejecución
```bash
node index.mjs
```
Por defecto usa `chromium` headless y los delays configurados (`DELAY_BETWEEN_PAGES`, `DELAY_BETWEEN_ARTICLES`).

## 🧠 Flujo del script
1) Itera cada `site` de la lista (`domain`, `languages` con path).  
2) Para cada idioma:
   - Página con scroll hasta cargar todos los enlaces (`div.grupo-texto a`).  
   - Acumula enlaces de noticias; si una página no devuelve resultados, termina la paginación.  
3) Para cada noticia:
   - Visita la URL, extrae `title`, `subtitle`, `date`, `content` (párrafos) y HTML principal (`.node__content`/`.field-name-field-cuerpo`).  
   - Genera slug desde el título (sin acentos, 4 palabras máx., sufijo numérico).  
   - Guarda HTML completo, TXT y MD en carpetas por idioma/fecha.  
   - Actualiza índices: por idioma y global, con rutas relativas y metadatos.  
4) Escribe `index.json` por idioma y global al final; cierra el navegador.

## ⚙️ Configuración rápida
- Ajusta `sites` para añadir/quitar dominios o rutas de idioma.
- Delays: `DELAY_BETWEEN_PAGES` (ms), `DELAY_BETWEEN_ARTICLES` (ms).
- Timeouts de navegación: 40s por página/noticia; scroll con esperas de 5s.

## 📚 Referencia
Por favor, cita este conjunto de datos con el siguiente BibTeX:
```
@misc{scraper-municipal-wordpress,
  author       = {Garc\'ia Cerd\'a, Ra\'ul and Mu{\~n}oz Guillena, Rafael},
  title        = {MUNICIPAL_SCRAP_WRD Scraper}, 
  year         = {2025},
  institution  = {Language and Information Systems Group (GPLSI) and Centro de Inteligencia Digital (CENID), University of Alicante (UA)},
  howpublished = {\url{(https://github.com/gplsi/scraper-municipal-wordpress)}}
}
```

## 💰 Financiación
Este recurso está financiado por el Ministerio para la Transformación Digital y de la Función Pública — Financiado por la UE – NextGenerationEU, en el marco del proyecto Desarrollo de Modelos ALIA.

## 🙏 Agradecimientos
Expresamos nuestro agradecimiento a todas las personas e instituciones que han contribuido al desarrollo de este recurso.

Agradecimientos especiales a:

[Proveedores de datos]

[Proveedores de soporte tecnológico]

Asimismo, reconocemos las contribuciones financieras, científicas y técnicas del Ministerio para la Transformación Digital y de la Función Pública – Financiado por la UE – NextGenerationEU dentro del marco del proyecto Desarrollo de Modelos ALIA.

## ⚠️ Aviso legal
Tenga en cuenta que los datos pueden contener sesgos u otras distorsiones no deseadas. Cuando terceros desplieguen sistemas o presten servicios basados en estos datos, o los utilicen directamente, serán responsables de mitigar los riesgos asociados y de garantizar el cumplimiento de la normativa aplicable, incluida aquella relacionada con el uso de la Inteligencia Artificial.

La Universidad de Alicante, como propietaria y creadora del conjunto de datos, no será responsable de los resultados derivados del uso por parte de terceros.

## 📜 Licencia
Este proyecto se distribuye bajo la licencia Apache 2.0.
