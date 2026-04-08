import type { TextStyle } from 'react-native';

/** Loaded in root layout via @expo-google-fonts — Plus Jakarta Sans (headline) + Inter (body/label). */
const headline = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;

const body = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const Typography = {
  /** display-lg (DESIGN.md): hero vocabulary words */
  display: { fontFamily: headline.bold, fontSize: 56, lineHeight: 62, letterSpacing: -0.4 } satisfies TextStyle,
  /** headline-md: category / big titles */
  titleLarge: { fontFamily: headline.semibold, fontSize: 28, lineHeight: 34, letterSpacing: -0.3 } satisfies TextStyle,
  /** title-lg: card headers / note titles */
  title: { fontFamily: body.medium, fontSize: 22, lineHeight: 28 } satisfies TextStyle,
  titleMedium: { fontFamily: body.medium, fontSize: 20, lineHeight: 26 } satisfies TextStyle,
  heading: { fontFamily: headline.semibold, fontSize: 18, lineHeight: 24, letterSpacing: -0.2 } satisfies TextStyle,
  subheading: { fontFamily: body.semibold, fontSize: 16, lineHeight: 22 } satisfies TextStyle,
  /** body-lg: readable long-form */
  body: { fontFamily: body.regular, fontSize: 16, lineHeight: 26 } satisfies TextStyle,
  bodyMedium: { fontFamily: body.medium, fontSize: 16, lineHeight: 26 } satisfies TextStyle,
  bodySmall: { fontFamily: body.regular, fontSize: 14, lineHeight: 22 } satisfies TextStyle,
  bodySmallMedium: { fontFamily: body.medium, fontSize: 14, lineHeight: 22 } satisfies TextStyle,
  caption: { fontFamily: body.regular, fontSize: 12, lineHeight: 18 } satisfies TextStyle,
  captionMedium: { fontFamily: body.semibold, fontSize: 12, lineHeight: 18 } satisfies TextStyle,
  captionBold: { fontFamily: body.bold, fontSize: 12, lineHeight: 18 } satisfies TextStyle,
  captionUppercase: {
    fontFamily: body.semibold,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  /** Tab labels, compact UI chrome */
  label: { fontFamily: body.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 1.2, textTransform: 'uppercase' } satisfies TextStyle,
  sectionLabel: {
    fontFamily: body.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  numericLarge: { fontFamily: body.bold, fontSize: 28, lineHeight: 34 } satisfies TextStyle,
  numeric: { fontFamily: body.bold, fontSize: 18, lineHeight: 24 } satisfies TextStyle,
  cardWord: { fontFamily: headline.bold, fontSize: 32, lineHeight: 38, letterSpacing: -0.3 } satisfies TextStyle,
  cardMeaning: { fontFamily: headline.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.2 } satisfies TextStyle,
  searchInput: { fontFamily: body.medium, fontSize: 16, lineHeight: 24 } satisfies TextStyle,
  input: { fontFamily: body.regular, fontSize: 16, lineHeight: 24 } satisfies TextStyle,
  inputLarge: { fontFamily: body.regular, fontSize: 18, lineHeight: 26 } satisfies TextStyle,
} as const;
