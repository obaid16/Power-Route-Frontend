import { useNavigation } from '@react-navigation/native';

export function useMainStackNav() {
  const nav = useNavigation();
  const parent = nav.getParent();
  if (!parent) {
    return nav;
  }
  return parent;
}
