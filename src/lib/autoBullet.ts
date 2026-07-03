export function applyAutoBullet(prev: string, next: string): string {
  const prevNorm = prev.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  let result = next
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/(^|\n)- /g, '$1• ')
    .replace(/(^|\n)\* /g, '$1• ');

  const prevLines = prevNorm.split('\n');
  const resultLines = result.split('\n');

  if (result.endsWith('\n') && resultLines.length === prevLines.length + 1) {
    const lastLine = prevLines[prevLines.length - 1];

    if (lastLine === '• ') {
      return prevNorm.slice(0, -2);
    }

    if (lastLine.startsWith('• ')) {
      return result + '• ';
    }
  }

  return result;
}
