import { randomUUID } from 'node:crypto'
import { access, mkdir, open, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Plugin } from 'vite'
import type { IncomingMessage } from 'node:http'

const CSV_HEADER = 'id,nome,empresa,whatsapp,created_at,instagram'
const CSV_RELATIVE = path.join('data', 'leads.csv')

type LeadBody = {
  nome?: unknown
  empresa?: unknown
  whatsapp?: unknown
  instagram?: unknown
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function jsonResponse(
  res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b?: string) => void },
  status: number,
  body: Record<string, unknown>,
) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

async function ensureCsvFile(csvPath: string) {
  try {
    await access(csvPath)
  } catch {
    await mkdir(path.dirname(csvPath), { recursive: true })
    await writeFile(csvPath, `${CSV_HEADER}\n`, 'utf8')
  }
}

/** Append a CSV row; if the file has no trailing newline, insert one first. */
async function appendCsvRow(csvPath: string, row: string) {
  const handle = await open(csvPath, 'a+')
  try {
    const { size } = await handle.stat()
    if (size > 0) {
      const buf = Buffer.alloc(1)
      await handle.read(buf, 0, 1, size - 1)
      if (buf[0] !== 0x0a) {
        await handle.write('\n', size)
      }
    }
    await handle.write(`${row}\n`)
  } finally {
    await handle.close()
  }
}

export function leadsCsvPlugin(): Plugin {
  return {
    name: 'leads-csv',
    configureServer(server) {
      const csvPath = path.resolve(server.config.root, CSV_RELATIVE)

      server.middlewares.use('/api/leads', async (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        try {
          const raw = await readBody(req)
          let body: LeadBody
          try {
            body = JSON.parse(raw) as LeadBody
          } catch {
            jsonResponse(res, 400, { error: 'JSON inválido' })
            return
          }

          const nome = typeof body.nome === 'string' ? body.nome.trim() : ''
          const empresa =
            typeof body.empresa === 'string' ? body.empresa.trim() : ''
          const whatsapp =
            typeof body.whatsapp === 'string' ? body.whatsapp.trim() : ''
          const instagram =
            typeof body.instagram === 'string' ? body.instagram.trim() : ''

          if (!nome) {
            jsonResponse(res, 400, { error: 'nome é obrigatório' })
            return
          }

          const id = randomUUID()
          const createdAt = new Date().toISOString()
          const row = [
            id,
            escapeCsv(nome),
            escapeCsv(empresa),
            escapeCsv(whatsapp),
            escapeCsv(createdAt),
            escapeCsv(instagram),
          ].join(',')

          await ensureCsvFile(csvPath)
          await appendCsvRow(csvPath, row)

          jsonResponse(res, 201, { ok: true, id })
        } catch (error) {
          console.error('[leads-csv]', error)
          jsonResponse(res, 500, { error: 'Falha ao salvar lead' })
        }
      })
    },
  }
}
