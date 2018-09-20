import {remote} from 'electron'

const variables = [
  {
    id: 'reex',
    path: remote.app.getAppPath(),
  },
  {
    id: 'home',
    icon: '@feather/icon-home',
    path: remote.app.getPath('home'),
  },
  {
    id: 'appdata',
    path: remote.app.getPath('appData'),
  },
  {
    id: 'temp',
    path: remote.app.getPath('temp'),
  },
  {
    id: 'desktop',
    name: 'Desktop#!1',
    icon: '@feather/icon-monitor',
    path: remote.app.getPath('desktop'),
  },
  {
    id: 'documents',
    name: 'Documents#!2',
    icon: '@feather/icon-file-text',
    path: remote.app.getPath('documents'),
  },
  {
    id: 'downloads',
    name: 'Downloads#!3',
    icon: '@feather/icon-download',
    path: remote.app.getPath('downloads'),
  },
  {
    id: 'music',
    name: 'Music#!4',
    icon: '@feather/icon-music',
    path: remote.app.getPath('music'),
  },
  {
    id: 'pictures',
    name: 'Pictures#!5',
    icon: '@feather/icon-image',
    path: remote.app.getPath('pictures'),
  },
  {
    id: 'videos',
    name: 'Videos#!6',
    icon: '@feather/icon-film',
    path: remote.app.getPath('videos'),
  },
]

export default variables
