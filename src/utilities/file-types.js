// Note: Thanks to Github:broofa/node-mime
const types = {
  images: [
    '.apng', '.bmp', '.cgm', '.g3', '.gif', '.ief', '.jp2', '.jpg2',
    '.jpeg', '.jpg', '.jpe', '.jpm', '.jpx', '.jpf', '.ktx', '.png',
    '.sgi', '.svg', '.svgz', '.tiff', '.tif', '.webp',
  ],
  videos: [
    '.3gp', '.3gpp', '.3g2', '.h261', '.h263', '.h264', '.jpgv', '.jpgm',
    '.mj2', '.mjp2', '.ts', '.mp4', '.mp4v', '.mpg4', '.mpeg', '.mpg',
    '.mpe', '.m1v', '.m2v', '.ogv', '.qt', '.mov', '.webm',
    // application/mp4
    '.mp4s', '.m4p',
  ],
  audios: [
    '.adp', '.au', '.snd', '.mid', '.midi', '.kar', '.rmi', '.m4a',
    '.mp4a', '.mpga', '.mp2', '.mp2a', '.mp3', '.m2a', '.m3a', '.oga',
    '.ogg', '.spx', '.s3m', '.sil', '.wav', '.weba', '.xm',
    // application/ogg
    '.ogx',
  ],
  fonts: ['.ttc', '.otf', '.ttf', '.woff', '.woff2', '.eot'],
  codes: [
    '.appcache', '.manifest', '.coffee', '.litcoffee', '.css', '.csv',
    '.html', '.htm', '.shtml', '.jade', '.jsx', '.less',
    '.mml', '.conf', '.def', '.in', '.ini', '.sgml', '.sgm', '.shex',
    '.slim', '.slm', '.stylus', '.styl', '.tsv', '.ttl', '.vcard', '.vtt',
    '.xml', '.yaml', '.yml',
    // application/*ml, application/*json, application/*script
    '.atom', '.atomcat', '.atomsvc', '.ccxml', '.mpd', '.davmount',
    '.dbk', '.xdssc', '.ecma', '.emma', '.geojson', '.gml', '.gpx', '.hjson',
    '.ink', '.inkml', '.js', '.mjs', '.json', '.map', '.json5', '.jsonml',
    '.jsonld', '.lostxml', '.mads', '.mrcx', '.mathml', '.mscml',
    '.metalink', '.meta4', '.mets', '.mods', '.omdoc', '.xer',
    '.pls', '.ai', '.eps', '.ps', '.pskcxml', '.raml', '.rdf', '.rif',
    '.rl', '.rld', '.rs', '.rsd', '.rss', '.sbml', '.shf', '.smi',
    '.smil', '.srx', '.grxml', '.sru', '.ssdl', '.ssml', '.tei', '.teicorpus',
    '.tfi', '.vxml', '.wsdl', '.wspolicy', '.xaml', '.xdf', '.xenc', '.xhtml',
    '.xht', '.xsl', '.xsd', '.rng', '.dtd', '.xop', '.xpl', '.xslt',
    '.xspf', '.mxml', '.xhvml', '.xvml', '.xvm', '.yin',
  ],
  texts: [
    '.ics', '.ifb', '.markdown', '.md', '.n3', '.txt', '.text', '.list',
    '.log', '.rtx', '.rtf', '.t', '.tr', '.roff', '.man', '.me',
    '.ms', '.uri', '.uris', '.urls',
    // application/msword
    '.doc', '.dot',
    // application/onenote
    '.onetoc', '.onetoc2', '.onetmp', '.onepkg',
    // application/pdf
    '.pdf',
  ]
}

export default types
