export const cameraFeeds = [
  {
    id: 'CAM-NH44-04-MEDCHAL',
    name: 'CAM-NH44-04-MEDCHAL',
    location: 'Medchal',
    status: 'ACTIVE',
    videoUrl: 'https://res.cloudinary.com/fikkfcud/video/upload/v1790573893/13450758_1080_1920_30fps.mp4',
  },
  {
    id: 'CAM-NH44-05-JADCHERLA',
    name: 'CAM-NH44-05-JADCHERLA',
    location: 'Jadcherla',
    status: 'ACTIVE',
    videoUrl: 'https://res.cloudinary.com/fikkfcud/video/upload/v1790573893/18247785-hd_1080_1920_30fps.mp4',
  },
  {
    id: 'CAM-NH44-06-TOLLPLAZA',
    name: 'CAM-NH44-06-TOLLPLAZA',
    location: 'Toll Plaza',
    status: 'ACTIVE',
    videoUrl: 'https://res.cloudinary.com/fikkfcud/video/upload/v1790573891/18522781-uhd_2160_3840_30fps.mp4',
  },
  {
    id: 'CAM-NH44-02-SHADNAGAR',
    name: 'CAM-NH44-02-SHADNAGAR',
    location: 'Shadnagar',
    status: 'ACTIVE',
    videoUrl: 'https://res.cloudinary.com/fikkfcud/video/upload/v1790573891/5124507-hd_1920_1080_30fps.mp4',
  },
  {
    id: 'CAM-NH44-03-RINGROAD',
    name: 'CAM-NH44-03-RINGROAD',
    location: 'Ring Road',
    status: 'ACTIVE',
    videoUrl: 'https://res.cloudinary.com/fikkfcud/video/upload/v1790573891/18220639-hd_1080_1920_30fps.mp4',
  },
  {
    id: 'CAM-NH44-01-SHAMSHABAD',
    name: 'CAM-NH44-01-SHAMSHABAD',
    location: 'Shamshabad',
    status: 'ACTIVE',
    videoUrl: 'https://res.cloudinary.com/fikkfcud/video/upload/v1790574116/15162874_3840_2160_50fps.mp4',
  },
]

export function getCameraFeed(camera) {
  if (!camera) return cameraFeeds[0]
  return cameraFeeds.find((feed) => feed.id === camera.id || feed.name === camera.name) || {
    ...camera,
    name: camera.name || camera.id,
    location: camera.location || 'NH-44 Corridor',
    status: camera.status || 'ACTIVE',
    videoUrl: camera.videoUrl || camera.streamUrl || '',
  }
}
