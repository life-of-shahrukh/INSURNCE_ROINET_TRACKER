import { SymbolView } from 'expo-symbols';
import type { SymbolViewProps } from 'expo-symbols';
import type { ColorValue } from 'react-native';

type SymbolName = SymbolViewProps['name'];

interface TabIconOptions {
  default: SymbolName;
  focused: SymbolName;
}

function createTabBarIcon(icons: TabIconOptions) {
  return ({ color, focused }: { color: ColorValue; focused: boolean; size: number }) => (
    <SymbolView
      name={focused ? icons.focused : icons.default}
      size={22}
      tintColor={color}
      weight={focused ? 'semibold' : 'regular'}
    />
  );
}

export const dashboardTabIcon = createTabBarIcon({
  default: { ios: 'square.grid.2x2', android: 'space_dashboard', web: 'space_dashboard' },
  focused: { ios: 'square.grid.2x2.fill', android: 'space_dashboard', web: 'space_dashboard' },
});

export const dealsTabIcon = createTabBarIcon({
  default: { ios: 'briefcase', android: 'work', web: 'work' },
  focused: { ios: 'briefcase.fill', android: 'work', web: 'work' },
});

export const renewalsTabIcon = createTabBarIcon({
  default: { ios: 'arrow.triangle.2.circlepath', android: 'autorenew', web: 'autorenew' },
  focused: { ios: 'arrow.triangle.2.circlepath', android: 'autorenew', web: 'autorenew' },
});

export const leadsTabIcon = createTabBarIcon({
  default: { ios: 'rectangle.3.group', android: 'view_kanban', web: 'view_kanban' },
  focused: { ios: 'rectangle.3.group.fill', android: 'view_kanban', web: 'view_kanban' },
});

export const moreTabIcon = createTabBarIcon({
  default: { ios: 'ellipsis.circle', android: 'more_horiz', web: 'more_horiz' },
  focused: { ios: 'ellipsis.circle.fill', android: 'more_horiz', web: 'more_horiz' },
});
