// Note: Thanks to Github:broofa/node-mime

const types = [
  {
    type: 'image',
    rules: [
      '*.apng', '*.bmp', '*.cgm', '*.g3', '*.gif', '*.ief', '*.jp2', '*.jpg2',
      '*.jpeg', '*.jpg', '*.jpe', '*.jpm', '*.jpx', '*.jpf', '*.ktx', '*.png',
      '*.sgi', '*.svg', '*.svgz', '*.tiff', '*.tif', '*.webp',
    ],
  },
  {
    type: 'video',
    rules: [
      '*.3gp', '*.3gpp', '*.3g2', '*.h261', '*.h263', '*.h264', '*.jpgv',
      '*.jpgm', '*.mj2', '*.mjp2', '*.ts', '*.mp4', '*.mp4v', '*.mpg4', '*.mpeg',
      '*.mpg', '*.mpe', '*.m1v', '*.m2v', '*.ogv', '*.qt', '*.mov', '*.webm',
    ],
  },
  {
    type: 'audio',
    rules: [
      '*.adp', '*.au', '*.snd', '*.mid', '*.midi', '*.kar', '*.rmi', '*.m4a',
      '*.mp4a', '*.mpga', '*.mp2', '*.mp2a', '*.mp3', '*.m2a', '*.m3a', '*.oga',
      '*.ogg', '*.spx', '*.s3m', '*.sil', '*.wav', '*.weba', '*.xm',
    ],
  },
]

export default types
