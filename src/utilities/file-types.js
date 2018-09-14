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
    // application/mp4
    '*.mp4s', '*.m4p',
  ],
  audios: [
    '*.adp', '*.au', '*.snd', '*.mid', '*.midi', '*.kar', '*.rmi', '*.m4a',
    '*.mp4a', '*.mpga', '*.mp2', '*.mp2a', '*.mp3', '*.m2a', '*.m3a', '*.oga',
    '*.ogg', '*.spx', '*.s3m', '*.sil', '*.wav', '*.weba', '*.xm',
    // application/ogg
    '*.ogx',
  ],
  fonts: ['*.ttc', '*.otf', '*.ttf', '*.woff', '*.woff2', '*.eot'],
  packages: [
    '*.tar', '*.bz2', '*.gz', '*.lz', '*.lzma', '*.rz', '*.sz', '*.xz',
    '*.z', '*.7z', '*.apk', '*.cab', '*.jar', '*.pak', '*.rar', '*.tbz2',
    '*.wim', '*.xar', '*.yz1', '*.zip', '*.zz',
    // application/octet-stream
    '*.bin', '*.pkg', '*.deb', '*.msi',
    // application/*zip
    '*.air',
  ],
  discs: ['*.dmg', '*.iso', '*.img'],
  codes: [
    '*.manifest', '*.coffee', '*.css', '*.csv', '*.html', '*.htm', '*.shtml',
    '*.jade', '*.pug', '*.jsx', '*.less', '*.conf', '*.ini', '*.sgml', '*.sgm',
    '*.stylus', '*.styl', '*.tsv', '*.vcard', '*.vtt', '*.xml', '*.yaml',
    '*.yml',
    // application/*ml/json/script
    '*.js', '*.mjs', '*.json', '*.map', '*.rss', '*.xhtml', '*.xht', '*.dtd',
    // for others applications
    '*.vue',
  ],
  texts: [
    '*.markdown', '*.md', '*.txt', '*.text', '*.log', '*.rtx', '*.rtf', '*.man',
    // for others applications
    '*.doc', '*.docx', '*.pdf',
  ],
}

export default types
