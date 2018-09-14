// Note: Thanks to Github:broofa/node-mime
const types = {
  images: [
    '*.apng', '*.bmp', '*.cgm', '*.g3', '*.gif', '*.ief', '*.jp2', '*.jpg2',
    '*.jpeg', '*.jpg', '*.jpe', '*.jpm', '*.jpx', '*.jpf', '*.ktx', '*.png',
    '*.sgi', '*.svg', '*.svgz', '*.tiff', '*.tif', '*.webp',
  ],
  videos: [
    '*.3gp', '*.3gpp', '*.3g2', '*.h261', '*.h263', '*.h264', '*.jpgv',
    '*.jpgm', '*.mj2', '*.mjp2', '*.ts', '*.mp4', '*.mp4v', '*.mpg4', '*.mpeg',
    '*.mpg', '*.mpe', '*.m1v', '*.m2v', '*.ogv', '*.qt', '*.mov', '*.webm',
  ],
  audios: [
    '*.adp', '*.au', '*.snd', '*.mid', '*.midi', '*.kar', '*.rmi', '*.m4a',
    '*.mp4a', '*.mpga', '*.mp2', '*.mp2a', '*.mp3', '*.m2a', '*.m3a', '*.oga',
    '*.ogg', '*.spx', '*.s3m', '*.sil', '*.wav', '*.weba', '*.xm',
  ],
  fonts: [
    '*.ttc', '*.otf', '*.ttf', '*.woff', '*.woff2', '*.eot',
  ],
  packages: [
    '*.tar', '*.bz2', '*.gz', '*.lz', '*.lzma', '*.rz', '*.xz', '*.7z',
    '*.apk', '*.cab', '*.jar', '*.pak', '*.rar', '*.wim', '*.zip', '*.bin',
    '*.pkg', '*.deb', '*.msi', '*.air',
  ],
  discs: [
    '*.dmg', '*.iso',
  ],
  codes: [
    '*.coffee', '*.css', '*.csv', '*.html', '*.htm', '*.shtml', '*.jade',
    '*.pug', '*.jsx', '*.less', '*.conf', '*.ini', '*.styl', '*.tsv', '*.vcard',
    '*.xml', '*.yaml', '*.yml', '*.js', '*.mjs', '*.json', '*.map', '*.rss',
    '*.xhtml', '*.xsl', '*.vue',
  ],
  texts: [
    '*.md', '*.txt', '*.log', '*.rtx', '*.rtf', '*.doc', '*.docx', '*.pdf',
  ],
}

export default types
