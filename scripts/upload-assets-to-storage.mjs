import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import crypto from 'node:crypto'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getStorage } from 'firebase-admin/storage'

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'])

function parseArgs(argv) {
  const args = { dryRun: false, source: 'src/assets', prefix: 'seed-assets' }
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === '--dry-run') {
      args.dryRun = true
      continue
    }
    if (token === '--source' && argv[index + 1]) {
      args.source = argv[index + 1]
      index += 1
      continue
    }
    if (token === '--prefix' && argv[index + 1]) {
      args.prefix = argv[index + 1].replace(/^\/+|\/+$/g, '')
      index += 1
    }
  }
  return args
}

async function loadDotEnv(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const separatorIndex = line.indexOf('=')
      if (separatorIndex <= 0) continue
      const key = line.slice(0, separatorIndex).trim()
      let value = line.slice(separatorIndex + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (!(key in process.env)) {
        process.env[key] = value
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}

async function collectFiles(directoryPath) {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath))
      continue
    }
    const extension = path.extname(entry.name).toLowerCase()
    if (!IMAGE_EXTENSIONS.has(extension)) continue
    files.push(fullPath)
  }

  return files
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase()
  if (extension === '.svg') return 'image/svg+xml'
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg'
  if (extension === '.png') return 'image/png'
  if (extension === '.webp') return 'image/webp'
  if (extension === '.gif') return 'image/gif'
  return 'application/octet-stream'
}

function getBucketName() {
  return process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || ''
}

function getCredential() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return Promise.resolve(cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)))
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccountPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    return fs.readFile(serviceAccountPath, 'utf8').then((content) => cert(JSON.parse(content)))
  }

  throw new Error('Credentials manquants: définis FIREBASE_SERVICE_ACCOUNT_KEY (chemin JSON) ou FIREBASE_SERVICE_ACCOUNT_JSON')
}

async function run() {
  const args = parseArgs(process.argv.slice(2))
  const rootDir = process.cwd()
  const sourceDir = path.resolve(rootDir, args.source)
  await loadDotEnv(path.join(rootDir, '.env'))

  const files = await collectFiles(sourceDir)
  if (!files.length) {
    console.log('Aucune image trouvée à uploader.')
    return
  }

  if (args.dryRun) {
    console.log(`Dry run: ${files.length} fichiers détectés dans ${args.source}`)
    for (const filePath of files) {
      const relative = path.relative(sourceDir, filePath).replaceAll(path.sep, '/')
      const destination = `${args.prefix}/${relative}`
      console.log(`${relative} -> ${destination}`)
    }
    return
  }

  const bucketName = getBucketName()
  if (!bucketName) {
    throw new Error('Variable manquante: FIREBASE_STORAGE_BUCKET ou VITE_FIREBASE_STORAGE_BUCKET')
  }

  if (!getApps().length) {
    const credential = await getCredential()
    initializeApp({ credential, storageBucket: bucketName })
  }

  const bucket = getStorage().bucket(bucketName)
  const uploaded = []

  for (const filePath of files) {
    const relative = path.relative(sourceDir, filePath).replaceAll(path.sep, '/')
    const destination = `${args.prefix}/${relative}`
    const token = crypto.randomUUID()

    await bucket.upload(filePath, {
      destination,
      resumable: false,
      metadata: {
        contentType: getContentType(filePath),
        cacheControl: 'public,max-age=31536000,immutable',
        metadata: {
          firebaseStorageDownloadTokens: token
        }
      }
    })

    const encodedPath = encodeURIComponent(destination)
    const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${token}`

    uploaded.push({
      source: relative,
      destination,
      downloadURL
    })

    console.log(`Upload OK: ${relative}`)
  }

  const outputPath = path.join(rootDir, 'scripts', 'uploaded-assets-map.json')
  await fs.writeFile(outputPath, `${JSON.stringify(uploaded, null, 2)}\n`, 'utf8')

  console.log(`Upload terminé: ${uploaded.length} fichiers`)
  console.log(`Mapping généré: ${path.relative(rootDir, outputPath)}`)
}

run().catch((error) => {
  console.error('Erreur upload assets:', error.message)
  process.exitCode = 1
})
