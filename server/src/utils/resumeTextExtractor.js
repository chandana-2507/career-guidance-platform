import mammoth from 'mammoth';

const MAX_TEXT_LENGTH = 15000;

async function extractPdfText(buffer) {
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  return data.text || '';
}

async function extractDocxText(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || '';
}

function extractTxtText(buffer) {
  return buffer.toString('utf-8');
}

function getExtension(filename) {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
}

export async function extractResumeText(buffer, filename, mimetype) {
  const ext = getExtension(filename);

  let text = '';
  if (ext === 'pdf' || mimetype === 'application/pdf') {
    text = await extractPdfText(buffer);
  } else if (
    ext === 'docx' ||
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    text = await extractDocxText(buffer);
  } else if (ext === 'txt' || mimetype === 'text/plain') {
    text = extractTxtText(buffer);
  } else {
    const error = new Error('Unsupported file type. Upload PDF, DOCX, or TXT.');
    error.statusCode = 400;
    throw error;
  }

  const cleaned = text.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT_LENGTH);
  if (cleaned.length < 50) {
    const error = new Error(
      'Could not extract enough text from the file. Ensure the resume is not scanned/image-only.',
    );
    error.statusCode = 400;
    throw error;
  }

  return cleaned;
}
