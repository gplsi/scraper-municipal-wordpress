import { chromium } from 'playwright';
import fs from 'fs';
import TurndownService from 'turndown';
import path from 'path';

const turndownService = new TurndownService();

// Configuración de sitios web a procesar
const sites = [
    {
        name: 'alboraya',
        domain: 'alboraya.es',
        languages: [
            { code: 'VA', path: 'va/noticias', name: 'valenciano' },
            { code: 'ES', path: 'es/noticias', name: 'castellano' }
        ]
    },
    {
        name: 'alcasser',
        domain: 'alcasser.es',
        languages: [
            { code: 'VA', path: 'va/noticias', name: 'valenciano' },
            { code: 'ES', path: 'es/noticias', name: 'castellano' }
        ]
    },
    {
        name: 'algemesi',
        domain: 'algemesi.es',
        languages: [
            { code: 'VA', path: 'va/noticias', name: 'valenciano' },
            { code: 'ES', path: 'es/noticias', name: 'castellano' }
        ]
    },
    {
        name: 'betera',
        domain: 'betera.es',
        languages: [
            { code: 'VA', path: 'va/noticias', name: 'valenciano' },
            { code: 'ES', path: 'es/noticias', name: 'castellano' }
        ]
    },
    {
        name: 'carcaixent',
        domain: 'carcaixent.es',
        languages: [
            { code: 'VA', path: 'va/noticias', name: 'valenciano' },
            { code: 'ES', path: 'es/noticias', name: 'castellano' }
        ]
    },
    {
        name: 'catarroja',
        domain: 'catarroja.es',
        languages: [
            { code: 'VA', path: 'va/noticias', name: 'valenciano' },
            { code: 'ES', path: 'es/noticias', name: 'castellano' }
        ]
    },
    {
        name: 'leliana',
        domain: 'leliana.es',
        languages: [
            { code: 'VA', path: 'va/noticies', name: 'valenciano' },
            { code: 'ES', path: 'es/noticias', name: 'castellano' }
        ]
    },
    {
        name: 'lliria',
        domain: 'lliria.es',
        languages: [
            { code: 'VA', path: 'va/noticias', name: 'valenciano' },
            { code: 'ES', path: 'es/noticias', name: 'castellano' }
        ]
    },
    {
        name: 'manises',
        domain: 'manises.es',
        languages: [
            { code: 'VA', path: 'va/noticias', name: 'valenciano' },
            { code: 'ES', path: 'es/noticias', name: 'castellano' }
        ]
    },
    {
        name: 'xirivella',
        domain: 'xirivella.es',
        languages: [
            { code: 'VA', path: 'va/noticias', name: 'valenciano' },
            { code: 'ES', path: 'es/noticias', name: 'castellano' }
        ]
    }
];

// Configuración de delays para ser respetuosos con el servidor
const DELAY_BETWEEN_PAGES = 3000; // 3 segundos entre páginas
const DELAY_BETWEEN_ARTICLES = 2000; // 2 segundos entre artículos

// Función para pausar la ejecución por un tiempo determinado
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Función principal para procesar un sitio web
async function processSite(site) {
    console.log(`\n========================================`);
    console.log(`=== Procesando sitio: ${site.name} ===`);
    console.log(`========================================\n`);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Directorio base para este sitio
    const baseDir = `crawl/${site.name}`;
    fs.mkdirSync(baseDir, { recursive: true });

    // Fecha actual para organizar los archivos
    const dateStr = new Date().toISOString().split('T')[0];

    // Objeto para almacenar toda la información
    const newsData = {};

    // Procesar cada idioma
    for (const lang of site.languages) {
        console.log(`\n=== Procesando noticias en ${lang.name} ===\n`);

        // Crear directorios para este idioma
        const langDir = path.join(baseDir, lang.code.toLowerCase());
        fs.mkdirSync(langDir, { recursive: true });

        // Directorios específicos para este idioma
        const htmlDir = path.join(langDir, 'html', dateStr);
        const plainDir = path.join(langDir, 'plain', dateStr);
        const mdDir = path.join(langDir, 'markdown', dateStr);
        fs.mkdirSync(htmlDir, { recursive: true });
        fs.mkdirSync(plainDir, { recursive: true });
        fs.mkdirSync(mdDir, { recursive: true });

        // Variables para paginación
        let pageNum = 0;
        let hasMorePages = true;
        let allNewsLinks = [];

        // Recorrer todas las páginas de noticias
        while (hasMorePages) {
            // Navegar a la página de noticias del idioma actual
            const pageUrl = `https://www.${site.domain}/${lang.path}?page=${pageNum}`;
            console.log(`Navegando a la página de noticias ${pageNum} en ${lang.name}: ${pageUrl}`);

            try {
                await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 40000 });

                // Scroll infinito para cargar todas las noticias en esta página
                let previousHeight;
                do {
                    previousHeight = await page.evaluate(() => document.body.scrollHeight);
                    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                    await page.waitForTimeout(5000);
                } while ((await page.evaluate(() => document.body.scrollHeight)) > previousHeight);

                // Extraer enlaces de noticias de esta página
                console.log(`Extrayendo enlaces de noticias de la página ${pageNum}...`);
                const pageNewsLinks = await page.$$eval('div.grupo-texto a', links =>
                    links.map(link => ({ title: link.innerText, url: link.href }))
                );

                console.log(`Se encontraron ${pageNewsLinks.length} noticias en la página ${pageNum} (${lang.name}).`);

                // Si no hay noticias en esta página, terminamos la paginación
                if (pageNewsLinks.length === 0) {
                    hasMorePages = false;
                    console.log(`No se encontraron más noticias. Terminando paginación.`);
                } else {
                    // Añadir los enlaces de esta página al array total
                    allNewsLinks = [...allNewsLinks, ...pageNewsLinks];
                    // Incrementar el número de página para la siguiente iteración
                    pageNum++;

                    // Delay entre páginas para ser respetuosos con el servidor
                    console.log(`Esperando ${DELAY_BETWEEN_PAGES / 1000} segundos antes de cargar la siguiente página...`);
                    await sleep(DELAY_BETWEEN_PAGES);
                }
            } catch (error) {
                console.error(`Error al navegar a ${pageUrl}:`, error.message);
                hasMorePages = false;
            }
        }

        console.log(`Total de noticias encontradas en ${lang.name}: ${allNewsLinks.length}`);

        // Procesar cada noticia
        for (let id = 1; id <= allNewsLinks.length; id++) {
            const { title, url } = allNewsLinks[id - 1];

            // Generar un ID basado en el título en lugar de un número secuencial
            const idStr = generateSlugFromTitle(title, id);

            console.log(`Procesando noticia ${id} de ${allNewsLinks.length}: ${url}`);


            try {
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 });

                const articleData = await page.evaluate(() => {
                    const titleEl = document.querySelector('div.grupo-titulares div.field-name-node-title h2');
                    const subtitleEl = document.querySelector('div.field-name-field-subtitulo div.field__item');
                    const dateEl = document.querySelector('div.field__item time');
                    const contentEls = Array.from(document.querySelectorAll('div.field__item p')) ||
                        Array.from(document.querySelectorAll('.node__content p'));

                    // Capturar el HTML del contenido para convertirlo a Markdown
                    const contentContainer = document.querySelector('.node__content') ||
                        document.querySelector('.field-name-field-cuerpo');

                    if (!titleEl || contentEls.length === 0) return null;

                    return {
                        title: titleEl.innerText,
                        subtitle: subtitleEl ? subtitleEl.innerText : "Sin subtítulo",
                        date: dateEl ? dateEl.innerText : "Sin fecha",
                        content: contentEls.map(p => p.innerText.trim()).filter(text => text).join('\n'),
                        html: contentContainer ? contentContainer.innerHTML : ''
                    };
                });

                if (articleData) {
                    // Capturar el HTML completo del cuerpo de la noticia directamente
                    const htmlContent = await page.content();
                    const { title, subtitle, date, content } = articleData;

                    // Guardar HTML completo de la página
                    const htmlPath = path.join(htmlDir, `${idStr}.html`);
                    fs.writeFileSync(htmlPath, htmlContent, 'utf-8');

                    // Guardar texto plano
                    const plainPath = path.join(plainDir, `${idStr}.txt`);
                    fs.writeFileSync(plainPath, content, 'utf-8');

                    // Extraer solo el contenido principal para Markdown
                    const mainContent = await page.$eval('.node__content, .field-name-field-cuerpo, article',
                        el => el.outerHTML
                    ).catch(() => '<div>' + content.split('\n').map(p => `<p>${p}</p>`).join('') + '</div>');

                    // Guardar Markdown
                    const mdPath = path.join(mdDir, `${idStr}.md`);
                    const markdownContent = turndownService.turndown(mainContent);
                    fs.writeFileSync(mdPath, markdownContent, 'utf-8');

                    // Clave única para esta noticia en el idioma actual
                    const newsKey = `${lang.code}/${dateStr}/${idStr}`;

                    // Guardar información en el JSON
                    newsData[newsKey] = {
                        title,
                        subtitle,
                        date,
                        url,
                        language: [lang.code],
                        path2html: htmlPath.replace(new RegExp(`^crawl/${site.name}/`), ''),
                        path2plain: plainPath.replace(new RegExp(`^crawl/${site.name}/`), ''),
                        path2md: mdPath.replace(new RegExp(`^crawl/${site.name}/`), '')
                    };
                } else {
                    console.log(`Omitiendo noticia sin contenido: ${url}`);
                }

                // Delay entre artículos para ser respetuosos con el servidor
                if (id < allNewsLinks.length) {
                    console.log(`Esperando ${DELAY_BETWEEN_ARTICLES / 1000} segundos antes de procesar la siguiente noticia...`);
                    await sleep(DELAY_BETWEEN_ARTICLES);
                }
            } catch (error) {
                console.error(`Error en la noticia ${url}:`, error.message);
            }
        }

        // Guardar JSON específico para este idioma
        console.log(`Escribiendo datos en el archivo JSON para ${lang.name}...`);
        const langData = Object.entries(newsData)
            .filter(([key]) => key.startsWith(lang.code))
            .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

        fs.writeFileSync(path.join(langDir, 'index.json'), JSON.stringify(langData, null, 4), 'utf-8');
    }

    // Guardar JSON global con todas las noticias de este sitio
    console.log(`Escribiendo datos en el archivo JSON global para ${site.name}...`);
    fs.writeFileSync(path.join(baseDir, 'index.json'), JSON.stringify(newsData, null, 4), 'utf-8');

    await browser.close();
    console.log(`\nProceso completado para el sitio ${site.name}.\n`);
}
function generateSlugFromTitle(title, fallbackId) {
    // Si no hay título, usar el ID numérico como respaldo
    if (!title || title.trim() === '') {
        return fallbackId.toString().padStart(3, '0');
    }

    // Normalizar el texto: eliminar acentos, convertir a minúsculas
    const normalized = title.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
        .toLowerCase();

    // Extraer palabras (solo caracteres alfanuméricos)
    const words = normalized.split(/[^\w]+/)
        .filter(word => word.length > 3)  // Solo palabras con más de 3 caracteres
        .slice(0, 4);                     // Tomar hasta 4 palabras

    // Si no hay palabras válidas después del filtrado, usar el ID numérico
    if (words.length === 0) {
        return fallbackId.toString().padStart(3, '0');
    }

    // Unir palabras con guiones para formar el slug
    let slug = words.join('-');

    // Limitar la longitud total a 50 caracteres
    if (slug.length > 50) {
        slug = slug.substring(0, 50);
        // Asegurarse de no cortar en medio de una palabra
        const lastDash = slug.lastIndexOf('-');
        if (lastDash > 0) {
            slug = slug.substring(0, lastDash);
        }
    }

    // Añadir un sufijo numérico para evitar colisiones
    return `${slug}-${fallbackId}`;
}
// Función principal que procesa todos los sitios en secuencia
async function processAllSites() {
    console.log("Iniciando el proceso de crawling para múltiples sitios web...");

    for (const site of sites) {
        try {
            await processSite(site);
        } catch (error) {
            console.error(`Error general procesando el sitio ${site.name}:`, error);
        }
    }

    console.log("\n¡Proceso completo! Todos los sitios han sido procesados.");
}

// Iniciar el proceso
processAllSites().catch(error => {
    console.error("Error fatal:", error);
    process.exit(1);
});
