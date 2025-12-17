#!/usr/bin/env node

/**
 * Documentation Generation Script for Planning Poker Pro
 * Automatically generates JSDoc documentation from source files
 * 
 * Usage:
 *   node scripts/generate-docs.js
 * 
 * Or via npm:
 *   npm run docs
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

/**
 * Log helper with color support
 * @param {string} message - Message to log
 * @param {string} color - Color key from colors object
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Check if JSDoc is installed
 * @returns {boolean} True if jsdoc exists
 */
function isJsDocInstalled() {
  try {
    execSync('npm list jsdoc', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get project root directory
 * @returns {string} Path to project root
 */
function getProjectRoot() {
  return path.dirname(path.dirname(__filename));
}

/**
 * Escape path for shell commands
 * @param {string} filePath - Path to escape
 * @returns {string} Escaped path
 */
function escapePath(filePath) {
  return '"' + filePath + '"';
}

/**
 * Find all JS files recursively
 * @param {string} dir - Directory to search
 * @returns {Array<string>} Array of JS file paths
 */
function findJsFiles(dir) {
  const files = [];
  
  function walk(currentPath) {
    try {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      
      entries.forEach(entry => {
        const fullPath = path.join(currentPath, entry.name);
        
        // Skip node_modules, docs, .git, etc
        if (entry.isDirectory()) {
          if (!['node_modules', 'docs', '.git', '.next', 'dist', 'build'].includes(entry.name)) {
            walk(fullPath);
          }
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
          files.push(fullPath);
        }
      });
    } catch (error) {
      // Ignore permission errors
    }
  }
  
  walk(dir);
  return files;
}

/**
 * Create jsdoc config file
 * @param {string} outputDir - Output directory for docs
 * @returns {object} JSDoc configuration
 */
function createJsDocConfig(outputDir) {
  const projectRoot = getProjectRoot();
  const readmePath = path.join(projectRoot, 'README.md');
  
  // Build include paths based on structure
  const includePaths = [
    path.join(projectRoot, 'public', 'src', 'core'),
    path.join(projectRoot, 'public', 'src', 'ui', 'screens'),
    path.join(projectRoot, 'public', 'src', 'ui', 'components'),
    path.join(projectRoot, 'public', 'src', 'utils'),
    path.join(projectRoot, 'server.js'),
    path.join(projectRoot, 'socketHandlers.js'),
  ].filter(p => fs.existsSync(p));
  
  log('\n📁 Chemins détectés:', 'cyan');
  includePaths.forEach(p => {
    log('   ✓ ' + p, 'yellow');
  });
  
  const config = {
    source: {
      include: includePaths,
      includePattern: '.+\\.js$',
      excludePattern: '(node_modules|docs|\\.git)',
    },
    opts: {
      destination: outputDir,
      recurse: true,
      template: 'node_modules/better-docs',
      encoding: 'utf8',
    },
    plugins: ['plugins/markdown'],
    markdown: {
      idInHeadings: true,
    },
    templates: {
      cleverLinks: true,
      monospaceLinks: true,
      default: {
        outputSourceFiles: true,
        staticFiles: path.join(projectRoot, 'docs_assets'),
      },
    },
  };

  // Ajouter README seulement s'il existe
  if (fs.existsSync(readmePath)) {
    config.opts.readme = readmePath;
    log('✅ README.md trouvé et ajouté à la configuration', 'green');
  } else {
    log('⚠️  README.md non trouvé (optionnel)', 'yellow');
  }

  return config;
}

/**
 * Install dependencies if missing
 */
function ensureDependencies() {
  log('\n🔍 Vérification des dépendances...', 'cyan');

  if (!isJsDocInstalled()) {
    log('❌ JSDoc n\'est pas installé', 'yellow');
    log('📦 Installation en cours...', 'cyan');
    try {
      execSync('npm install --save-dev jsdoc better-docs', {
        stdio: 'inherit',
      });
      log('✅ Dépendances installées', 'green');
    } catch (error) {
      log('❌ Erreur lors de l\'installation des dépendances', 'red');
      process.exit(1);
    }
  } else {
    log('✅ JSDoc est installé', 'green');
  }
}

/**
 * Clean documentation directory
 * @param {string} outputDir - Directory to clean
 */
function cleanDocsDir(outputDir) {
  if (fs.existsSync(outputDir)) {
    log('🧹 Nettoyage du dossier ' + outputDir + '...', 'cyan');
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
}

/**
 * Generate documentation using JSDoc
 * @param {string} configPath - Path to JSDoc config file
 */
function generateDocs(configPath) {
  log('\n📚 Génération de la documentation JSDoc...', 'cyan');

  try {
    const escapedConfigPath = escapePath(configPath);
    const command = 'npx jsdoc -c ' + escapedConfigPath;
    
    log('   Exécution: ' + command, 'yellow');
    
    execSync(command, {
      stdio: 'inherit',
      cwd: getProjectRoot(),
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
    });
    log('✅ Documentation générée avec succès', 'green');
  } catch (error) {
    log('❌ Erreur lors de la génération de la documentation', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

/**
 * Create index.md for documentation home
 * @param {string} outputDir - Output directory
 */
function createIndexMarkdown(outputDir) {
  const indexPath = path.join(outputDir, 'index.md');
  
  if (!fs.existsSync(indexPath)) {
    const indexContent = '# Planning Poker Pro - Documentation\n\n' +
      '## 📖 Vue d\'ensemble\n\n' +
      'Planning Poker Pro est une application de Planning Poker construite avec Node.js, Express et Socket.io.\n\n' +
      '### 🎯 Architecture du Projet\n\n' +
      '#### Frontend (public/src/)\n' +
      '- **Core** - Logique métier (PlanningPokerClient, GameState, SocketHandlers)\n' +
      '- **UI/Screens** - Écrans principaux (MenuScreen, GameScreen, ResultsScreen, etc.)\n' +
      '- **UI/Components** - Composants réutilisables (CardGrid, PlayerList, ProgressBar, etc.)\n' +
      '- **Utils** - Utilitaires et validations\n\n' +
      '#### Backend\n' +
      '- **server.js** - Serveur Express et Socket.io\n' +
      '- **socketHandlers.js** - Gestionnaires d\'événements WebSocket\n\n' +
      '## 🚀 Démarrage Rapide\n\n' +
      '```bash\n' +
      'npm install\n' +
      'npm start\n' +
      '```\n\n' +
      '## 📚 Documentation API\n\n' +
      'Voir les modules ci-dessous pour la documentation complète de chaque classe et fonction.\n\n' +
      '## 🔗 Modules Principaux\n\n' +
      '- **PlanningPokerClient** - Client principal gérant l\'état et la communication Socket\n' +
      '- **GameState** - Gestion de l\'état du jeu\n' +
      '- **SocketHandlers** - Handlers des événements WebSocket\n' +
      '- **Screens** - Écrans de l\'application\n' +
      '- **Components** - Composants UI\n' +
      '- **Validations** - Validation des données\n\n' +
      '---\n' +
      '*Generated with JSDoc*\n';

    fs.writeFileSync(indexPath, indexContent, 'utf8');
    log('✅ Fichier index.md créé', 'green');
  }
}

/**
 * Generate statistics report
 * @param {string} projectRoot - Project root directory
 * @param {string} outputDir - Output directory
 */
function generateStats(projectRoot, outputDir) {
  log('\n📊 Génération du rapport statistique...', 'cyan');

  // Find all JS files
  const jsFiles = findJsFiles(projectRoot);
  
  let totalLines = 0;
  let totalFunctions = 0;
  let totalClasses = 0;
  
  const stats = [];

  jsFiles.forEach(file => {
    try {
      const relativePath = path.relative(projectRoot, file);
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n').length;
      const functions = (content.match(/^\s*(async\s+)?function\s+|^\s*\w+\s*:\s*function|^\s*\w+\s*\([^)]*\)\s*{/gm) || []).length;
      const classes = (content.match(/^\s*class\s+\w+/gm) || []).length;

      totalLines += lines;
      totalFunctions += functions;
      totalClasses += classes;

      if (functions > 0 || classes > 0) {
        stats.push({ file: relativePath, lines, functions, classes });
      }
    } catch (error) {
      // Ignore read errors
    }
  });

  // Sort by lines (descending)
  stats.sort((a, b) => b.lines - a.lines);

  log('\n📈 Statistiques du Code:', 'cyan');
  log('─'.repeat(80), 'cyan');
  log('  Fichier' + ' '.repeat(50) + ' | Lignes | Fonctions | Classes', 'cyan');
  log('─'.repeat(80), 'cyan');
  
  stats.slice(0, 15).forEach(({ file, lines, functions, classes }) => {
    const fileName = file.length > 50 ? '...' + file.slice(-47) : file.padEnd(50);
    log('  ' + fileName + ' | ' + lines.toString().padStart(6) + ' | ' + functions.toString().padStart(9) + ' | ' + classes.toString().padStart(7));
  });

  if (stats.length > 15) {
    log('  ... et ' + (stats.length - 15) + ' fichiers supplémentaires', 'yellow');
  }

  log('─'.repeat(80), 'cyan');
  log('  ' + 'TOTAL'.padEnd(50) + ' | ' + totalLines.toString().padStart(6) + ' | ' + totalFunctions.toString().padStart(9) + ' | ' + totalClasses.toString().padStart(7), 'bright');

  // Save stats to file
  const statsFile = path.join(outputDir, 'STATS.md');
  const statsContent = createStatsMarkdown(stats, totalLines, totalFunctions, totalClasses);

  fs.writeFileSync(statsFile, statsContent, 'utf8');
  log('✅ Statistiques sauvegardées (' + stats.length + ' fichiers)', 'green');
}

/**
 * Create stats markdown content
 * @param {Array} stats - Array of statistics
 * @param {number} totalLines - Total lines of code
 * @param {number} totalFunctions - Total functions
 * @param {number} totalClasses - Total classes
 * @returns {string} Markdown content
 */
function createStatsMarkdown(stats, totalLines, totalFunctions, totalClasses) {
  const date = new Date().toLocaleString('fr-FR');
  
  let content = '# Statistiques de Code\n\n';
  content += '**Généré le**: ' + date + '\n\n';
  content += '## Résumé\n\n';
  content += '| Métrique | Valeur |\n';
  content += '|----------|--------|\n';
  content += '| Total Lignes | ' + totalLines + ' |\n';
  content += '| Total Fonctions | ' + totalFunctions + ' |\n';
  content += '| Total Classes | ' + totalClasses + ' |\n';
  content += '| Fichiers documentés | ' + stats.length + ' |\n\n';
  
  content += '## Détails par Fichier\n\n';
  content += '| Fichier | Lignes | Fonctions | Classes |\n';
  content += '|---------|--------|-----------|----------|\n';
  
  stats.forEach(({ file, lines, functions, classes }) => {
    content += '| `' + file + '` | ' + lines + ' | ' + functions + ' | ' + classes + ' |\n';
  });
  
  content += '\n## Analyse\n\n';
  content += '- **Densité de code**: ' + ((totalFunctions / totalLines) * 100).toFixed(2) + '% du code contient des définitions de fonction\n';
  content += '- **Complexité moyenne**: ' + (totalFunctions > 0 ? (totalLines / totalFunctions).toFixed(2) : '0') + ' lignes par fonction\n';
  content += '- **Taille moyenne des classes**: ' + (totalClasses > 0 ? (totalLines / totalClasses).toFixed(2) : '0') + ' lignes par classe\n\n';
  content += '---\n';
  content += '*Généré par generate-docs.js*\n';
  
  return content;
}

/**
 * Main execution function
 */
function main() {
  log('\n╔════════════════════════════════════════╗', 'bright');
  log('║  Planning Poker - Doc Generator v2.0  ║', 'bright');
  log('╚════════════════════════════════════════╝\n', 'bright');

  const projectRoot = getProjectRoot();
  const outputDir = path.join(projectRoot, 'docs');
  const configPath = path.join(projectRoot, 'jsdoc.json');

  try {
    // Step 1: Ensure dependencies
    ensureDependencies();

    // Step 2: Create JSDoc config
    log('\n⚙️  Création de la configuration JSDoc...', 'cyan');
    const config = createJsDocConfig(outputDir);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    log('✅ Configuration créée: ' + configPath, 'green');

    // Step 3: Clean output directory
    cleanDocsDir(outputDir);

    // Step 4: Generate docs
    generateDocs(configPath);

    // Step 5: Create index.md
    createIndexMarkdown(outputDir);

    // Step 6: Generate statistics
    generateStats(projectRoot, outputDir);

    // Success message
    log('\n╔════════════════════════════════════════╗', 'bright');
    log('║     ✅ Documentation générée!         ║', 'bright');
    log('╚════════════════════════════════════════╝\n', 'bright');

    log('📂 Dossier de sortie:', 'green');
    log('   ' + outputDir + '\n', 'bright');

    log('📖 Prochaines étapes:', 'cyan');
    log('   1. Ouvrir la documentation:', 'yellow');
    log('      npm run docs:serve\n', 'bright');

    log('   2. Ou naviguer vers:', 'yellow');
    log('      file://' + outputDir + '/index.html\n', 'bright');

    log('🔄 Pour surveiller les changements:', 'cyan');
    log('   npm run docs:watch\n', 'bright');

  } catch (error) {
    log('\n❌ Erreur fatale: ' + error.message, 'red');
    log(error.stack, 'red');
    process.exit(1);
  }
}

// Run main function
if (require.main === module) {
  main();
}

module.exports = {
  createJsDocConfig,
  getProjectRoot,
  findJsFiles,
};
