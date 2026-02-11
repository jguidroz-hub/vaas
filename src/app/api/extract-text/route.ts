import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      // Extract text from PDF using basic parsing
      // We'll use a simple regex approach for text-based PDFs
      // For production, you'd use pdf-parse or similar
      text = extractTextFromPDF(buffer);
      if (!text.trim()) {
        text = '[PDF appears to be image-based or empty. Please paste the key points from your document above.]';
      }
    } else {
      // Plain text files
      text = buffer.toString('utf-8');
    }

    // Truncate to reasonable size
    text = text.slice(0, 5000);

    return NextResponse.json({ text, filename: file.name });
  } catch (error: any) {
    console.error('[extract-text] Error:', error.message);
    return NextResponse.json({ error: 'Failed to extract text' }, { status: 500 });
  }
}

/**
 * Basic PDF text extraction without external dependencies.
 * Handles text-based PDFs by extracting text between stream markers.
 * For image-based PDFs, returns empty string.
 */
function extractTextFromPDF(buffer: Buffer): string {
  const raw = buffer.toString('latin1');
  const textParts: string[] = [];

  // Find all text streams
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;

  while ((match = streamRegex.exec(raw)) !== null) {
    const content = match[1];

    // Extract text between parentheses (PDF text objects)
    const textRegex = /\(([^)]*)\)/g;
    let textMatch;
    while ((textMatch = textRegex.exec(content)) !== null) {
      const decoded = textMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\t/g, ' ')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\');
      if (decoded.trim()) textParts.push(decoded);
    }

    // Also check for hex-encoded text <...>
    const hexRegex = /<([0-9A-Fa-f\s]+)>/g;
    let hexMatch;
    while ((hexMatch = hexRegex.exec(content)) !== null) {
      const hex = hexMatch[1].replace(/\s/g, '');
      if (hex.length > 4 && hex.length % 2 === 0) {
        try {
          const decoded = Buffer.from(hex, 'hex').toString('utf-8');
          if (decoded.trim() && /[a-zA-Z]/.test(decoded)) textParts.push(decoded);
        } catch {}
      }
    }
  }

  // Deduplicate and join
  const seen = new Set<string>();
  return textParts
    .filter(t => {
      const normalized = t.trim().toLowerCase();
      if (normalized.length < 2 || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
