import { Platform } from 'react-native';
import MapWeb from './Map.web';
import MapApp from './Map.native';
export default Platform.select({
  web: MapWeb,
  default: MapApp,
});
