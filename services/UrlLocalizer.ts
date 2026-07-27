/**
 * Utility to localize remote GitHub raw URLs to local project assets.
 * Helps migrating assets from GitHub hosting to the local project offline-ready storage.
 */
export function localizeUrl(url: string | undefined): string {
    if (!url) return "";
    
    // If it's already a local path, return it directly
    if (url.startsWith('/') || url.startsWith('.') || !url.startsWith('http')) {
        return url;
    }

    let processed = url.trim();

    // Handle any references to the game logo directly (local or remote)
    if (processed.endsWith('logo do jogo.png') || processed.endsWith('logo%20do%20jogo.png') || processed.endsWith('logojogo.png')) {
        return '/Assets/ui/logo/logojogo.png';
    }

    // 1. Process github.com blobs to raw.githubusercontent.com representation first
    if (processed.includes('github.com') && processed.includes('/blob/')) {
        processed = processed.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/').replace('?raw=true', '');
    }

    // Check if the URL is a localizable character asset for Goku Blue or Broly Ikari
    const localCharPath = getLocalCharacterAssetPath(processed);
    if (localCharPath) {
        return localCharPath;
    }

    // Check if this is a general character preview image
    const localPreviewPath = getLocalPreviewAssetPath(processed);
    if (localPreviewPath) {
        return localPreviewPath;
    }

    // 2. Normalize raw.githubusercontent.com/souzaoficialenois-ui/assetes_projeto/<hash>/ or .../main/
    // Match pattern: https://raw.githubusercontent.com/souzaoficialenois-ui/assetes_projeto/(?:[a-f0-9]{40}|main)/
    const assetesRegex = /https?:\/\/raw\.githubusercontent\.com\/souzaoficialenois-ui\/assetes_projeto\/(?:[a-f0-9]{40}|main)\//i;
    if (assetesRegex.test(processed)) {
        const localized = processed.replace(assetesRegex, '/Assets/');
        if (localized.endsWith('logo do jogo.png') || localized.endsWith('logo%20do%20jogo.png') || localized.endsWith('logojogo.png')) {
            return '/Assets/ui/logo/logojogo.png';
        }
        return localized;
    }

    // 3. Normalize raw.githubusercontent.com/souzaoficialenois-ui/Arquivos-/refs/heads/main/
    const arquivosRegex = /https?:\/\/raw\.githubusercontent\.com\/souzaoficialenois-ui\/Arquivos-\/refs\/heads\/main\//i;
    if (arquivosRegex.test(processed)) {
        return processed.replace(arquivosRegex, '/Assets/Arquivos/');
    }

    // 4. Also handle general raw.githubusercontent.com/souzaoficialenois-ui/Arquivos-/... with commit hash, main or master
    const arquivosGeneralRegex = /https?:\/\/raw\.githubusercontent\.com\/souzaoficialenois-ui\/Arquivos-\/(?:[a-f0-9]{40}|main|master)\//i;
    if (arquivosGeneralRegex.test(processed)) {
        return processed.replace(arquivosGeneralRegex, '/Assets/Arquivos/');
    }

    return processed;
}

function getLocalPreviewAssetPath(url: string): string | null {
    const lower = url.toLowerCase();
    
    // Check if it's a character preview image (contains PERSONAGENS/ directly, not in subfolder like Animacoes)
    if (lower.includes('personagens/') && !lower.includes('anima') && !lower.includes('especiais') && !lower.includes('movimentos') && !lower.includes('pulo')) {
        let fileName = url.split('/').pop() || '';
        try {
            fileName = decodeURIComponent(fileName);
        } catch(e) {}
        
        fileName = fileName.toLowerCase().replace(/\s+/g, '').replace(/%20/g, '');
        
        if (fileName === 'majinbuugohanabsorvido.png' || fileName === 'majinbuugohanabsolvido.png') {
            return '/Assets/previewpersonagens/majinbuugohanabsorvido.png';
        }
        if (fileName === 'vegetaegosuperior.png') {
            return '/Assets/previewpersonagens/vegetaegosuperior.png';
        }
        
        return `/Assets/previewpersonagens/${fileName}`;
    }
    return null;
}

const CHARACTER_MAP: Record<string, string> = {
    'goku blue': 'gokublue',
    'gokublue': 'gokublue',
    'broly ikari': 'brolyikari',
    'brolyikari': 'brolyikari',
    'freeza': 'freeza',
    'frieza': 'freeza',
    'gogeta blue': 'gogetablue',
    'gogetablue': 'gogetablue',
    'gogeta ssj4': 'gogetassj4',
    'gogetassj4': 'gogetassj4',
    'goku base': 'gokubase',
    'gokubase': 'gokubase',
    'goku black rose': 'gokublackrose',
    'gokublackrose': 'gokublackrose',
    'goku mui': 'gokumui',
    'gokumui': 'gokumui',
    'goku ssj': 'gokussj',
    'gokussj': 'gokussj',
    'kuririn': 'kuririn',
    'teen gohan ssj2': 'teengohanssj2',
    'teengohanssj2': 'teengohanssj2',
    'trunks ssj2': 'trunksssj2',
    'trunksssj2': 'trunksssj2',
    'vegeta base': 'vegetabase',
    'vegetabase': 'vegetabase',
    'vegeta ego': 'vegetaego',
    'vegetaego': 'vegetaego',
    'gogeta': 'gogeta',
    'gogetassj': 'gogetassj',
    'gogeta ssj': 'gogetassj',
    'majinbuugohan': 'majinbuugohan',
    'majin buu gohan': 'majinbuugohan',
    'nappa': 'nappa',
    'piccolo': 'piccolo',
};

function normalizeSegment(segment: string, parentNormalized: string): string {
    let clean = segment.trim();
    // Remove accents
    clean = clean.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    let cleanLower = clean.toLowerCase();

    // Specific parent context mapping
    if (parentNormalized === 'habilidadesespeciais') {
        if (cleanLower.startsWith('especial')) {
            const num = cleanLower.match(/\d+/);
            return num ? `especial${num[0]}` : cleanLower.replace(/\s+/g, '');
        }
        if (cleanLower.startsWith('ultimate')) {
            const num = cleanLower.match(/\d+/);
            return num ? `ultimate${num[0]}` : cleanLower.replace(/\s+/g, '');
        }
        if (cleanLower === 'ki blast' || cleanLower === 'kiblast') {
            return 'kiblast';
        }
    }

    if (parentNormalized === 'kiblast' || 
        parentNormalized === 'comboforte' || 
        parentNormalized === 'comboleve' || 
        parentNormalized === 'combomedio') {
        if (cleanLower === 'padrao') return 'padrao';
        if (cleanLower === 'agachado') return 'agachado';
        if (cleanLower === 'ar') return 'ar';
    }

    // Top-level categories
    if (cleanLower === 'carregando ki' || cleanLower === 'carregandoki') return 'carregandoki';
    if (cleanLower === 'combo forte' || cleanLower === 'comboforte') return 'comboforte';
    if (cleanLower === 'combo leve' || cleanLower === 'comboleve') return 'comboleve';
    if (cleanLower === 'combo medio' || cleanLower === 'combo medio' || cleanLower === 'combomedio') return 'combomedio';
    if (cleanLower === 'dano') return 'dano';
    if (cleanLower === 'defesa') return 'defesa';
    if (cleanLower === 'double tap' || cleanLower === 'doubletap') return 'doubletap';
    if (cleanLower === 'dragon rush' || cleanLower === 'dragonrush' || cleanLower === 'dragon dash') return 'dragonrush';
    if (cleanLower === 'entrada por ko' || cleanLower === 'entradaporko') return 'entradaporko';
    if (cleanLower === 'introducao' || cleanLower === 'introducao') return 'Introducao'; // Note capital I
    if (cleanLower === 'movimentos padroes' || cleanLower === 'movimentos padrao' || cleanLower === 'movimentospadrao') return 'movimentospadrao';
    if (cleanLower === 'pulo') return 'pulo';
    if (cleanLower === 'sparking') return 'sparking';
    if (cleanLower === 'super dash' || cleanLower === 'superdash') return 'superdash';
    if (cleanLower === 'teleporte') return 'teleporte';
    if (cleanLower === 'transformacoes' || cleanLower === 'transformacoes') return 'transformacoes';
    if (cleanLower === 'habilidades especiais' || cleanLower === 'habilidadesespeciais' || cleanLower === 'especiais') return 'habilidadesespeciais';

    return cleanLower.replace(/\s+/g, '');
}

function normalizeFileName(fileName: string, parentNormalized: string): string {
    const lowerName = fileName.toLowerCase().trim();
    
    if (parentNormalized === 'defesa' || parentNormalized === 'movimentospadrao') {
        return lowerName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    if (parentNormalized === 'pulo') {
        let upperName = lowerName.toUpperCase();
        if (upperName.includes('ATERRIS')) return 'ATERRISAGEM.gif';
        if (upperName.includes('CAINDO')) return 'CAINDO.gif';
        if (upperName.includes('PULO')) return 'PULO.gif';
        return upperName;
    }

    if (parentNormalized === 'teleporte') {
        if (lowerName === 'teleporte.gif') return '1.gif';
    }

    if (parentNormalized === 'dano') {
        const match = lowerName.match(/^(\d+)\.gif$/i);
        if (match) {
            return ` ${match[1]}.gif`; // In gokublue dano has leading space e.g. " 1.gif"
        }
    }

    return lowerName;
}

function getLocalCharacterAssetPath(url: string): string | null {
    let decoded = url;
    try {
        decoded = decodeURIComponent(url);
    } catch(e) {}
    
    const parts = decoded.split('/');
    let personagensIndex = -1;
    for (let i = 0; i < parts.length; i++) {
        if (parts[i].toUpperCase() === 'PERSONAGENS') {
            personagensIndex = i;
            break;
        }
    }
    
    if (personagensIndex === -1 || personagensIndex + 1 >= parts.length) {
        return null;
    }
    
    const charNameFromUrl = parts[personagensIndex + 1].toLowerCase().trim();
    const localCharFolder = CHARACTER_MAP[charNameFromUrl];
    if (!localCharFolder) {
        return null; // Not a locally supported character, fallback to remote
    }
    
    const rawSubParts = parts.slice(personagensIndex + 2);
    // Ignore noise categories like "ANIMAÇÕES", "ANIMACOES", "ANIMATIONS"
    const subParts = rawSubParts.filter(p => {
        const up = p.toUpperCase();
        return up !== 'ANIMAÇÕES' && up !== 'ANIMATIONS' && up !== 'ANIMACOES';
    });
    
    if (subParts.length === 0) {
        return `/Assets/personagens/${localCharFolder}`;
    }

    // Process all but the last segment as directories
    let currentParent = localCharFolder;
    const normalizedDirs: string[] = [];
    for (let i = 0; i < subParts.length - 1; i++) {
        const normDir = normalizeSegment(subParts[i], currentParent);
        normalizedDirs.push(normDir);
        currentParent = normDir;
    }

    // Process the last segment as filename
    const origFileName = subParts[subParts.length - 1];
    // If it's a folder-like target, normalize it as a directory, otherwise as a filename
    if (origFileName.toLowerCase().endsWith('.gif') || origFileName.toLowerCase().endsWith('.png')) {
        const normFile = normalizeFileName(origFileName, currentParent);
        return `/Assets/personagens/${localCharFolder}/${normalizedDirs.join('/')}/${normFile}`;
    } else {
        const normDir = normalizeSegment(origFileName, currentParent);
        return `/Assets/personagens/${localCharFolder}/${normalizedDirs.join('/')}/${normDir}`;
    }
}
