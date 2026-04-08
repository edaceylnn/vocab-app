import { Typography } from '@/constants/Typography';

import { Text, TextProps } from './Themed';

export function MonoText(props: TextProps) {
  return <Text {...props} style={[props.style, Typography.bodySmall]} />;
}
