// surfSpots.ts

export interface SurfSpot {
  slug: string;
  lat: number;
  lng: number;
  buoy: string;
  tideStation: string;
  facingDirection: number;
  exposure: 'low' | 'medium' | 'high';
  bathymetry: 'shelf' | 'steep' | 'canyon' | 'point' | 'reef';
  cdipStation?: string;
}

export const surfSpots: SurfSpot[] = [
  { slug: 'imperial-beach', lat: 32.5784, lng: -117.1288, buoy: '46232', tideStation: '9410170', facingDirection: 240, exposure: 'high', bathymetry: 'shelf', cdipStation: '100' },
  { slug: 'coronado', lat: 32.6859, lng: -117.1831, buoy: '46232', tideStation: '9410170', facingDirection: 180, exposure: 'low', bathymetry: 'shelf', cdipStation: '093' },
  { slug: 'point-loma', lat: 32.6736, lng: -117.2428, buoy: '46232', tideStation: '9410170', facingDirection: 255, exposure: 'medium', bathymetry: 'steep', cdipStation: '073' },
  { slug: 'ocean-beach', lat: 32.7482, lng: -117.2527, buoy: '46232', tideStation: '9410170', facingDirection: 255, exposure: 'high', bathymetry: 'shelf', cdipStation: '073' },
  { slug: 'mission-beach', lat: 32.7701, lng: -117.2525, buoy: '46232', tideStation: '9410230', facingDirection: 255, exposure: 'medium', bathymetry: 'shelf', cdipStation: '073' },
  { slug: 'pacific-beach', lat: 32.8006, lng: -117.2590, buoy: '46232', tideStation: '9410230', facingDirection: 255, exposure: 'medium', bathymetry: 'shelf', cdipStation: '073' },
  { slug: 'la-jolla-shores', lat: 32.8570, lng: -117.2565, buoy: '46254', tideStation: '9410230', facingDirection: 270, exposure: 'low', bathymetry: 'shelf', cdipStation: '073' },
  { slug: 'blacks-beach', lat: 32.8880, lng: -117.2540, buoy: '46254', tideStation: '9410230', facingDirection: 270, exposure: 'high', bathymetry: 'canyon', cdipStation: '073' },
  { slug: 'del-mar', lat: 32.9595, lng: -117.2653, buoy: '46254', tideStation: '9410230', facingDirection: 225, exposure: 'medium', bathymetry: 'shelf', cdipStation: '073' },
  { slug: 'cardiff', lat: 33.0203, lng: -117.2780, buoy: '46254', tideStation: '9410230', facingDirection: 225, exposure: 'medium', bathymetry: 'shelf', cdipStation: '073' },
  { slug: 'swamis', lat: 33.0361, lng: -117.2922, buoy: '46254', tideStation: '9410230', facingDirection: 270, exposure: 'high', bathymetry: 'canyon', cdipStation: '073' },
  { slug: 'encinitas', lat: 33.0369, lng: -117.2910, buoy: '46254', tideStation: '9410230', facingDirection: 270, exposure: 'high', bathymetry: 'canyon', cdipStation: '073' },
  { slug: 'carlsbad', lat: 33.1581, lng: -117.3506, buoy: '46225', tideStation: '9410306', facingDirection: 225, exposure: 'medium', bathymetry: 'shelf', cdipStation: '191' },
  { slug: 'oceanside', lat: 33.1959, lng: -117.3795, buoy: '46225', tideStation: '9410306', facingDirection: 225, exposure: 'high', bathymetry: 'shelf', cdipStation: '191' },
  { slug: 'san-clemente', lat: 33.4264, lng: -117.6210, buoy: '46223', tideStation: '9410660', facingDirection: 225, exposure: 'high', bathymetry: 'steep', cdipStation: '187' },
  { slug: 'salt-creek', lat: 33.4747, lng: -117.7206, buoy: '46223', tideStation: '9410660', facingDirection: 225, exposure: 'medium', bathymetry: 'steep', cdipStation: '187' },
  { slug: 'dana-point', lat: 33.4672, lng: -117.6981, buoy: '46223', tideStation: '9410660', facingDirection: 225, exposure: 'low', bathymetry: 'shelf', cdipStation: '187' },
  { slug: 'newport-beach', lat: 33.6189, lng: -117.9298, buoy: '46222', tideStation: '9410580', facingDirection: 225, exposure: 'low', bathymetry: 'shelf', cdipStation: '187' },
  { slug: 'huntington-beach', lat: 33.6595, lng: -118.0006, buoy: '46222', tideStation: '9410580', facingDirection: 225, exposure: 'medium', bathymetry: 'shelf', cdipStation: '073' },
  { slug: 'morro-bay', lat: 35.3733, lng: -120.8595, buoy: '46259', tideStation: '9412110', facingDirection: 295, exposure: 'high', bathymetry: 'shelf', cdipStation: '155' },
  { slug: 'pismo-beach', lat: 35.1428, lng: -120.6413, buoy: '46259', tideStation: '9412110', facingDirection: 270, exposure: 'medium', bathymetry: 'shelf', cdipStation: '155' },
  { slug: 'santa-cruz', lat: 36.9514, lng: -122.0255, buoy: '46042', tideStation: '9413745', facingDirection: 270, exposure: 'medium', bathymetry: 'point', cdipStation: '204' },
  { slug: 'pleasure-point', lat: 36.9561, lng: -121.9788, buoy: '46042', tideStation: '9413745', facingDirection: 210, exposure: 'medium', bathymetry: 'point', cdipStation: '204' },
  { slug: 'half-moon-bay', lat: 37.4919, lng: -122.4967, buoy: '46012', tideStation: '9414131', facingDirection: 295, exposure: 'high', bathymetry: 'reef', cdipStation: '157' },
  { slug: 'ocean-beach-sf', lat: 37.7599, lng: -122.5139, buoy: '46026', tideStation: '9414290', facingDirection: 270, exposure: 'high', bathymetry: 'shelf', cdipStation: '029' },
  { slug: 'bolinas', lat: 37.9116, lng: -122.6864, buoy: '46026', tideStation: '9415020', facingDirection: 225, exposure: 'low', bathymetry: 'shelf', cdipStation: '029' },
  { slug: 'salmon-creek', lat: 38.3369, lng: -123.0597, buoy: '46014', tideStation: '9418024', facingDirection: 300, exposure: 'high', bathymetry: 'shelf', cdipStation: '029' },
  { slug: 'truettner-point', lat: 41.0598, lng: -124.1427, buoy: '46027', tideStation: '9418767', facingDirection: 295, exposure: 'high', bathymetry: 'shelf', cdipStation: '033' },
];
